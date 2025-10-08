import { X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import "./CodeEditor.css";

interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

interface CodeEditorProps {
  openFiles: OpenFile[];
  activeFile: OpenFile | undefined;
  onFileSelect: (filePath: string) => void;
  onFileClose: (filePath: string) => void;
  onFileChange: (filePath: string, newContent: string) => void;
  showExplorer: boolean;
  showChat: boolean;
  onToggleExplorer: () => void;
  onToggleChat: () => void;
}

function CodeEditor({ 
  openFiles, 
  activeFile, 
  onFileSelect, 
  onFileClose, 
  onFileChange,
  showExplorer,
  showChat,
  onToggleExplorer,
  onToggleChat
}: CodeEditorProps) {
  
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      onFileChange(activeFile.path, e.target.value);
    }
  };

  return (
    <div className="code-editor">
      {/* File Tabs with Toggle Buttons */}
      <div className="editor-tabs">
        <div className="tabs-container">
          {openFiles.length === 0 ? (
            <div className="no-tabs">No files open</div>
          ) : (
            openFiles.map((file) => (
              <div
                key={file.path}
                className={`editor-tab ${activeFile?.path === file.path ? 'active' : ''}`}
                onClick={() => onFileSelect(file.path)}
              >
                <span className="tab-name">{file.name}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file.path);
                  }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="tabs-toggles">
          <button 
            className="toggle-btn" 
            onClick={onToggleExplorer}
            title={showExplorer ? "Hide Explorer" : "Show Explorer"}
          >
            {showExplorer ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <button 
            className="toggle-btn" 
            onClick={onToggleChat}
            title={showChat ? "Hide Chat" : "Show Chat"}
          >
            {showChat ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {activeFile ? (
          <div className="editor-wrapper">
            <div className="editor-lines">
              {activeFile.content.split('\n').map((_, index) => (
                <div key={index} className="line-number">{index + 1}</div>
              ))}
            </div>
            <textarea
              className="editor-textarea"
              value={activeFile.content}
              onChange={handleEditorChange}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="editor-empty">
            <div className="empty-icon">📝</div>
            <h3>No File Selected</h3>
            <p>Open a file from the explorer to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;

