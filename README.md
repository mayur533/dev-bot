# 🤖 AI Platform

A beautiful cross-platform AI chat application with **real-time token streaming**.

## 🏗️ Architecture

```
ai_platform/
├── frontend/    🦀 Tauri + React (TypeScript)
└── backend/     🐍 FastAPI (Python)
```

### Frontend
- **Framework**: Tauri 2.0 (Rust-powered desktop app)
- **UI**: React 19 + TypeScript
- **Styling**: Modern CSS with dark/light mode
- **Features**: ChatGPT-like interface, token streaming, auto-scroll

### Backend
- **Framework**: FastAPI (Python)
- **Streaming**: Server-Sent Events (SSE)
- **Models**: Extensible for OpenAI, Ollama, or local models

## ✨ Features

✅ **Standalone Desktop App** - No browser needed, runs natively  
✅ **Cross-Platform** - Windows, macOS, Linux  
✅ **Real-Time Streaming** - Token-by-token typing animation  
✅ **Beautiful UI** - ChatGPT-inspired design with dark mode  
✅ **Fast & Lightweight** - Rust + Python performance  
✅ **Extensible** - Easy to add any AI model  

## 🚀 Quick Start

### Prerequisites

**Frontend:**
- Node.js 18+
- Rust ([install here](https://www.rust-lang.org/tools/install))
- Platform-specific requirements ([see Tauri docs](https://tauri.app/start/prerequisites/))

**Backend:**
- Python 3.9+
- pip

### Installation & Running

#### 1. Frontend (Tauri + React)

```bash
cd frontend
npm install
npm run dev
```

This will:
- Start Vite dev server on `http://localhost:1420`
- Launch Tauri desktop app automatically
- Enable hot-reload for development

#### 2. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

This will:
- Start FastAPI server on `http://localhost:8000`
- Enable CORS for Tauri app
- Provide `/chat/stream` endpoint for token streaming

## 📸 Screenshots

### Chat Interface
```
┌─────────────────────────────────────────┐
│  AI Platform                            │
│  Powered by Tauri + FastAPI             │
├─────────────────────────────────────────┤
│                                         │
│  👤 You                                 │
│  Hello! How are you?                    │
│                                         │
│  🤖 AI Assistant                        │
│  I'm doing great! How can I help...▋   │
│                                         │
├─────────────────────────────────────────┤
│  Type your message...                   │
│  [Enter to send]                    ➤   │
└─────────────────────────────────────────┘
```

## 🔌 How It Works

### Communication Flow

```
┌─────────────┐      HTTP POST      ┌─────────────┐
│   Tauri     │  ──────────────────> │   FastAPI   │
│  (Frontend) │                      │  (Backend)  │
│             │  <──────────────────  │             │
│  React UI   │   SSE Token Stream   │  AI Model   │
└─────────────┘                      └─────────────┘
```

1. **User** types message in Tauri app
2. **Frontend** sends HTTP POST to `/chat/stream`
3. **Backend** processes with AI model
4. **Backend** streams tokens via Server-Sent Events
5. **Frontend** displays each token with typing animation

## 🛠️ Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server with Tauri app
npm run build        # Build for production
npm run tauri dev    # Alternative dev command
```

**Key Files:**
- `src/App.tsx` - Main chat component
- `src/App.css` - ChatGPT-like styling
- `src-tauri/` - Tauri (Rust) configuration

### Backend Development

```bash
cd backend
python main.py       # Start with uvicorn
# or
uvicorn main:app --reload --port 8000
```

**Key Files:**
- `main.py` - FastAPI app with streaming endpoint
- `requirements.txt` - Python dependencies

### Adding AI Models

The backend is designed to be extensible. Examples included:

**OpenAI:**
```python
import openai
# See main.py for integration example
```

**Ollama:**
```python
import ollama
# See main.py for integration example
```

**Custom Model:**
```python
async def generate_stream(message: str):
    # Your model logic here
    yield token
```

## 📁 Project Structure

```
ai_platform/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Chat UI component
│   │   ├── App.css              # ChatGPT styling
│   │   └── main.tsx             # React entry
│   ├── src-tauri/
│   │   ├── src/                 # Rust source
│   │   ├── icons/               # App icons
│   │   └── tauri.conf.json      # Tauri config
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── requirements.txt         # Dependencies
│   └── README.md
│
└── README.md                    # This file
```

## 🎯 Features Breakdown

### ✅ Completed
- [x] Tauri + React + TypeScript setup
- [x] ChatGPT-like UI design
- [x] Message bubbles (user/assistant)
- [x] Token streaming simulation
- [x] Auto-scroll to latest message
- [x] Dark/light mode support
- [x] Responsive design
- [x] Keyboard shortcuts (Enter/Shift+Enter)

### 🚧 Backend (Next Steps)
- [ ] FastAPI setup with streaming
- [ ] Server-Sent Events implementation
- [ ] CORS configuration
- [ ] AI model integration stub

### 🔮 Future Enhancements
- [ ] Conversation history/persistence
- [ ] Multiple chat sessions
- [ ] Settings panel
- [ ] Model selection dropdown
- [ ] Export conversations
- [ ] Code syntax highlighting
- [ ] File attachments
- [ ] Voice input

## 🎨 Customization

### Theming
Edit `frontend/src/App.css` CSS variables:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #10192e;
  --button-bg: #10a37f;
  /* ... more variables */
}
```

### Branding
- Replace app title in `frontend/index.html`
- Update icons in `frontend/src-tauri/icons/`
- Modify header in `frontend/src/App.tsx`

## 🐛 Troubleshooting

**Frontend won't build?**
- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Check prerequisites: [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

**Backend not connecting?**
- Check if running on `http://localhost:8000`
- Verify CORS settings allow `http://localhost:1420`
- Check firewall settings

**Streaming not working?**
- Ensure backend `/chat/stream` endpoint is implemented
- Verify Server-Sent Events format
- Check browser console for errors

## 📚 Resources

- [Tauri Documentation](https://tauri.app/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Server-Sent Events Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 📄 License

MIT License - Free to use for any project!

## 🙏 Credits

Built with:
- [Tauri](https://tauri.app/) - Desktop app framework
- [React](https://react.dev/) - UI library
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- Inspired by ChatGPT's beautiful interface

---

**Made with ❤️ using Tauri + FastAPI**


