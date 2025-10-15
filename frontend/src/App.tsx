import { useState, useEffect } from "react";
import { ChatTab, Message } from "./types";
import aiPlatformApi from "./services/aiPlatformApi";
import TitleBar from "./components/TitleBar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import InputArea from "./components/InputArea";
import ProjectDialog from "./components/ProjectDialog";
import OpenProjectDialog from "./components/OpenProjectDialog";
import ProjectView from "./components/ProjectView";
import "./App.css";

// Removed sample data generator - now using real Gemini AI backend

function App() {
  const [tabs, setTabs] = useState<ChatTab[]>([
    {
      id: "1",
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      type: "chat",
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showOpenProjectDialog, setShowOpenProjectDialog] = useState(false);
  const [contextUsed, setContextUsed] = useState(0);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  
  // IDE state (passed from ProjectView)
  const [ideShowExplorer, setIdeShowExplorer] = useState(true);
  const [ideShowChat, setIdeShowChat] = useState(true);
  const [ideShowTerminal, setIdeShowTerminal] = useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Initialize backend session when active tab changes
  useEffect(() => {
    const initSession = async () => {
      if (activeTab && activeTab.type === 'chat' && !backendSessionId) {
        try {
          const session = await aiPlatformApi.createSession(activeTab.title, undefined);
          setBackendSessionId(session.id);
          console.log('Backend session created:', session.id);
        } catch (error) {
          console.error('Failed to create backend session:', error);
        }
      }
    };
    initSession();
  }, [activeTabId, activeTab, backendSessionId]);

  // Create new tab
  const handleNewTab = () => {
    const newTab: ChatTab = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      type: "chat",
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    
    // Reset backend session for new tab
    setBackendSessionId(null);
  };

  // Delete tab
  const handleDeleteTab = (tabId: string) => {
    if (tabs.length === 1) return;

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!backendSessionId) {
      console.error('No backend session initialized');
      return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content,
      type: "text",
    };

    // Add user message to UI
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? { 
              ...tab, 
              messages: [...tab.messages, userMessage],
              title: tab.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : tab.title
            }
          : tab
      )
    );

    setIsLoading(true);

    try {
      // Send message to backend with Gemini AI
      const response = await aiPlatformApi.sendMessage(backendSessionId, content);
      
      // Update context usage from backend
      setContextUsed(response.contextStats.percentageUsed);

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: response.assistantMessage.id,
        role: "assistant",
        content: response.assistantMessage.content,
        type: "text",
      };

      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, messages: [...tab.messages, assistantMessage] }
            : tab
        )
      );

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Error: ${error.message || 'Failed to get response from AI'}\n\nPlease make sure the backend server is running on http://localhost:3001`,
        type: "text",
      };

      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, messages: [...tab.messages, errorMessage] }
            : tab
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Find the message index
    const activeTabData = tabs.find(tab => tab.id === activeTabId);
    if (!activeTabData) return;

    const messageIndex = activeTabData.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Update the message content and remove all messages after it
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              messages: tab.messages
                .slice(0, messageIndex + 1)
                .map((msg) =>
                  msg.id === messageId
                    ? { ...msg, content: newContent }
                    : msg
                ),
            }
          : tab
      )
    );

    // Trigger new API response with updated content
    setIsLoading(true);
    await simulateAPIResponse(newContent);
  };

  // Retry message
  const handleRetryMessage = async (messageId: string) => {
    // Find the message index
    const activeTabData = tabs.find(tab => tab.id === activeTabId);
    if (!activeTabData) return;

    const messageIndex = activeTabData.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    // The message should be an assistant message, find the previous user message
    const assistantMessage = activeTabData.messages[messageIndex];
    if (assistantMessage.role !== "assistant") return;

    // Find the previous user message
    let userMessageContent = "";
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (activeTabData.messages[i].role === "user") {
        userMessageContent = activeTabData.messages[i].content;
        break;
      }
    }

    if (!userMessageContent) return;

    // Remove the current assistant response
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              messages: tab.messages.filter((msg) => msg.id !== messageId),
            }
          : tab
      )
    );

    // Trigger new API response with the same query
    setIsLoading(true);
    await simulateAPIResponse(userMessageContent);
  };

  // Back to chat from project view
  const handleBackToChat = () => {
    // Switch to the first chat tab or create a new one
    const chatTabs = tabs.filter(tab => tab.type === "chat");
    if (chatTabs.length > 0) {
      setActiveTabId(chatTabs[0].id);
    } else {
      // Create a new chat tab
      const newChatTab: ChatTab = {
        id: `chat-${Date.now()}`,
        type: "chat",
        title: "New Chat",
        messages: [],
        createdAt: Date.now()
      };
      setTabs([...tabs, newChatTab]);
      setActiveTabId(newChatTab.id);
    }
  };

  // Simulate API response with streaming
  const simulateAPIResponse = async (userInput: string) => {
    const assistantMessageId = (Date.now() + Math.random() * 1000).toString();

    // Determine response type based on user input
    const lowerInput = userInput.toLowerCase();
    let responseType: "text" | "command" | "code" | "mixed" = "text";
    let language = "javascript";

    if (lowerInput.includes("command") || lowerInput.includes("run") || lowerInput.includes("install")) {
      responseType = "command";
    } else if (lowerInput.includes("code") || lowerInput.includes("function") || lowerInput.includes("create")) {
      responseType = "code";
      if (lowerInput.includes("python")) language = "python";
      if (lowerInput.includes("typescript")) language = "typescript";
    }
    let responseContent = "";
    let responseParts: any[] = [];

    if (lowerInput.includes("node.js") || lowerInput.includes("express") || lowerInput.includes("api") || lowerInput.includes("crud") || lowerInput.includes("rest")) {
      // Create comprehensive mixed content for Node.js/API projects
      responseType = "mixed";
      responseParts = [
        {
          type: "text",
          content: "I'll help you create a complete Node.js REST API with Express. Let me walk you through the entire process step by step."
        },
        {
          type: "text",
          content: "First, let's create the main server file with all the CRUD operations:"
        },
        {
          type: "code",
          content: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Sample data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// GET all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST create new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT update user
app.put('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  users[userIndex] = { ...users[userIndex], ...req.body };
  res.json(users[userIndex]);
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
          language: "javascript"
        },
        {
          type: "text",
          content: "Now let's create the package.json file with all necessary dependencies:"
        },
        {
          type: "code",
          content: `{
  "name": "nodejs-rest-api",
  "version": "1.0.0",
  "description": "REST API with Express.js",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["express", "api", "rest"],
  "author": "Your Name",
  "license": "MIT"
}`,
          language: "json"
        },
        {
          type: "text",
          content: "Here are the commands to set up and run your API:"
        },
        {
          type: "command",
          content: "npm init -y\nnpm install express cors\nnpm install --save-dev nodemon\nnpm start"
        },
        {
          type: "text",
          content: "Now let's test the API with curl commands:"
        },
        {
          type: "command",
          content: "# Get all users\ncurl -X GET http://localhost:3000/api/users\n\n# Create a new user\ncurl -X POST http://localhost:3000/api/users \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"name\":\"Alice Johnson\",\"email\":\"alice@example.com\"}'\n\n# Update a user\ncurl -X PUT http://localhost:3000/api/users/1 \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"name\":\"John Updated\"}'\n\n# Delete a user\ncurl -X DELETE http://localhost:3000/api/users/1"
        },
        {
          type: "text",
          content: "Your REST API is now ready! The server will be available at http://localhost:3000. You can test all CRUD operations using the curl commands above or any API testing tool like Postman."
        }
      ];
    } else if (responseType === "command") {
      if (lowerInput.includes("install")) {
        responseContent = "pip install fastapi uvicorn\nnpm install express\ncargo add tokio";
      } else if (lowerInput.includes("run")) {
        responseContent = "python main.py\nnpm start\ncargo run";
      } else {
        responseContent = "ls -la\ngit status\nnpm run build";
      }
    } else if (responseType === "code") {
      if (language === "python") {
        responseContent = `# Python FastAPI example\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\nasync def root():\n    return {"message": "Hello World"}`;
      } else {
        responseContent = `// TypeScript example\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = {\n  name: "John",\n  age: 30\n};`;
      }
    } else {
      // Generate contextual text responses
      if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        responseContent = `Hello! I'm your AI assistant. I can help you with:\n\n• Writing code in Python, JavaScript, TypeScript\n• Generating commands for terminal\n• Answering questions\n\nWhat would you like help with?`;
      } else if (lowerInput.includes("help")) {
        responseContent = `I can help you with:\n\n💻 **Code Generation** - Ask for code in any language\n⚡ **Commands** - Get terminal commands\n❓ **Questions** - Ask me anything\n\nTry saying "show me python code" or "give me install commands"!`;
      } else {
        responseContent = `I understand you said "${userInput}". Here's how I can help:\n\n• Ask for **code** and I'll show you examples\n• Request **commands** for terminal operations\n• Ask **questions** about programming\n\nWhat specific help do you need?`;
      }
    }

    // Add empty assistant message
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
                  content: responseType === "mixed" ? "" : "",
                  type: responseType,
                  language: responseType === "code" ? language : undefined,
                  parts: responseType === "mixed" ? responseParts : undefined,
                  isStreaming: true,
                },
              ],
            }
          : tab
      )
    );

    // Simulate token streaming
    if (responseType === "mixed") {
      // For mixed content, simulate streaming through parts
      let currentParts: any[] = [];
      
      for (let partIndex = 0; partIndex < responseParts.length; partIndex++) {
        const part = responseParts[partIndex];
        const newPart = { ...part, content: "" };
        currentParts.push(newPart);
        
        // Stream all content types (text, code, command) character by character
        const chars = part.content.split("");
        for (let i = 0; i < chars.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 15));
          
          // Update the current part's content progressively
          currentParts[partIndex] = {
            ...part,
            content: part.content.slice(0, i + 1)
          };
          
          setTabs((prevTabs) =>
            prevTabs.map((tab) =>
              tab.id === activeTabId
                ? {
                    ...tab,
                    messages: tab.messages.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, parts: [...currentParts] }
                        : msg
                    ),
                  }
                : tab
            )
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 100)); // Shorter pause between parts
      }
    } else {
      // For single content type, stream normally
      const chars = responseContent.split("");
      for (let i = 0; i < chars.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));

        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === activeTabId
              ? {
                  ...tab,
                  messages: tab.messages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: responseContent.slice(0, i + 1), isStreaming: true }
                      : msg // Keep other messages unchanged
                  ),
                }
              : tab
          )
        );
      }
    }

    // Mark streaming as complete
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
  };


  // Filter tabs based on search
  const filteredTabs = tabs.filter(tab => 
    tab.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Create new project
  const handleCreateProject = () => {
    setShowProjectDialog(true);
  };

  // Handle project creation
  const handleProjectCreate = async (projectName: string, projectPath: string) => {
    try {
      // Check if we're running in Tauri (desktop app)
      const isTauri = (window as any).__TAURI__;
      
      let fullPath: string;
      
      if (isTauri) {
        // Create the project folder using Tauri command
        const { invoke } = await import("@tauri-apps/api/core");
        fullPath = await invoke<string>("create_project_folder", {
          projectPath,
          projectName,
        });
      } else {
        // Web browser fallback - just use the path as-is
        fullPath = `${projectPath}/${projectName}`;
        console.log(`Project "${projectName}" would be created at "${fullPath}" (web mode)`);
      }
      
      const newProject: ChatTab = {
        id: Date.now().toString(),
        title: projectName,
        messages: [],
        createdAt: Date.now(),
        type: "project",
        projectPath: fullPath,
      };
      setTabs([...tabs, newProject]);
      setActiveTabId(newProject.id);
      
      console.log(`Project "${projectName}" created successfully at "${fullPath}"`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Failed to create project: ${error}`);
    }
  };

  // Open existing project
  const handleOpenProject = () => {
    setShowOpenProjectDialog(true);
  };

  // Handle opening existing project
  const handleProjectOpen = async (projectPath: string, projectName: string) => {
    try {
      // Check if we're running in Tauri (desktop app)
      const isTauri = (window as any).__TAURI__;
      
      let isValid = true;
      
      if (isTauri) {
        // Validate the project folder before opening
        const { invoke } = await import("@tauri-apps/api/core");
        isValid = await invoke<boolean>("validate_project_folder", {
          projectPath: projectPath
        });
      } else {
        // Web browser fallback - assume valid if path is provided
        isValid = projectPath.trim().length > 0;
        console.log(`Opening project "${projectName}" from "${projectPath}" (web mode)`);
      }
      
      if (isValid) {
        const existingProject: ChatTab = {
          id: Date.now().toString(),
          title: projectName,
          messages: [],
          createdAt: Date.now(),
          type: "project",
          projectPath: projectPath,
        };
        setTabs([...tabs, existingProject]);
        setActiveTabId(existingProject.id);
        
        console.log(`Opened existing project "${projectName}" from "${projectPath}"`);
      } else {
        alert("Invalid project folder selected.");
      }
    } catch (error) {
      console.error("Failed to validate project folder:", error);
      alert("Failed to validate project folder.");
    }
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    // TODO: Implement settings dialog
  };

  return (
    <>
      <TitleBar 
        isIDEMode={activeTab?.type === "project"}
        showExplorer={ideShowExplorer}
        showChat={ideShowChat}
        showTerminal={ideShowTerminal}
        onToggleExplorer={() => setIdeShowExplorer(!ideShowExplorer)}
        onToggleChat={() => setIdeShowChat(!ideShowChat)}
        onToggleTerminal={() => setIdeShowTerminal(!ideShowTerminal)}
        onCloseIDE={handleBackToChat}
        onSettings={handleSettings}
      />
      <div className="app app-with-titlebar">
        {activeTab?.type === "project" ? (
          // Project View - VSCode-like interface
          <ProjectView
            projectPath={activeTab.projectPath || ""}
            projectName={activeTab.title}
            messages={activeTab.messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onRetryMessage={handleRetryMessage}
            onBackToChat={handleBackToChat}
            contextUsed={contextUsed}
            showExplorer={ideShowExplorer}
            showChat={ideShowChat}
            showTerminal={ideShowTerminal}
            onExplorerChange={setIdeShowExplorer}
            onChatChange={setIdeShowChat}
            onTerminalChange={setIdeShowTerminal}
          />
        ) : (
          // Regular Chat View
          <>
            <Sidebar
              tabs={filteredTabs}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onNewTab={handleNewTab}
              onDeleteTab={handleDeleteTab}
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCreateProject={handleCreateProject}
              onOpenProject={handleOpenProject}
            />
            <div className="main-content">
              <Header title={activeTab?.title || "New Chat"} />
              <ChatArea 
                messages={activeTab?.messages || []} 
                isLoading={isLoading} 
                onEditMessage={handleEditMessage}
                onRetryMessage={handleRetryMessage}
              />
              <InputArea 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                contextUsed={contextUsed}
              />
            </div>
          </>
        )}
        
        <ProjectDialog
          isOpen={showProjectDialog}
          onClose={() => setShowProjectDialog(false)}
          onCreateProject={handleProjectCreate}
        />
        
        <OpenProjectDialog
          isOpen={showOpenProjectDialog}
          onClose={() => setShowOpenProjectDialog(false)}
          onOpenProject={handleProjectOpen}
        />
      </div>
    </>
  );
}

export default App;
