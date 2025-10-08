import { useState } from "react";
import "./OpenProjectDialog.css";

interface OpenProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (projectPath: string, projectName: string) => void;
}

function OpenProjectDialog({ isOpen, onClose, onOpenProject }: OpenProjectDialogProps) {
  const [projectPath, setProjectPath] = useState("");
  const [isSelectingPath, setIsSelectingPath] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectPath.trim()) {
      // Extract project name from path
      const pathParts = projectPath.split(/[/\\]/);
      const projectName = pathParts[pathParts.length - 1] || "Project";
      
      onOpenProject(projectPath.trim(), projectName);
      setProjectPath("");
      onClose();
    }
  };

  const handleSelectPath = async () => {
    setIsSelectingPath(true);
    try {
      // Check if we're running in Tauri (desktop app)
      const isTauri = window.__TAURI__;
      
      if (isTauri) {
        // Use Tauri's native dialog API (uses system's default file picker)
        const { open } = await import("@tauri-apps/plugin-dialog");
        const selected = await open({
          directory: true,
          multiple: false,
          title: "Select Project Folder",
        });
        
        if (selected) {
          const selectedPath = selected as string;
          setProjectPath(selectedPath);
          
          // Auto-submit when folder is selected
          const pathParts = selectedPath.split(/[/\\]/);
          const projectName = pathParts[pathParts.length - 1] || "Project";
          onOpenProject(selectedPath, projectName);
          onClose();
        }
      }
    } catch (error) {
      console.error("Error opening folder picker:", error);
      alert("Failed to open folder picker. Please try again.");
    } finally {
      setIsSelectingPath(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Open Project</h2>
          <button className="dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="projectPath" className="form-label">
              Select Project Folder
            </label>
            <div className="path-input-group">
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="Click Browse to select a folder..."
                className="form-input path-input"
                readOnly
              />
              <button
                type="button"
                onClick={handleSelectPath}
                className="path-select-btn primary-btn"
                disabled={isSelectingPath}
              >
                {isSelectingPath ? "Opening..." : "📁 Browse"}
              </button>
            </div>
            <small className="form-help">
              Click Browse to select your project folder
            </small>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OpenProjectDialog;
