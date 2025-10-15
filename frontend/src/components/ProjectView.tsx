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
  contextUsed?: number;
  showExplorer?: boolean;
  showChat?: boolean;
  showTerminal?: boolean;
  onExplorerChange?: (show: boolean) => void;
  onChatChange?: (show: boolean) => void;
  onTerminalChange?: (show: boolean) => void;
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent?: string; // For diff comparison
  language: string;
  isDirty?: boolean;
  isSupported?: boolean;
  errorMessage?: string;
}

function ProjectView({ 
  projectPath, 
  projectName, 
  messages, 
  isLoading,
  onSendMessage,
  onEditMessage,
  onRetryMessage,
  onBackToChat,
  contextUsed = 0,
  showExplorer: propShowExplorer,
  showChat: propShowChat,
  showTerminal: propShowTerminal,
  onExplorerChange,
  onChatChange,
  onTerminalChange
}: ProjectViewProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(350);
  const [terminalHeight, setTerminalHeight] = useState(200);
  
  // Use props if provided, otherwise use local state
  const showExplorer = propShowExplorer !== undefined ? propShowExplorer : true;
  const showChat = propShowChat !== undefined ? propShowChat : true;
  const showTerminal = propShowTerminal !== undefined ? propShowTerminal : false;

  const handleFileOpen = async (filePath: string, fileName: string) => {
    console.log("Opening file:", fileName, "at path:", filePath);
    
    // Check if file is already open
    const existingFile = openFiles.find(f => f.path === filePath);
    if (existingFile) {
      console.log("File already open, switching to it");
      setActiveFilePath(filePath);
      return;
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Check if file type is supported for text editing
    const unsupportedBinaryExtensions = [
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', // Images
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', // Videos
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', // Audio
      'zip', 'rar', '7z', 'tar', 'gz', 'bz2', // Archives
      'exe', 'dll', 'so', 'dylib', 'bin', // Binaries
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', // Documents
      'ttf', 'otf', 'woff', 'woff2', 'eot', // Fonts
      'db', 'sqlite', 'sqlite3' // Databases
    ];

    if (unsupportedBinaryExtensions.includes(fileExtension)) {
      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: '',
        language: 'binary',
        isSupported: false,
        isDirty: false,
        errorMessage: `This file type (.${fileExtension}) cannot be displayed in the text editor.`
      };
      
      setOpenFiles([...openFiles, newFile]);
      setActiveFilePath(filePath);
      console.log("File type not supported for editing:", fileExtension);
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

      const language = getLanguageFromExtension(fileExtension);

      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: fileContent,
        originalContent: fileContent, // Store original for diff
        language,
        isDirty: false,
        isSupported: true
      };

      setOpenFiles([...openFiles, newFile]);
      setActiveFilePath(filePath);
      console.log("File opened successfully");
    } catch (error) {
      console.error("Failed to open file:", error);
      
      // Create an unsupported file entry with error message
      const newFile: OpenFile = {
        path: filePath,
        name: fileName,
        content: '',
        language: 'text',
        isSupported: false,
        isDirty: false,
        errorMessage: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      };
      
      setOpenFiles([...openFiles, newFile]);
      setActiveFilePath(filePath);
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
      f.path === filePath 
        ? { 
            ...f, 
            content: newContent,
            isDirty: newContent !== f.originalContent
          } 
        : f
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
            contextUsed={contextUsed}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectView;

