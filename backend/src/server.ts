import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import settings, { validateSettings } from './config/settings';
import { getDatabase } from './database/db';
import { getContextManager } from './context/contextManager';
import { getGeminiClient } from './services/gemini';
import { getCoordinatorAgent } from './agents/coordinatorAgent';
import { getFrontendAgent } from './agents/frontendAgent';
import { getBackendAgent } from './agents/backendAgent';
import { getFileTools } from './tools/fileTools';
import { getCommandTools } from './tools/commandTools';
import { Message, ChatSession, Project } from './models/types';

// Initialize app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: settings.frontendUrl }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: settings.rateLimitWindowMs,
  max: settings.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Initialize services
const db = getDatabase();
const contextManager = getContextManager();
const gemini = getGeminiClient();
const coordinator = getCoordinatorAgent();
const frontendAgent = getFrontendAgent();
const backendAgent = getBackendAgent();
const fileTools = getFileTools();
const commandTools = getCommandTools();

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

/**
 * POST /api/chat/sessions - Create new chat session
 */
app.post('/api/chat/sessions', async (req: Request, res: Response) => {
  try {
    const { title, projectId } = req.body;
    
    const session: ChatSession = {
      id: uuidv4(),
      title: title || 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
      projectId,
    };
    
    db.createSession(session);
    
    // Create context for this session
    await contextManager.createContext(session.id, projectId);
    
    res.json(session);
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/sessions - Get all sessions
 */
app.get('/api/chat/sessions', (_req: Request, res: Response) => {
  try {
    const sessions = db.getAllSessions();
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/sessions/:id - Get session by ID
 */
app.get('/api/chat/sessions/:id', (req: Request, res: Response) => {
  try {
    const session = db.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/sessions/:id/messages - Send message
 */
app.post('/api/chat/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const { content, role = 'user' } = req.body;
    const sessionId = req.params.id;
    
    const session = db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      role: role as 'user' | 'assistant',
      content,
      timestamp: Date.now(),
    };
    
    // Get context
    const context = await contextManager.getContextBySession(sessionId);
    
    // Add user message to context
    await contextManager.addMessage(context.id, userMessage);
    
    // Get messages for generation
    const messages = await contextManager.getMessagesForGeneration(context.id);
    
    // Generate AI response
    const response = await gemini.generateResponse(messages);
    
    // Create assistant message
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      tokens: response.tokens,
    };
    
    // Add assistant message to context
    await contextManager.addMessage(context.id, assistantMessage);
    
    // Update session
    session.messages.push(userMessage, assistantMessage);
    session.updatedAt = Date.now();
    db.updateSession(sessionId, { messages: session.messages });
    
    res.json({
      userMessage,
      assistantMessage,
      contextStats: contextManager.getContextStats(context),
    });
    
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/sessions/:id/context - Get context stats
 */
app.get('/api/chat/sessions/:id/context', async (req: Request, res: Response) => {
  try {
    const context = await contextManager.getContextBySession(req.params.id);
    const stats = contextManager.getContextStats(context);
    const summary = await contextManager.getContextSummary(context.id);
    
    res.json({ stats, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/sessions/:id - Delete session
 */
app.delete('/api/chat/sessions/:id', (req: Request, res: Response) => {
  try {
    db.deleteSession(req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

/**
 * POST /api/projects - Create new project
 */
app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { name, path, description } = req.body;
    
    // Check if project already exists
    const existing = db.getProjectByPath(path);
    if (existing) {
      return res.status(400).json({ error: 'Project already exists at this path' });
    }
    
    const project: Project = {
      id: uuidv4(),
      name,
      path,
      description,
      sessions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
    };
    
    db.createProject(project);
    
    // Create context for project
    await contextManager.createContext(undefined, project.id);
    
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects - Get all projects
 */
app.get('/api/projects', (_req: Request, res: Response) => {
  try {
    const projects = db.getAllProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id - Get project by ID
 */
app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(project);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id/structure - Get project file structure
 */
app.get('/api/projects/:id/structure', async (req: Request, res: Response) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const structure = await fileTools.getProjectStructure(project.path);
    return res.json(structure);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AGENT ENDPOINTS
// ============================================================================

/**
 * POST /api/agent/analyze - Analyze project brief and create tasks
 */
app.post('/api/agent/analyze', async (req: Request, res: Response) => {
  try {
    const { projectBrief, sessionId, projectId } = req.body;
    
    if (!projectBrief || !sessionId) {
      return res.status(400).json({ error: 'projectBrief and sessionId are required' });
    }
    
    const result = await coordinator.analyzeProject(projectBrief, sessionId, projectId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error analyzing project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agent/execute-task - Execute a specific task
 */
app.post('/api/agent/execute-task', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body;
    
    const task = db.getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    let result;
    if (task.assignedAgent === 'frontend') {
      result = await frontendAgent.executeTask(task);
    } else if (task.assignedAgent === 'backend') {
      result = await backendAgent.executeTask(task);
    } else {
      return res.status(400).json({ error: 'Invalid agent assignment' });
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error executing task:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agent/tasks/:sessionId - Get tasks for session
 */
app.get('/api/agent/tasks/:sessionId', (req: Request, res: Response) => {
  try {
    const tasks = db.getTasksBySession(req.params.sessionId);
    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FILE ENDPOINTS
// ============================================================================

/**
 * POST /api/files/read - Read file content
 */
app.post('/api/files/read', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    const content = await fileTools.readFile(filePath);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/write - Write file content
 */
app.post('/api/files/write', async (req: Request, res: Response) => {
  try {
    const { filePath, content } = req.body;
    await fileTools.writeFile(filePath, content);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/analyze - Analyze file
 */
app.post('/api/files/analyze', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    const analysis = await fileTools.analyzeFile(filePath);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/replace - Replace content in file
 */
app.post('/api/files/replace', async (req: Request, res: Response) => {
  try {
    const { filePath, searchPattern, replacement, global } = req.body;
    const result = await fileTools.replaceInFile(filePath, searchPattern, replacement, global);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/replace-content - Replace entire file content
 */
app.post('/api/files/replace-content', async (req: Request, res: Response) => {
  try {
    const { filePath, newContent } = req.body;
    await fileTools.replaceFileContent(filePath, newContent);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMAND ENDPOINTS
// ============================================================================

/**
 * POST /api/commands/request - Request command execution (requires confirmation)
 */
app.post('/api/commands/request', (req: Request, res: Response) => {
  try {
    const { command, workingDirectory } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }
    
    const pendingCommand = commandTools.requestCommand(command, workingDirectory);
    res.json(pendingCommand);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/commands/pending - Get all pending commands
 */
app.get('/api/commands/pending', (_req: Request, res: Response) => {
  try {
    const pending = commandTools.getPendingCommands();
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/commands/execute - Execute confirmed command
 */
app.post('/api/commands/execute', async (req: Request, res: Response) => {
  try {
    const { commandId, confirmed } = req.body;
    
    if (!commandId) {
      return res.status(400).json({ error: 'commandId is required' });
    }
    
    const result = await commandTools.executeConfirmedCommand(commandId, confirmed);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/commands/execute-direct - Execute command directly (safe commands only)
 */
app.post('/api/commands/execute-direct', async (req: Request, res: Response) => {
  try {
    const { command, workingDirectory } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }
    
    const result = await commandTools.executeCommand(command, workingDirectory);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/commands/examples - Get safe command examples
 */
app.get('/api/commands/examples', (_req: Request, res: Response) => {
  try {
    const examples = commandTools.getSafeCommandExamples();
    res.json(examples);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Validate settings
    validateSettings();
    
    console.log('🚀 Starting AI Platform Backend...');
    console.log(`📁 Database: ${settings.databasePath}`);
    console.log(`🔑 API Key configured: ${settings.geminiApiKey ? 'Yes' : 'No'}`);
    
    app.listen(settings.port, () => {
      console.log(`✅ Server running on http://localhost:${settings.port}`);
      console.log(`🌐 Frontend URL: ${settings.frontendUrl}`);
      console.log(`📊 Context limit: ${settings.maxContextTokens.toLocaleString()} tokens`);
      console.log('\n🤖 AI Agents ready:');
      console.log('   - Coordinator Agent (Project Analysis)');
      console.log('   - Frontend Agent (React/UI)');
      console.log('   - Backend Agent (APIs/Database)');
      console.log('\n📡 API Endpoints:');
      console.log('   - POST /api/chat/sessions - Create chat session');
      console.log('   - POST /api/chat/sessions/:id/messages - Send message');
      console.log('   - POST /api/agent/analyze - Analyze project');
      console.log('   - POST /api/agent/execute-task - Execute task');
      console.log('   - GET  /api/projects - List projects');
      console.log('   - POST /api/commands/request - Request command execution');
      console.log('   - POST /api/commands/execute - Execute confirmed command');
      console.log('   - POST /api/files/replace - Replace file content');
      console.log('\n✨ Ready to build amazing projects!\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;

