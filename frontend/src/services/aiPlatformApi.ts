/**
 * AI Platform API Service
 * Connects frontend to the Node.js backend with AI agents
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
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
  sessions: string[];
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  contextSummary?: string;
}

export interface Task {
  id: string;
  projectId?: string;
  sessionId: string;
  title: string;
  description: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'analysis';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  output?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContextStats {
  totalTokens: number;
  maxTokens: number;
  percentageUsed: number;
  needsSummarization: boolean;
  messagesCount: number;
}

class AIPlatformAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // ============================================================================
  // CHAT SESSIONS
  // ============================================================================

  async createSession(title: string, projectId?: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAllSessions(): Promise<ChatSession[]> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions`);
    
    if (!response.ok) {
      throw new Error(`Failed to get sessions: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getSession(id: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }
    
    return response.json();
  }

  async sendMessage(
    sessionId: string,
    content: string
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
    contextStats: ContextStats;
  }> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getContextStats(sessionId: string): Promise<{
    stats: ContextStats;
    summary: any;
  }> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/context`);
    
    if (!response.ok) {
      throw new Error(`Failed to get context stats: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteSession(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  // ============================================================================
  // PROJECTS
  // ============================================================================

  async createProject(
    name: string,
    path: string,
    description?: string
  ): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, path, description }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`);
    
    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get project: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getProjectStructure(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}/structure`);
    
    if (!response.ok) {
      throw new Error(`Failed to get project structure: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ============================================================================
  // AGENTS
  // ============================================================================

  async analyzeProject(
    projectBrief: string,
    sessionId: string,
    projectId?: string
  ): Promise<{
    analysis: string;
    tasks: Task[];
    architecture: any;
  }> {
    const response = await fetch(`${this.baseUrl}/api/agent/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectBrief, sessionId, projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze project: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeTask(taskId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/agent/execute-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute task: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getTasksBySession(sessionId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseUrl}/api/agent/tasks/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ============================================================================
  // FILES
  // ============================================================================

  async readFile(filePath: string): Promise<{ content: string }> {
    const response = await fetch(`${this.baseUrl}/api/files/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }
    
    return response.json();
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/files/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, content }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to write file: ${response.statusText}`);
    }
  }

  async analyzeFile(filePath: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/files/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze file: ${response.statusText}`);
    }
    
    return response.json();
  }

  async replaceInFile(
    filePath: string,
    searchPattern: string,
    replacement: string,
    global: boolean = false
  ): Promise<{ success: boolean; replacements: number }> {
    const response = await fetch(`${this.baseUrl}/api/files/replace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, searchPattern, replacement, global }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to replace in file: ${response.statusText}`);
    }
    
    return response.json();
  }

  async replaceFileContent(filePath: string, newContent: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/files/replace-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, newContent }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to replace file content: ${response.statusText}`);
    }
  }

  // ============================================================================
  // COMMANDS
  // ============================================================================

  async requestCommand(
    command: string,
    workingDirectory?: string
  ): Promise<{
    id: string;
    command: string;
    workingDirectory: string;
    dangerous: boolean;
    reason?: string;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/commands/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, workingDirectory }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to request command: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getPendingCommands(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/commands/pending`);
    
    if (!response.ok) {
      throw new Error(`Failed to get pending commands: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeCommand(
    commandId: string,
    confirmed: boolean
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    command: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/commands/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandId, confirmed }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute command: ${response.statusText}`);
    }
    
    return response.json();
  }

  async executeCommandDirect(
    command: string,
    workingDirectory?: string
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    command: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/commands/execute-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, workingDirectory }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute command: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCommandExamples(): Promise<Array<{ command: string; description: string }>> {
    const response = await fetch(`${this.baseUrl}/api/commands/examples`);
    
    if (!response.ok) {
      throw new Error(`Failed to get command examples: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Singleton instance
const aiPlatformApi = new AIPlatformAPI();

export default aiPlatformApi;

