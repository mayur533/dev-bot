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
          setProjectPath(selected as string);
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
          <h2 className="dialog-title">Open Existing Project</h2>
          <button className="dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="projectPath" className="form-label">
              Project Location
            </label>
            <div className="path-input-group">
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="Select or enter project location..."
                className="form-input path-input"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleSelectPath}
                className="path-select-btn"
                disabled={isSelectingPath}
              >
                {isSelectingPath ? "..." : "📁 Browse"}
              </button>
            </div>
            <small className="form-help">
              Select the folder containing your existing project
            </small>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!projectPath.trim()}
            >
              Open Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OpenProjectDialog;
