import { GoogleGenAI } from '@google/genai';
import settings from '../config/settings';
import { Message, AgentResponse } from '../models/types';

/**
 * Gemini API Client with context management and token counting
 * Uses the new @google/genai SDK as per https://ai.google.dev/gemini-api/docs/libraries
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private secondaryClient?: GoogleGenAI;
  private currentApiKey: 'primary' | 'secondary' = 'primary';

  constructor() {
    this.client = new GoogleGenAI({ apiKey: settings.geminiApiKey });
    
    if (settings.geminiApiKeySecondary) {
      this.secondaryClient = new GoogleGenAI({ apiKey: settings.geminiApiKeySecondary });
    }
  }

  /**
   * Switch to secondary API key if primary fails
   */
  private switchApiKey(): void {
    if (this.secondaryClient && this.currentApiKey === 'primary') {
      this.currentApiKey = 'secondary';
      console.log('Switched to secondary API key');
    }
  }

  /**
   * Convert our Message format to Gemini's content format
   */
  private messagesToContent(messages: Message[]): any[] {
    return messages
      .filter(msg => msg.role !== 'system') // System messages handled separately
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  /**
   * Count tokens for messages
   */
  async countTokens(messages: Message[]): Promise<number> {
    try {
      const prompt = this.buildPrompt(messages);
      const result = await this.client.models.countTokens({
        model: 'gemini-2.0-flash-exp',
        contents: prompt
      });
      return result.totalTokens || 0;
    } catch (error) {
      console.error('Error counting tokens:', error);
      // Fallback: rough estimate (4 chars per token)
      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      return Math.ceil(totalChars / 4);
    }
  }

  /**
   * Generate response with context management
   */
  async generateResponse(
    messages: Message[],
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      thinking?: boolean;
    }
  ): Promise<AgentResponse> {
    try {
      // Build the full prompt with system instructions
      const fullPrompt = this.buildPrompt(messages, systemPrompt);
      
      // For thinking mode, use Gemini 2.0 Flash Thinking model
      const modelName = options?.thinking ? 'gemini-2.0-flash-thinking-exp' : 'gemini-2.0-flash-exp';

      // Generate response using the new SDK
      const result = await this.client.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 8192,
        }
      });

      const text = result.text || '';

      // Count tokens used (simplified for now)
      const inputTokens = await this.countTokens(messages);
      const outputTokens = this.estimateTokens(text);

      return {
        agent: 'gemini',
        content: text,
        tokens: inputTokens + outputTokens,
      };

    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Try secondary key if available
      if (this.currentApiKey === 'primary' && this.secondaryClient) {
        this.switchApiKey();
        // Use secondary client
        try {
          const result = await this.secondaryClient!.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: this.buildPrompt(messages, systemPrompt),
            config: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 8192,
            }
          });
          
          return {
            agent: 'gemini',
            content: result.text || '',
            tokens: 0,
          };
        } catch (secondaryError: any) {
          throw new Error(`Gemini API error (both keys failed): ${secondaryError.message}`);
        }
      }
      
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Generate structured output using JSON mode
   */
  async generateStructuredOutput<T = any>(
    messages: Message[],
    schema: any,
    systemPrompt?: string
  ): Promise<T> {
    try {
      const fullPrompt = this.buildPrompt(messages, systemPrompt);
      
      const result = await this.client.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: fullPrompt,
        config: {
          temperature: 0.3, // Lower temperature for structured output
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = result.text || '{}';
      return JSON.parse(text);

    } catch (error: any) {
      console.error('Structured output error:', error);
      throw new Error(`Failed to generate structured output: ${error.message}`);
    }
  }

  /**
   * Generate with function calling (tools)
   */
  async generateWithTools(
    messages: Message[],
    tools: any[],
    systemPrompt?: string
  ): Promise<AgentResponse> {
    try {
      const fullPrompt = this.buildPrompt(messages, systemPrompt);
      
      const result = await this.client.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: fullPrompt,
        tools: tools,
      });

      return {
        agent: 'gemini',
        content: result.text || '',
        tokens: 0,
      };

    } catch (error: any) {
      console.error('Function calling error:', error);
      throw new Error(`Function calling failed: ${error.message}`);
    }
  }

  /**
   * Summarize context to reduce token usage
   */
  async summarizeContext(messages: Message[]): Promise<string> {
    const summaryPrompt = `
You are a context summarization AI. Your task is to create a concise but comprehensive summary of the conversation below.

The summary should:
1. Capture all key information, decisions, and context
2. Preserve technical details, code snippets (as references), and important specifications
3. Maintain chronological flow of the conversation
4. Be significantly shorter than the original (aim for 30-40% of original length)
5. Be written in a way that allows seamless continuation of the conversation

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Provide ONLY the summary, no preamble or explanation.
`;

    const result = await this.generateResponse([{
      id: 'summary',
      role: 'user',
      content: summaryPrompt,
      timestamp: Date.now(),
    }], undefined, { temperature: 0.3 });

    return result.content;
  }

  /**
   * Build full prompt with system instructions
   */
  private buildPrompt(messages: Message[], systemPrompt?: string): string {
    let prompt = '';
    
    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    }
    
    // Add conversation history
    prompt += messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    return prompt;
  }

  /**
   * Estimate tokens for a string (fallback method)
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
let geminiInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiInstance) {
    geminiInstance = new GeminiClient();
  }
  return geminiInstance;
}

export default GeminiClient;

