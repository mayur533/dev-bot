import { GoogleGenerativeAI, GenerativeModel, Content, Part, CountTokensResponse } from '@google/genai';
import settings from '../config/settings';
import { Message, TokenUsage, AgentResponse } from '../models/types';

/**
 * Gemini API Client with context management and token counting
 * Uses the new @google/genai SDK as per https://ai.google.dev/gemini-api/docs/libraries
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private secondaryClient?: GoogleGenerativeAI;
  private model: GenerativeModel;
  private currentApiKey: 'primary' | 'secondary' = 'primary';

  constructor() {
    this.client = new GoogleGenerativeAI(settings.geminiApiKey);
    
    if (settings.geminiApiKeySecondary) {
      this.secondaryClient = new GoogleGenerativeAI(settings.geminiApiKeySecondary);
    }

    // Initialize with Gemini 2.0 Flash model (best for general tasks)
    this.model = this.client.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Switch to secondary API key if primary fails
   */
  private switchApiKey(): void {
    if (this.secondaryClient && this.currentApiKey === 'primary') {
      this.currentApiKey = 'secondary';
      this.model = this.secondaryClient.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      console.log('Switched to secondary API key');
    }
  }

  /**
   * Convert our Message format to Gemini's Content format
   */
  private messagesToContent(messages: Message[]): Content[] {
    return messages
      .filter(msg => msg.role !== 'system') // System messages handled separately
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }] as Part[],
      }));
  }

  /**
   * Count tokens for messages
   */
  async countTokens(messages: Message[]): Promise<number> {
    try {
      const contents = this.messagesToContent(messages);
      const result: CountTokensResponse = await this.model.countTokens({ contents });
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
      
      // Configure model for this request
      const config = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
      };

      // For thinking mode, use Gemini 2.0 Flash Thinking model
      const modelName = options?.thinking ? 'gemini-2.0-flash-thinking-exp' : 'gemini-2.0-flash-exp';
      const model = this.client.getGenerativeModel({ 
        model: modelName,
        generationConfig: config,
      });

      // Generate response
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      // Count tokens used
      const inputTokens = await this.countTokens(messages);
      const outputTokens = await this.countTokens([{
        id: 'temp',
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      }]);

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
        return this.generateResponse(messages, systemPrompt, options);
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
      
      const model = this.client.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3, // Lower temperature for structured output
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

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
      
      const model = this.client.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        tools: tools,
      });

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      
      // Check if function call was made
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        return {
          agent: 'gemini',
          content: JSON.stringify(functionCalls),
          tokens: 0, // Will be counted separately
        };
      }

      return {
        agent: 'gemini',
        content: response.text(),
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

