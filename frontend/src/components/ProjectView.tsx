import { useState } from "react";
import FileExplorer from "./FileExplorer";
import CodeEditor from "./CodeEditor";
import ChatSidebar from "./ChatSidebar";
import { Message } from "../types";
import "./ProjectView.css";

interface ProjectViewProps {
  projectPath: string;
  projectName: string;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRetryMessage: (messageId: string) => void;
  onBackToChat: () => void;
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

function ProjectView({ 
  projectPath, 
  projectName, 
  messages, 
  isLoading,
  onSendMessage,
  onEditMessage,
  onRetryMessage,
  onBackToChat
}: ProjectViewProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(350);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);

  const handleFileOpen = async (filePath: string, fileName: string) => {
    console.log("Opening file:", fileName, "at path:", filePath);
    
    // Check if file is already open
    const existingFile = openFiles.find(f => f.path === filePath);
    if (existingFile) {
      console.log("File already open, switching to it");
      setActiveFilePath(filePath);
      return;
    }

    try {
      // Read file content via Tauri
      const { invoke } = await import("@tauri-apps/api/core");
      console.log("Invoking read_file_content for:", filePath);
      
      const fileContent = await invoke<string>("read_file_content", {
        filePath: filePath
      });
      
      console.log("File content loaded, length:", fileContent.length);

      const fileExtension = fileName.split('.').pop() || '';
      const language = getLanguageFromExtension(fileExtension);

      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: fileContent,
        language
      };

      setOpenFiles([...openFiles, newFile]);
      setActiveFilePath(filePath);
      console.log("File opened successfully");
    } catch (error) {
      console.error("Failed to open file:", error);
      alert(`Failed to open file: ${error}\n\nFile: ${fileName}\nPath: ${filePath}`);
    }
  };

  const handleFileClose = (filePath: string) => {
    setOpenFiles(openFiles.filter(f => f.path !== filePath));
    if (activeFilePath === filePath && openFiles.length > 1) {
      const remainingFiles = openFiles.filter(f => f.path !== filePath);
      setActiveFilePath(remainingFiles[0]?.path || null);
    } else if (openFiles.length === 1) {
      setActiveFilePath(null);
    }
  };

  const handleFileChange = (filePath: string, newContent: string) => {
    setOpenFiles(openFiles.map(f => 
      f.path === filePath ? { ...f, content: newContent } : f
    ));
  };

  const getLanguageFromExtension = (ext: string): string => {
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
    };
    return langMap[ext] || 'text';
  };

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  return (
    <div className="project-view">
      <div className="project-main">
        {showExplorer && (
          <FileExplorer
            projectPath={projectPath}
            projectName={projectName}
            width={explorerWidth}
            onFileOpen={handleFileOpen}
            onResize={setExplorerWidth}
            onBackToChat={onBackToChat}
          />
        )}
        <div className="editor-terminal-container">
          <div className="editor-section" style={{ height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%' }}>
            <CodeEditor
              openFiles={openFiles}
              activeFile={activeFile}
              onFileSelect={setActiveFilePath}
              onFileClose={handleFileClose}
              onFileChange={handleFileChange}
              showExplorer={showExplorer}
              showChat={showChat}
              showTerminal={showTerminal}
              onToggleExplorer={() => setShowExplorer(!showExplorer)}
              onToggleChat={() => setShowChat(!showChat)}
              onToggleTerminal={() => setShowTerminal(!showTerminal)}
            />
          </div>
          {showTerminal && (
            <div className="terminal-section" style={{ height: `${terminalHeight}px` }}>
              <div className="terminal-header">
                <span className="terminal-title">Terminal</span>
              </div>
              <div className="terminal-content">
                <div className="terminal-output">$ Ready to execute commands...</div>
              </div>
            </div>
          )}
        </div>
        {showChat && (
          <ChatSidebar
            messages={messages}
            isLoading={isLoading}
            width={chatWidth}
            onSendMessage={onSendMessage}
            onEditMessage={onEditMessage}
            onRetryMessage={onRetryMessage}
            onResize={setChatWidth}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectView;

