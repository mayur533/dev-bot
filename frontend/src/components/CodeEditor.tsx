import { X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Terminal, GitCompare, FileEdit } from "lucide-react";
import { useState } from "react";
import DiffViewer from "./DiffViewer";
import "./CodeEditor.css";

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

interface CodeEditorProps {
  openFiles: OpenFile[];
  activeFile: OpenFile | undefined;
  onFileSelect: (filePath: string) => void;
  onFileClose: (filePath: string) => void;
  onFileChange: (filePath: string, newContent: string) => void;
  showExplorer: boolean;
  showChat: boolean;
  showTerminal: boolean;
  onToggleExplorer: () => void;
  onToggleChat: () => void;
  onToggleTerminal: () => void;
}

function CodeEditor({ 
  openFiles, 
  activeFile, 
  onFileSelect, 
  onFileClose, 
  onFileChange,
  showExplorer,
  showChat,
  showTerminal,
  onToggleExplorer,
  onToggleChat,
  onToggleTerminal
}: CodeEditorProps) {
  const [viewMode, setViewMode] = useState<"edit" | "diff">("edit");
  
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      onFileChange(activeFile.path, e.target.value);
    }
  };

  const handleAcceptChange = (hunkId: string) => {
    console.log("Accepted change:", hunkId);
    // Accept logic can be handled in parent component
  };

  const handleRejectChange = (hunkId: string) => {
    console.log("Rejected change:", hunkId);
    // Reject logic can be handled in parent component
  };

  const handleAcceptAll = () => {
    if (activeFile) {
      console.log("Accepted all changes for:", activeFile.path);
      // This would apply all changes
    }
  };

  const handleRejectAll = () => {
    if (activeFile && activeFile.originalContent) {
      // Revert to original content
      onFileChange(activeFile.path, activeFile.originalContent);
      console.log("Rejected all changes for:", activeFile.path);
    }
  };

  const hasChanges = activeFile && activeFile.originalContent && activeFile.content !== activeFile.originalContent;

  return (
    <div className="code-editor">
      {/* File Tabs */}
      <div className="editor-tabs">
        <div className="tabs-container">
          {openFiles.length === 0 ? (
            <div className="no-tabs">No files open</div>
          ) : (
            openFiles.map((file) => (
              <div
                key={file.path}
                className={`editor-tab ${activeFile?.path === file.path ? 'active' : ''} ${file.isDirty ? 'dirty' : ''}`}
                onClick={() => onFileSelect(file.path)}
              >
                <span className="tab-name">
                  {file.isDirty && <span className="dirty-indicator">● </span>}
                  {file.name}
                </span>
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
        
        {/* View Mode Toggle */}
        {hasChanges && (
          <div className="view-mode-toggle">
            <button
              className={`mode-btn ${viewMode === "edit" ? "active" : ""}`}
              onClick={() => setViewMode("edit")}
              title="Edit Mode"
            >
              <FileEdit size={16} />
            </button>
            <button
              className={`mode-btn ${viewMode === "diff" ? "active" : ""}`}
              onClick={() => setViewMode("diff")}
              title="Diff Mode"
            >
              <GitCompare size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="editor-content">
        {activeFile ? (
          activeFile.isSupported === false ? (
            <div className="editor-unsupported">
              <div className="unsupported-icon">⚠️</div>
              <h3>File Not Supported</h3>
              <p className="unsupported-filename">{activeFile.name}</p>
              <p className="unsupported-message">
                {activeFile.errorMessage || 'This file type cannot be displayed in the text editor.'}
              </p>
              <div className="unsupported-info">
                <p><strong>File path:</strong> {activeFile.path}</p>
                <p><strong>File type:</strong> {activeFile.language}</p>
              </div>
            </div>
          ) : viewMode === "diff" && activeFile.originalContent ? (
            <DiffViewer
              originalContent={activeFile.originalContent}
              modifiedContent={activeFile.content}
              fileName={activeFile.name}
              onAcceptChange={handleAcceptChange}
              onRejectChange={handleRejectChange}
              onAcceptAll={handleAcceptAll}
              onRejectAll={handleRejectAll}
            />
          ) : (
            <div className="editor-wrapper">
              <div className="editor-content-inner">
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
            </div>
          )
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

