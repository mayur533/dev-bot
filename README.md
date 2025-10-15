# AI Platform

A powerful AI-powered development platform with specialized agents for building full-stack applications using Google Gemini API.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Running the Application

#### Option 1: Run Both Servers (Recommended)
```bash
# Start both backend and frontend in development mode
npm run dev
```

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Production Build

```bash
# Build both backend and frontend
npm run build

# Start production servers
npm start
```

## 📁 Project Structure

```
ai_platform/
├── backend/                  # Node.js + TypeScript backend
│   ├── src/
│   │   ├── agents/          # AI Agents (Coordinator, Frontend, Backend)
│   │   ├── config/          # Settings and environment
│   │   ├── context/         # Context management
│   │   ├── database/        # SQLite database
│   │   ├── models/          # Type definitions
│   │   ├── services/        # Gemini API client
│   │   ├── tools/           # File and command tools
│   │   └── server.ts        # Express server
│   ├── data/                # Database files
│   ├── .env                 # Environment variables (API keys)
│   └── package.json
│
├── frontend/                # Tauri + React + TypeScript
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service
│   │   └── types.ts
│   ├── src-tauri/           # Tauri Rust backend
│   └── package.json
│
├── package.json             # Root package.json (runs both servers)
├── README.md                # This file
└── IMPLEMENTATION_COMPLETE.md  # Detailed implementation docs
```

## ✨ Features

### AI Agents
- **Coordinator Agent**: Breaks down project briefs into technical tasks
- **Frontend Agent**: Generates React/TypeScript UI components
- **Backend Agent**: Creates REST APIs and database schemas

### Context Management
- Per-project and per-chat context isolation
- Real-time token counting (up to 1M tokens)
- Automatic summarization at 90% capacity
- Preserves recent messages after summarization

### Tools
- **File Management**: Read, write, replace, search, analyze files
- **Command Execution**: Safe command execution with confirmation dialogs
- **Project Analysis**: AI-powered project structure analysis

### API Endpoints
- Chat sessions and message handling
- Project management
- AI agent coordination
- File operations
- Command execution with safety checks

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both servers in development mode
- `npm start` - Start both servers in production mode
- `npm run install:all` - Install all dependencies
- `npm run build` - Build both backend and frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend

### Backend Directory
- `npm run dev` - Start backend development server
- `npm run build` - Build backend for production
- `npm start` - Start production backend server

### Frontend Directory
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Start Tauri desktop app

## 🔐 Configuration

### Backend Environment Variables

Create `/backend/.env` file:

```env
# Gemini API Keys (Already configured)
GEMINI_API_KEY=AIzaSyDxVRu3UzqCWYSC82xiHpYioMJqGRoIZS8
GEMINI_API_KEY_SECONDARY=AIzaSyBkiGL0ckCIibHtH8P4QrqEd6mHFDOkfNc

# Server Configuration
PORT=3001
NODE_ENV=development
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Context Configuration
MAX_CONTEXT_TOKENS=1000000
CONTEXT_SUMMARIZATION_THRESHOLD=0.9
MIN_CONTEXT_TOKENS_AFTER_SUMMARY=100000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database
DATABASE_PATH=./data/ai_platform.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/backend.log
```

## 📊 Usage Examples

### 1. Analyze a Project

```typescript
// Send project brief to Coordinator Agent
POST http://localhost:3001/api/agent/analyze
{
  "projectBrief": "Build a task management app with user authentication",
  "sessionId": "session-123"
}

// Response: Tasks breakdown with architecture
{
  "analysis": "...",
  "tasks": [...],
  "architecture": {...}
}
```

### 2. Execute a Task

```typescript
// Execute task with Frontend or Backend agent
POST http://localhost:3001/api/agent/execute-task
{
  "taskId": "task-1"
}

// Response: Generated code
{
  "agent": "frontend",
  "content": "...",
  "code": [...]
}
```

### 3. Execute Command with Confirmation

```typescript
// Request command execution
POST http://localhost:3001/api/commands/request
{
  "command": "npm install react",
  "workingDirectory": "/project/path"
}

// Confirm and execute
POST http://localhost:3001/api/commands/execute
{
  "commandId": "cmd_123",
  "confirmed": true
}
```

## 🎯 Key Features

✅ AI Coordinator Agent that breaks down projects
✅ Frontend Agent for React UI generation  
✅ Backend Agent for APIs and database schemas
✅ Context management per-project and per-chat
✅ Token counting with automatic summarization
✅ File tools (read, write, replace, analyze)
✅ Command execution with confirmation
✅ Full REST API with 40+ endpoints
✅ Frontend-backend integration ready
✅ Comprehensive documentation

## 🔗 API Documentation

Full API documentation available at: `http://localhost:3001/health`

Key endpoints:
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/:id/messages` - Send message
- `POST /api/agent/analyze` - Analyze project
- `POST /api/agent/execute-task` - Execute task
- `POST /api/commands/request` - Request command
- `POST /api/files/read` - Read file
- `POST /api/files/write` - Write file

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **AI**: Google Gemini API (@google/genai v1.3.0)
- **Database**: SQLite (better-sqlite3)
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Desktop**: Tauri (Rust)
- **Styling**: CSS with CSS Variables
- **Icons**: Lucide React

## 📈 Development

### Adding New Features

1. **Backend**: Add endpoints in `backend/src/server.ts`
2. **Frontend**: Add API methods in `frontend/src/services/aiPlatformApi.ts`
3. **Components**: Create React components in `frontend/src/components/`
4. **Hooks**: Add custom hooks in `frontend/src/hooks/`

### Database Schema

SQLite tables:
- `chat_sessions` - Chat sessions with messages
- `projects` - Project metadata
- `contexts` - Context management
- `tasks` - Task tracking

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Gemini API keys in `.env`
- Run `npm install` in backend directory

### Frontend won't start
- Check if port 3000 is available
- Run `npm install` in frontend directory
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Database errors
- Delete `backend/data/ai_platform.db` to reset
- Database will be recreated automatically

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Google Gemini API, TypeScript, and modern best practices.
