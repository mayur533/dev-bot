import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import settings from '../config/settings';
import { ChatSession, Project, Context, Task } from '../models/types';

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.dirname(settings.databasePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(settings.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables(): void {
    // Chat Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        messages TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        total_tokens INTEGER DEFAULT 0,
        context_summary TEXT,
        project_id TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        description TEXT,
        sessions TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        total_tokens INTEGER DEFAULT 0,
        context_summary TEXT,
        metadata TEXT
      )
    `);

    // Contexts table (for context management)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        project_id TEXT,
        messages TEXT NOT NULL,
        summary TEXT,
        total_tokens INTEGER DEFAULT 0,
        max_tokens INTEGER DEFAULT 1000000,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_agent TEXT,
        input TEXT,
        output TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_project ON chat_sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at);
      CREATE INDEX IF NOT EXISTS idx_contexts_session ON contexts(session_id);
      CREATE INDEX IF NOT EXISTS idx_contexts_project ON contexts(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
  }

  // Chat Sessions
  createSession(session: ChatSession): void {
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id, title, messages, created_at, updated_at, total_tokens, context_summary, project_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.title,
      JSON.stringify(session.messages),
      session.createdAt,
      session.updatedAt,
      session.totalTokens,
      session.contextSummary || null,
      session.projectId || null
    );
  }

  getSession(id: string): ChatSession | null {
    const stmt = this.db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalTokens: row.total_tokens,
      contextSummary: row.context_summary,
      projectId: row.project_id
    };
  }

  updateSession(id: string, updates: Partial<ChatSession>): void {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.messages !== undefined) {
      fields.push('messages = ?');
      values.push(JSON.stringify(updates.messages));
    }
    if (updates.totalTokens !== undefined) {
      fields.push('total_tokens = ?');
      values.push(updates.totalTokens);
    }
    if (updates.contextSummary !== undefined) {
      fields.push('context_summary = ?');
      values.push(updates.contextSummary);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE chat_sessions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  getAllSessions(): ChatSession[] {
    const stmt = this.db.prepare('SELECT * FROM chat_sessions ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalTokens: row.total_tokens,
      contextSummary: row.context_summary,
      projectId: row.project_id
    }));
  }

  deleteSession(id: string): void {
    const stmt = this.db.prepare('DELETE FROM chat_sessions WHERE id = ?');
    stmt.run(id);
  }

  // Projects
  createProject(project: Project): void {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, path, description, sessions, created_at, updated_at, total_tokens, context_summary, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      project.id,
      project.name,
      project.path,
      project.description || null,
      JSON.stringify(project.sessions),
      project.createdAt,
      project.updatedAt,
      project.totalTokens,
      project.contextSummary || null,
      JSON.stringify(project.metadata || {})
    );
  }

  getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      sessions: JSON.parse(row.sessions),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalTokens: row.total_tokens,
      contextSummary: row.context_summary,
      metadata: JSON.parse(row.metadata)
    };
  }

  getProjectByPath(path: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE path = ?');
    const row = stmt.get(path) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      sessions: JSON.parse(row.sessions),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalTokens: row.total_tokens,
      contextSummary: row.context_summary,
      metadata: JSON.parse(row.metadata)
    };
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.sessions !== undefined) {
      fields.push('sessions = ?');
      values.push(JSON.stringify(updates.sessions));
    }
    if (updates.totalTokens !== undefined) {
      fields.push('total_tokens = ?');
      values.push(updates.totalTokens);
    }
    if (updates.contextSummary !== undefined) {
      fields.push('context_summary = ?');
      values.push(updates.contextSummary);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      sessions: JSON.parse(row.sessions),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalTokens: row.total_tokens,
      contextSummary: row.context_summary,
      metadata: JSON.parse(row.metadata)
    }));
  }

  deleteProject(id: string): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  // Contexts
  createContext(context: Context): void {
    const stmt = this.db.prepare(`
      INSERT INTO contexts (id, session_id, project_id, messages, summary, total_tokens, max_tokens, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      context.id,
      context.sessionId || null,
      context.projectId || null,
      JSON.stringify(context.messages),
      context.summary || null,
      context.totalTokens,
      context.maxTokens,
      context.createdAt,
      context.updatedAt
    );
  }

  getContext(id: string): Context | null {
    const stmt = this.db.prepare('SELECT * FROM contexts WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      sessionId: row.session_id,
      projectId: row.project_id,
      messages: JSON.parse(row.messages),
      summary: row.summary,
      totalTokens: row.total_tokens,
      maxTokens: row.max_tokens,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getContextBySession(sessionId: string): Context | null {
    const stmt = this.db.prepare('SELECT * FROM contexts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1');
    const row = stmt.get(sessionId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      sessionId: row.session_id,
      projectId: row.project_id,
      messages: JSON.parse(row.messages),
      summary: row.summary,
      totalTokens: row.total_tokens,
      maxTokens: row.max_tokens,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getContextByProject(projectId: string): Context | null {
    const stmt = this.db.prepare('SELECT * FROM contexts WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1');
    const row = stmt.get(projectId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      sessionId: row.session_id,
      projectId: row.project_id,
      messages: JSON.parse(row.messages),
      summary: row.summary,
      totalTokens: row.total_tokens,
      maxTokens: row.max_tokens,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  updateContext(id: string, updates: Partial<Context>): void {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.messages !== undefined) {
      fields.push('messages = ?');
      values.push(JSON.stringify(updates.messages));
    }
    if (updates.summary !== undefined) {
      fields.push('summary = ?');
      values.push(updates.summary);
    }
    if (updates.totalTokens !== undefined) {
      fields.push('total_tokens = ?');
      values.push(updates.totalTokens);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE contexts SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  // Tasks
  createTask(task: Task): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, project_id, session_id, title, description, type, status, assigned_agent, input, output, error, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id,
      task.projectId || null,
      task.sessionId,
      task.title,
      task.description,
      task.type,
      task.status,
      task.assignedAgent || null,
      JSON.stringify(task.input || {}),
      JSON.stringify(task.output || {}),
      task.error || null,
      task.createdAt,
      task.updatedAt,
      task.completedAt || null
    );
  }

  getTask(id: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      projectId: row.project_id,
      sessionId: row.session_id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      assignedAgent: row.assigned_agent,
      input: JSON.parse(row.input),
      output: JSON.parse(row.output),
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at
    };
  }

  getTasksBySession(sessionId: string): Task[] {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE session_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(sessionId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      sessionId: row.session_id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      assignedAgent: row.assigned_agent,
      input: JSON.parse(row.input),
      output: JSON.parse(row.output),
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at
    }));
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.output !== undefined) {
      fields.push('output = ?');
      values.push(JSON.stringify(updates.output));
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default DatabaseManager;

