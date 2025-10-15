// Core type definitions for the AI Platform

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'command' | 'code' | 'mixed';
  language?: string;
  parts?: ContentPart[];
  timestamp: number;
  tokens?: number;
}

export interface ContentPart {
  type: 'text' | 'command' | 'code';
  content: string;
  language?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  contextSummary?: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  sessions: string[]; // Session IDs
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  contextSummary?: string;
  metadata?: Record<string, any>;
}

export interface Context {
  id: string;
  sessionId?: string;
  projectId?: string;
  messages: Message[];
  summary?: string;
  totalTokens: number;
  maxTokens: number;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  projectId?: string;
  sessionId: string;
  title: string;
  description: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'analysis';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: 'coordinator' | 'frontend' | 'backend';
  input?: any;
  output?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface AgentResponse {
  agent: string;
  content: string;
  tasks?: Task[];
  code?: {
    language: string;
    content: string;
    filename?: string;
  }[];
  thinking?: string;
  tokens: number;
}

export interface ProjectBrief {
  description: string;
  requirements?: string[];
  features?: string[];
  tech_stack?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
  };
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cached?: number;
}

export interface ContextStats {
  totalTokens: number;
  maxTokens: number;
  percentageUsed: number;
  needsSummarization: boolean;
  messagesCount: number;
}

