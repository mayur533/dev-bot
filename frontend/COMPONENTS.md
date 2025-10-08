# Reusable Components Documentation

This document explains how to use the modular, reusable components in the AI Platform frontend.

## 🧩 Component Architecture

```
App.tsx (Main Container)
├── Sidebar (Tab Management)
├── Main Content
│   ├── Header (Title & Actions)
│   ├── ChatArea (Message Display)
│   │   └── MessageBlock[] (Individual Messages)
│   └── InputArea (User Input)
└── API Service (Backend Communication)
```

## 📦 Components

### 1. **Sidebar Component**

Manages multiple chat tabs with create/delete functionality.

**Props:**
```typescript
interface SidebarProps {
  tabs: ChatTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onNewTab: () => void;
  onDeleteTab: (tabId: string) => void;
}
```

**Usage:**
```tsx
<Sidebar
  tabs={tabs}
  activeTabId={activeTabId}
  onTabSelect={setActiveTabId}
  onNewTab={handleNewTab}
  onDeleteTab={handleDeleteTab}
/>
```

**Features:**
- ✅ Create new tabs (➕ button)
- ✅ Switch between tabs
- ✅ Delete tabs (✕ button, min 1 tab)
- ✅ Active tab highlighting
- ✅ Shows total chat count

---

### 2. **ChatArea Component**

Displays messages with auto-scroll and empty state.

**Props:**
```typescript
interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}
```

**Usage:**
```tsx
<ChatArea 
  messages={activeTab?.messages || []} 
  isLoading={isLoading} 
/>
```

**Features:**
- ✅ Auto-scroll to latest message
- ✅ Empty state with feature highlights
- ✅ Loading indicator (bouncing dots)
- ✅ Renders MessageBlock for each message

---

### 3. **MessageBlock Component**

Renders individual messages with different content types.

**Props:**
```typescript
interface MessageBlockProps {
  message: Message;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "command" | "code";
  language?: string;
  isStreaming?: boolean;
}
```

**Usage:**
```tsx
<MessageBlock message={message} />
```

**Content Types:**

1. **Text** (default)
   - Regular chat messages
   - Supports streaming with blinking cursor

2. **Command** 
   - Terminal commands
   - Green text with copy button
   - Header with ⚡ icon

3. **Code**
   - Code blocks with syntax highlighting
   - Language label in header
   - Copy button
   - Header with 💻 icon

**Example Messages:**
```typescript
// Text message
{
  id: "1",
  role: "assistant",
  content: "Hello! How can I help?",
  type: "text"
}

// Command
{
  id: "2",
  role: "assistant",
  content: "npm install fastapi",
  type: "command"
}

// Code block
{
  id: "3",
  role: "assistant",
  content: "def hello():\n    print('Hello!')",
  type: "code",
  language: "python"
}
```

---

### 4. **InputArea Component**

User input with auto-resize and keyboard shortcuts.

**Props:**
```typescript
interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}
```

**Usage:**
```tsx
<InputArea 
  onSendMessage={handleSendMessage} 
  isLoading={isLoading} 
/>
```

**Features:**
- ✅ Auto-resize textarea (max 200px)
- ✅ `Enter` to send
- ✅ `Shift+Enter` for new line
- ✅ Loading state with spinner
- ✅ Disabled when loading
- ✅ Clears after send

---

## 🔌 API Service

Reusable service for backend communication.

### **Import:**
```typescript
import { apiService } from './services/api';
// or
import APIService from './services/api';
const customAPI = new APIService('http://custom-url:8000');
```

### **Methods:**

#### 1. **Stream Chat** (Recommended)
```typescript
await apiService.streamChat(
  "Hello, AI!",           // message
  "gpt-4",                // model (optional)
  (token) => {            // onToken callback
    console.log(token);
  },
  () => {                 // onComplete callback
    console.log("Done!");
  },
  (error) => {            // onError callback
    console.error(error);
  }
);
```

#### 2. **Regular Chat** (Non-streaming)
```typescript
const response = await apiService.sendChat("Hello!", "gpt-4");
console.log(response);
```

#### 3. **Custom API Call**
```typescript
const result = await apiService.call<YourType>('/custom-endpoint', {
  endpoint: '/custom-endpoint',
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});
```

#### 4. **Health Check**
```typescript
const health = await apiService.healthCheck();
// { status: "ok", message: "..." }
```

#### 5. **Change Base URL**
```typescript
apiService.setBaseURL('http://production-server:8000');
```

---

## 🎨 Styling

All components use CSS variables for theming.

### **Key Variables:**
```css
/* Colors */
--bg-primary          /* Main background */
--bg-secondary        /* Secondary background */
--text-primary        /* Main text */
--text-secondary      /* Muted text */
--button-bg           /* Primary button */
--code-bg             /* Code block background */

/* Sidebar */
--sidebar-bg          /* Sidebar background */
--tab-hover-bg        /* Tab hover state */
--tab-active-bg       /* Active tab */

/* Messages */
--user-message-bg     /* User message bubble */
--assistant-message-bg /* AI message bubble */
```

### **Dark Mode:**
Automatically switches based on `prefers-color-scheme: dark`

---

## 📝 Type Definitions

### **Message**
```typescript
interface Message {
  id: string;                    // Unique identifier
  role: "user" | "assistant";    // Message sender
  content: string;               // Message text
  type?: "text" | "command" | "code";  // Content type
  language?: string;             // Code language
  isStreaming?: boolean;         // Streaming indicator
}
```

### **ChatTab**
```typescript
interface ChatTab {
  id: string;         // Unique tab ID
  title: string;      // Tab display name
  messages: Message[]; // Chat history
  createdAt: number;  // Timestamp
}
```

### **APIConfig**
```typescript
interface APIConfig {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
}
```

---

## 🚀 Usage Examples

### **Example 1: Create New Chat Tab**
```typescript
const handleNewTab = () => {
  const newTab: ChatTab = {
    id: Date.now().toString(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
  };
  setTabs([...tabs, newTab]);
  setActiveTabId(newTab.id);
};
```

### **Example 2: Send Message with Streaming**
```typescript
const handleSendMessage = async (content: string) => {
  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content,
    type: "text",
  };
  
  addMessageToTab(activeTabId, userMessage);
  
  // Create empty assistant message
  const assistantId = Date.now().toString();
  addMessageToTab(activeTabId, {
    id: assistantId,
    role: "assistant",
    content: "",
    type: "text",
    isStreaming: true,
  });
  
  // Stream response
  await apiService.streamChat(
    content,
    "default",
    (token) => {
      updateMessage(assistantId, (msg) => ({
        ...msg,
        content: msg.content + token
      }));
    },
    () => {
      updateMessage(assistantId, (msg) => ({
        ...msg,
        isStreaming: false
      }));
    },
    (error) => {
      console.error("Streaming error:", error);
    }
  );
};
```

### **Example 3: Add Different Message Types**
```typescript
// Text message
addMessage({ 
  id: "1", 
  role: "assistant", 
  content: "Here's how to do it:", 
  type: "text" 
});

// Command
addMessage({ 
  id: "2", 
  role: "assistant", 
  content: "pip install fastapi", 
  type: "command" 
});

// Code
addMessage({ 
  id: "3", 
  role: "assistant", 
  content: "def hello():\n    pass", 
  type: "code",
  language: "python"
});
```

---

## 🎯 Integration with Backend

### **Step 1: Update API Base URL**
```typescript
// In App.tsx or config file
import { apiService } from './services/api';

apiService.setBaseURL('http://localhost:8000');
```

### **Step 2: Replace Simulation**
Replace the `simulateAPIResponse` function in `App.tsx` with real API calls:

```typescript
const handleSendMessage = async (content: string) => {
  // ... add user message ...
  
  const assistantId = Date.now().toString();
  
  await apiService.streamChat(
    content,
    "default",
    (token) => {
      // Update message content
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === activeTabId
            ? {
                ...tab,
                messages: tab.messages.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + token }
                    : msg
                )
              }
            : tab
        )
      );
    },
    () => {
      // Mark as complete
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === activeTabId
            ? {
                ...tab,
                messages: tab.messages.map(msg =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              }
            : tab
        )
      );
      setIsLoading(false);
    },
    (error) => {
      console.error('Error:', error);
      setIsLoading(false);
    }
  );
};
```

---

## ✅ Component Checklist

- [x] **Sidebar** - Tab management
- [x] **ChatArea** - Message display
- [x] **MessageBlock** - Text/Command/Code rendering
- [x] **InputArea** - User input
- [x] **API Service** - Backend communication
- [x] **Type Definitions** - Full TypeScript support
- [x] **CSS Variables** - Theme customization
- [x] **Dark Mode** - Automatic theme switching
- [x] **Responsive** - Mobile-friendly
- [x] **Sample Data** - Demo functionality

---

## 🔧 Customization

### **Add New Message Type**
1. Update `Message` type in `types.ts`
2. Add rendering logic in `MessageBlock.tsx`
3. Add styles in `MessageBlock.css`

### **Add New API Endpoint**
```typescript
// In services/api.ts
async customEndpoint(data: any): Promise<Response> {
  return this.call('/custom', {
    endpoint: '/custom',
    method: 'POST',
  });
}
```

### **Customize Theme**
Edit CSS variables in `App.css`:
```css
:root {
  --button-bg: #your-color;
  --sidebar-bg: #your-color;
  /* ... etc */
}
```

---

**Status**: ✅ All components are production-ready and reusable!


