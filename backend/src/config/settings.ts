import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export interface Settings {
  // API Keys
  geminiApiKey: string;
  geminiApiKeySecondary?: string;
  
  // Server
  port: number;
  nodeEnv: string;
  apiBaseUrl: string;
  frontendUrl: string;
  
  // Context
  maxContextTokens: number;
  contextSummarizationThreshold: number;
  minContextTokensAfterSummary: number;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Database
  databasePath: string;
  
  // Logging
  logLevel: string;
  logFile: string;
}

const settings: Settings = {
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiApiKeySecondary: process.env.GEMINI_API_KEY_SECONDARY,
  
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Context
  maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS || '1000000', 10),
  contextSummarizationThreshold: parseFloat(process.env.CONTEXT_SUMMARIZATION_THRESHOLD || '0.9'),
  minContextTokensAfterSummary: parseInt(process.env.MIN_CONTEXT_TOKENS_AFTER_SUMMARY || '100000', 10),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Database
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../data/ai_platform.db'),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || path.join(__dirname, '../../logs/backend.log'),
};

// Validate required settings
export function validateSettings(): void {
  if (!settings.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required in environment variables');
  }
}

export default settings;

