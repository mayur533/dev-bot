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
    console.log("Browse button clicked");
    
    try {
      // Dynamic import of Tauri dialog
      const dialog = await import("@tauri-apps/plugin-dialog");
      console.log("Dialog plugin loaded");
      
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: "Select Project Folder",
      });
      
      console.log("Selected folder:", selected);
      
      if (selected && typeof selected === 'string') {
        const selectedPath = selected;
        setProjectPath(selectedPath);
        
        // Auto-submit when folder is selected
        const pathParts = selectedPath.split(/[/\\]/);
        const projectName = pathParts[pathParts.length - 1] || "Project";
        
        console.log("Opening project:", projectName, "at", selectedPath);
        onOpenProject(selectedPath, projectName);
        onClose();
      } else {
        console.log("No folder selected or selection cancelled");
      }
    } catch (error) {
      console.error("Error opening folder picker:", error);
      alert(`Failed to open folder picker: ${error}\n\nPlease ensure you're running the app in Tauri mode.`);
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
