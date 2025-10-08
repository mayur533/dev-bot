# AI Platform - Frontend

🦀 **Tauri + React + TypeScript** - A beautiful ChatGPT-like desktop application

## ✨ Features

- ✅ **Modern Chat UI** - Clean, beautiful interface inspired by ChatGPT
- ✅ **Token Streaming** - Real-time typing animation for AI responses
- ✅ **Cross-platform** - Runs on Windows, macOS, and Linux as a standalone app
- ✅ **Dark Mode** - Automatic dark/light theme based on system preferences
- ✅ **Responsive Design** - Works on any screen size
- ✅ **TypeScript** - Full type safety
- ✅ **Fast & Lightweight** - Built with Tauri (Rust) for optimal performance

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- Node.js (v18 or higher)
- Rust (for Tauri) - [Installation Guide](https://tauri.app/start/prerequisites/)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 UI Components

### Chat Interface
- **Message Bubbles** - User messages in light gray, AI messages in white/dark theme
- **Avatar Icons** - 👤 for user, 🤖 for AI assistant
- **Streaming Animation** - Blinking cursor during token streaming
- **Auto-scroll** - Automatically scrolls to latest message

### Input Area
- **Auto-resize Textarea** - Grows with content (max 200px)
- **Keyboard Shortcuts**:
  - `Enter` - Send message
  - `Shift+Enter` - New line
- **Send Button** - Disabled when empty or loading

## 🔌 Backend Integration

The frontend is ready to connect to the FastAPI backend. To enable real streaming:

1. Update the `simulateStreamingResponse` function in `App.tsx`
2. Replace with actual fetch to `http://localhost:8000/chat/stream`
3. Use Server-Sent Events (SSE) to receive tokens

Example integration:

```typescript
const streamFromBackend = async (message: string) => {
  const response = await fetch('http://localhost:8000/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model: 'default' })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        // Update message with data.token
      }
    }
  }
};
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main chat component
│   ├── App.css          # ChatGPT-like styling
│   ├── main.tsx         # React entry point
│   └── assets/          # Static assets
├── src-tauri/           # Tauri (Rust) backend
│   ├── src/             # Rust source files
│   ├── icons/           # App icons
│   └── tauri.conf.json  # Tauri configuration
├── index.html           # HTML entry point
├── package.json         # Dependencies
└── vite.config.ts       # Vite configuration
```

## 🛠️ Technologies

- **Tauri 2.0** - Desktop app framework (Rust)
- **React 19** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 7** - Build tool & dev server
- **CSS3** - Modern styling with CSS variables

## 🎯 Next Steps

1. ✅ Frontend ChatGPT-like UI - **COMPLETE**
2. ⏳ Create FastAPI backend with streaming
3. ⏳ Connect frontend to backend
4. ⏳ Add AI model integration (OpenAI/Ollama/Local)
5. ⏳ Add conversation history
6. ⏳ Add settings panel

## 📝 Notes

- The app currently uses simulated streaming responses
- Dark mode automatically follows system preferences
- All styles use CSS variables for easy theming
- Built with performance in mind - minimal re-renders

## 🐛 Troubleshooting

**App won't start?**
- Make sure Rust is installed: `rustc --version`
- Check Node.js version: `node --version` (need v18+)
- Try `npm install --force` if dependency issues

**Build errors?**
- Make sure all Tauri prerequisites are installed
- Check the [Tauri Prerequisites Guide](https://tauri.app/start/prerequisites/)

## 📄 License

MIT License - Feel free to use for any project!
