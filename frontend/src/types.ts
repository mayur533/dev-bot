// Type definitions for the AI Platform

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "command" | "code" | "mixed";
  language?: string; // For code blocks (e.g., "python", "javascript")
  parts?: ContentPart[]; // For mixed content
  isStreaming?: boolean;
}

export interface ContentPart {
  type: "text" | "command" | "code";
  content: string;
  language?: string;
}

export interface ChatTab {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  type: "chat" | "project";
  projectPath?: string; // For project tabs
}

export interface APIConfig {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
}

// User and Authentication types
export type UserRole = "admin" | "subadmin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

