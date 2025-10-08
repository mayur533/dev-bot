# Backend Integration Guide

How to connect the frontend to FastAPI backend with token streaming.

## 🔌 Quick Integration

### **Step 1: Ensure Backend is Running**
```bash
cd ../backend
python main.py
# Backend should be running on http://localhost:8000
```

### **Step 2: Test Backend**
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy", "message": "..."}
```

### **Step 3: Update Frontend to Use Real API**

In `App.tsx`, replace the `simulateAPIResponse` function:

```typescript
import { apiService } from './services/api';

// Remove this function
// const simulateAPIResponse = async (userInput: string) => { ... }

// Replace with this
const handleSendMessage = async (content: string) => {
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content,
    type: "text",
  };

  // Add user message
  setTabs((prevTabs) =>
    prevTabs.map((tab) =>
      tab.id === activeTabId
        ? { 
            ...tab, 
            messages: [...tab.messages, userMessage],
            title: tab.messages.length === 0 
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "") 
              : tab.title
          }
        : tab
    )
  );

  setIsLoading(true);

  // Create assistant message placeholder
  const assistantMessageId = Date.now().toString();
  
  setTabs((prevTabs) =>
    prevTabs.map((tab) =>
      tab.id === activeTabId
        ? {
            ...tab,
            messages: [
              ...tab.messages,
              {
                id: assistantMessageId,
                role: "assistant",
                content: "",
                type: "text",
                isStreaming: true,
              },
            ],
          }
        : tab
    )
  );

  // Call real API with streaming
  await apiService.streamChat(
    content,
    "default",
    
    // onToken: Update message with each token
    (token) => {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                messages: tab.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + token }
                    : msg
                ),
              }
            : tab
        )
      );
    },
    
    // onComplete: Mark streaming as done
    () => {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                messages: tab.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                ),
              }
            : tab
        )
      );
      setIsLoading(false);
    },
    
    // onError: Handle errors
    (error) => {
      console.error("Streaming error:", error);
      
      // Show error message
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                messages: tab.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { 
                        ...msg, 
                        content: `Error: ${error.message}. Make sure the backend is running on http://localhost:8000`,
                        isStreaming: false 
                      }
                    : msg
                ),
              }
            : tab
        )
      );
      setIsLoading(false);
    }
  );
};
```

### **Step 4: Test the Integration**

1. Start backend: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Type a message and send
4. You should see token-by-token streaming!

---

## 🛠️ Advanced Configuration

### **Change Backend URL**

For production or custom port:

```typescript
import { apiService } from './services/api';

// Set custom backend URL
apiService.setBaseURL('http://your-server:8000');
```

### **Multiple API Instances**

```typescript
import APIService from './services/api';

const localAPI = new APIService('http://localhost:8000');
const prodAPI = new APIService('https://api.yourserver.com');

// Use different instances
await localAPI.streamChat(...);
await prodAPI.streamChat(...);
```

---

## 🎯 Content Type Detection

The frontend can automatically detect and display different content types.

### **Backend Response Format**

Your backend should return tokens in SSE format:

```python
# In your FastAPI backend
async def generate_stream(message: str):
    # For regular text
    yield f'data: {{"token": "Hello ", "done": false}}\n\n'
    yield f'data: {{"token": "World", "done": false}}\n\n'
    yield f'data: {{"token": "", "done": true}}\n\n'
```

### **Sending Different Content Types**

Modify the frontend to detect content type from backend response:

```typescript
// In your streaming handler, parse backend metadata
const handleStream = (chunk: string) => {
  const data = JSON.parse(chunk);
  
  // Backend can send metadata
  if (data.type === "command") {
    updateMessage({ 
      type: "command",
      content: data.token 
    });
  } else if (data.type === "code") {
    updateMessage({ 
      type: "code",
      language: data.language,
      content: data.token 
    });
  } else {
    updateMessage({ 
      type: "text",
      content: data.token 
    });
  }
};
```

### **Backend Example**

```python
# In your FastAPI backend
async def generate_stream(message: str):
    # Detect if response should be code
    if "code" in message.lower():
        code = "def hello():\n    print('Hi')"
        
        # Send metadata first
        yield f'data: {{"type": "code", "language": "python", "token": "", "done": false}}\n\n'
        
        # Stream code
        for char in code:
            yield f'data: {{"token": "{char}", "done": false}}\n\n'
        
        yield f'data: {{"token": "", "done": true}}\n\n'
    
    # Detect if response is a command
    elif "install" in message.lower() or "run" in message.lower():
        command = "pip install fastapi"
        
        yield f'data: {{"type": "command", "token": "", "done": false}}\n\n'
        
        for word in command.split():
            yield f'data: {{"token": "{word} ", "done": false}}\n\n'
        
        yield f'data: {{"token": "", "done": true}}\n\n'
    
    # Regular text
    else:
        text = "This is a regular response"
        for word in text.split():
            yield f'data: {{"token": "{word} ", "done": false}}\n\n'
        yield f'data: {{"token": "", "done": true}}\n\n'
```

---

## 🔍 Debugging

### **Check Backend Connection**

Add this to `App.tsx`:

```typescript
useEffect(() => {
  apiService.healthCheck()
    .then(data => console.log("Backend connected:", data))
    .catch(err => console.error("Backend not connected:", err));
}, []);
```

### **Log Streaming Tokens**

```typescript
await apiService.streamChat(
  content,
  "default",
  (token) => {
    console.log("Received token:", token); // Debug log
    // ... update UI
  },
  () => console.log("Stream complete"),
  (error) => console.error("Stream error:", error)
);
```

### **Common Issues**

**1. CORS Error**
```
Access to fetch blocked by CORS policy
```
**Solution:** Ensure backend has CORS configured:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Connection Refused**
```
Failed to fetch
```
**Solution:** Make sure backend is running:
```bash
curl http://localhost:8000/health
```

**3. No Streaming**
```
Response appears all at once
```
**Solution:** Check backend is using SSE format and not buffering:
```python
return StreamingResponse(
    generate_stream(message),
    media_type="text/event-stream",
    headers={"X-Accel-Buffering": "no"}
)
```

---

## ✅ Integration Checklist

- [ ] Backend running on http://localhost:8000
- [ ] `/health` endpoint responding
- [ ] `/chat/stream` endpoint implemented
- [ ] CORS configured for http://localhost:1420
- [ ] Frontend apiService imported
- [ ] simulateAPIResponse replaced with real API call
- [ ] Error handling implemented
- [ ] Token streaming working
- [ ] Message types rendering correctly

---

## 🚀 Next Steps

Once integrated:
1. Add conversation persistence (localStorage/database)
2. Add model selection dropdown
3. Add retry failed messages
4. Add copy message text
5. Add export conversations
6. Add settings panel

---

**Ready to integrate?** Follow Steps 1-4 above! 🎉


