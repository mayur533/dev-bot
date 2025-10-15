# AI Platform Backend

A powerful AI-powered development platform with specialized agents for building full-stack applications.

## Features

- **🤖 AI Coordinator Agent**: Breaks down project briefs into actionable technical tasks
- **⚛️ Frontend Agent**: Generates React UI components with TypeScript
- **🔧 Backend Agent**: Creates REST APIs, database schemas, and business logic
- **📊 Context Management**: Per-project and per-chat context isolation with automatic summarization
- **🔢 Token Counting**: Real-time token tracking with automatic context optimization
- **📁 File Tools**: Read, write, search, and analyze project files
- **💾 Database**: SQLite with Better-SQLite3 for fast, reliable storage

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI**: Google Gemini API (@google/genai)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT-ready architecture

## Installation

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.template .env
# Edit .env and add your Gemini API keys

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

```env
# Gemini API Keys (required)
GEMINI_API_KEY=your_primary_key
GEMINI_API_KEY_SECONDARY=your_backup_key

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Context Management
MAX_CONTEXT_TOKENS=1000000
CONTEXT_SUMMARIZATION_THRESHOLD=0.9
MIN_CONTEXT_TOKENS_AFTER_SUMMARY=100000
```

## API Endpoints

### Chat Sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions` - Get all sessions
- `GET /api/chat/sessions/:id` - Get session by ID
- `POST /api/chat/sessions/:id/messages` - Send message
- `GET /api/chat/sessions/:id/context` - Get context stats
- `DELETE /api/chat/sessions/:id` - Delete session

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/:id/structure` - Get project file structure

### AI Agents
- `POST /api/agent/analyze` - Analyze project brief and create tasks
- `POST /api/agent/execute-task` - Execute a specific task
- `GET /api/agent/tasks/:sessionId` - Get tasks for session

### Files
- `POST /api/files/read` - Read file content
- `POST /api/files/write` - Write file content
- `POST /api/files/analyze` - Analyze file

## Architecture

```
backend/
├── src/
│   ├── agents/           # AI Agents
│   │   ├── coordinatorAgent.ts
│   │   ├── frontendAgent.ts
│   │   └── backendAgent.ts
│   ├── api/              # (future) API routes
│   ├── config/           # Configuration
│   │   └── settings.ts
│   ├── context/          # Context management
│   │   └── contextManager.ts
│   ├── database/         # Database layer
│   │   └── db.ts
│   ├── models/           # Type definitions
│   │   └── types.ts
│   ├── services/         # Services
│   │   └── gemini.ts
│   ├── tools/            # Tools
│   │   └── fileTools.ts
│   └── server.ts         # Main server
├── data/                 # Database files
├── logs/                 # Log files
├── package.json
└── tsconfig.json
```

## Usage Example

### 1. Create a Chat Session

```typescript
POST /api/chat/sessions
{
  "title": "Build Task Manager App",
  "projectId": "optional-project-id"
}
```

### 2. Analyze Project Brief

```typescript
POST /api/agent/analyze
{
  "projectBrief": "Build a task management app with user authentication and task sharing",
  "sessionId": "session-id"
}

// Response:
{
  "analysis": "Detailed technical analysis...",
  "tasks": [
    {
      "id": "task-1",
      "title": "Create authentication system",
      "description": "Implement JWT-based auth...",
      "type": "backend",
      "assignedAgent": "backend",
      "status": "pending"
    },
    {
      "id": "task-2",
      "title": "Build task list UI",
      "description": "Create React components...",
      "type": "frontend",
      "assignedAgent": "frontend",
      "status": "pending"
    }
  ],
  "architecture": {
    "frontend": ["React", "TypeScript", "Tailwind CSS"],
    "backend": ["Node.js", "Express", "PostgreSQL"],
    "database": ["PostgreSQL"]
  }
}
```

### 3. Execute Tasks

```typescript
POST /api/agent/execute-task
{
  "taskId": "task-1"
}

// Response:
{
  "agent": "backend",
  "content": "Analysis of the task...",
  "code": [
    {
      "language": "typescript",
      "filename": "auth.ts",
      "content": "// Full implementation..."
    }
  ]
}
```

### 4. Send Chat Messages

```typescript
POST /api/chat/sessions/:id/messages
{
  "content": "Can you explain the authentication flow?"
}

// Response:
{
  "userMessage": {...},
  "assistantMessage": {
    "id": "msg-123",
    "role": "assistant",
    "content": "The authentication flow works as follows...",
    "timestamp": 1234567890
  },
  "contextStats": {
    "totalTokens": 50000,
    "maxTokens": 1000000,
    "percentageUsed": 5.0,
    "needsSummarization": false
  }
}
```

## Context Management

The system automatically manages context to stay within token limits:

1. **Token Tracking**: Every message's tokens are counted in real-time
2. **Auto-Summarization**: When context reaches 90% capacity, it's automatically summarized
3. **Isolation**: Each project and chat session has its own context
4. **History Preservation**: Summaries keep key information while reducing token usage

## AI Agents

### Coordinator Agent
- Analyzes project requirements
- Breaks down into technical tasks
- Assigns tasks to specialized agents
- Reviews outputs for quality

### Frontend Agent
- Generates React components
- Creates responsive UI designs
- Implements state management
- Follows modern best practices

### Backend Agent
- Designs REST APIs
- Creates database schemas
- Implements business logic
- Ensures security and scalability

## License

MIT

