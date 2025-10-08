import { useState } from "react";
import "./ProjectDialog.css";

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectName: string, projectPath: string) => void;
}

function ProjectDialog({ isOpen, onClose, onCreateProject }: ProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [isSelectingPath, setIsSelectingPath] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && projectPath.trim()) {
      onCreateProject(projectName.trim(), projectPath.trim());
      setProjectName("");
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
          <h2 className="dialog-title">Create New Project</h2>
          <button className="dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label htmlFor="projectName" className="form-label">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="form-input"
              required
              autoFocus
            />
            <small className="form-help">
              This will be the name of your project folder
            </small>
          </div>

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
              Choose where to create your project folder
            </small>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!projectName.trim() || !projectPath.trim()}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectDialog;
