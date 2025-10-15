import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db';
import { getGeminiClient } from '../services/gemini';
import { Message, Context, ContextStats } from '../models/types';
import settings from '../config/settings';

/**
 * Context Manager
 * Handles per-project and per-chat context isolation with automatic summarization
 */
export class ContextManager {
  private db = getDatabase();
  private gemini = getGeminiClient();

  /**
   * Create a new context for a session or project
   */
  async createContext(sessionId?: string, projectId?: string): Promise<Context> {
    const context: Context = {
      id: uuidv4(),
      sessionId,
      projectId,
      messages: [],
      totalTokens: 0,
      maxTokens: settings.maxContextTokens,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.db.createContext(context);
    return context;
  }

  /**
   * Get context by session ID
   */
  async getContextBySession(sessionId: string): Promise<Context> {
    let context = this.db.getContextBySession(sessionId);
    
    if (!context) {
      context = await this.createContext(sessionId);
    }
    
    return context;
  }

  /**
   * Get context by project ID
   */
  async getContextByProject(projectId: string): Promise<Context> {
    let context = this.db.getContextByProject(projectId);
    
    if (!context) {
      context = await this.createContext(undefined, projectId);
    }
    
    return context;
  }

  /**
   * Add message to context with automatic token counting
   */
  async addMessage(contextId: string, message: Message): Promise<void> {
    const context = this.db.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    // Count tokens for the new message
    const messageTokens = await this.gemini.countTokens([message]);
    message.tokens = messageTokens;

    // Add message to context
    context.messages.push(message);
    context.totalTokens += messageTokens;
    context.updatedAt = Date.now();

    // Check if summarization is needed
    const stats = this.getContextStats(context);
    if (stats.needsSummarization) {
      console.log(`Context ${contextId} needs summarization (${stats.percentageUsed.toFixed(1)}% used)`);
      await this.summarizeContext(contextId);
    } else {
      // Just update the context
      this.db.updateContext(contextId, {
        messages: context.messages,
        totalTokens: context.totalTokens,
      });
    }
  }

  /**
   * Get context statistics
   */
  getContextStats(context: Context): ContextStats {
    const percentageUsed = (context.totalTokens / context.maxTokens) * 100;
    const needsSummarization = percentageUsed >= (settings.contextSummarizationThreshold * 100);

    return {
      totalTokens: context.totalTokens,
      maxTokens: context.maxTokens,
      percentageUsed,
      needsSummarization,
      messagesCount: context.messages.length,
    };
  }

  /**
   * Summarize context when it reaches threshold
   */
  async summarizeContext(contextId: string): Promise<void> {
    const context = this.db.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    console.log(`Summarizing context ${contextId} (${context.messages.length} messages, ${context.totalTokens} tokens)`);

    try {
      // Generate summary of all messages
      const summary = await this.gemini.summarizeContext(context.messages);
      
      // Create a summary message
      const summaryMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `[CONTEXT SUMMARY]\n${summary}\n\n[RECENT MESSAGES FOLLOW]`,
        type: 'text',
        timestamp: Date.now(),
      };

      // Count tokens for summary
      const summaryTokens = await this.gemini.countTokens([summaryMessage]);
      summaryMessage.tokens = summaryTokens;

      // Keep only recent messages (last 10)
      const recentMessages = context.messages.slice(-10);
      const recentTokens = recentMessages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

      // Update context with summary and recent messages
      const newMessages = [summaryMessage, ...recentMessages];
      const newTotalTokens = summaryTokens + recentTokens;

      this.db.updateContext(contextId, {
        messages: newMessages,
        summary,
        totalTokens: newTotalTokens,
      });

      console.log(`Context summarized: ${context.messages.length} → ${newMessages.length} messages, ${context.totalTokens} → ${newTotalTokens} tokens`);
      
      // Update session/project context summary
      if (context.sessionId) {
        const session = this.db.getSession(context.sessionId);
        if (session) {
          this.db.updateSession(context.sessionId, {
            contextSummary: summary,
            totalTokens: newTotalTokens,
          });
        }
      }
      
      if (context.projectId) {
        const project = this.db.getProject(context.projectId);
        if (project) {
          this.db.updateProject(context.projectId, {
            contextSummary: summary,
            totalTokens: newTotalTokens,
          });
        }
      }

    } catch (error) {
      console.error(`Error summarizing context ${contextId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages for AI generation (includes summary if exists)
   */
  async getMessagesForGeneration(contextId: string, limit?: number): Promise<Message[]> {
    const context = this.db.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    let messages = context.messages;
    
    if (limit && messages.length > limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Clear old contexts (cleanup utility)
   */
  async clearOldContexts(_olderThanDays: number = 30): Promise<number> {
    // This would require additional database methods
    // Implementation left for future enhancement
    return 0;
  }

  /**
   * Get context summary statistics
   */
  async getContextSummary(contextId: string): Promise<{
    totalMessages: number;
    totalTokens: number;
    percentageUsed: number;
    hasSummary: boolean;
    summary?: string;
  }> {
    const context = this.db.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const stats = this.getContextStats(context);

    return {
      totalMessages: context.messages.length,
      totalTokens: context.totalTokens,
      percentageUsed: stats.percentageUsed,
      hasSummary: !!context.summary,
      summary: context.summary,
    };
  }

  /**
   * Reset context (clear all messages but keep metadata)
   */
  async resetContext(contextId: string): Promise<void> {
    this.db.updateContext(contextId, {
      messages: [],
      summary: undefined,
      totalTokens: 0,
    });
  }
}

// Singleton instance
let contextManagerInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager();
  }
  return contextManagerInstance;
}

export default ContextManager;

