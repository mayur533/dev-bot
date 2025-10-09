import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./OpenProjectDialog.css";

interface OpenProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (projectPath: string, projectName: string) => void;
}

function OpenProjectDialog({ isOpen, onClose, onOpenProject }: OpenProjectDialogProps) {
  const [projectPath, setProjectPath] = useState("");
  const [isSelectingPath, setIsSelectingPath] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectPath.trim()) {
      setError("Please enter or select a project folder");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      // Validate the folder path using Tauri command
      const isValid = await invoke<boolean>("validate_project_folder", {
        projectPath: projectPath.trim()
      });

      if (isValid) {
        // Extract project name from path
        const pathParts = projectPath.split(/[/\\]/);
        const projectName = pathParts[pathParts.length - 1] || "Project";
        
        onOpenProject(projectPath.trim(), projectName);
        setProjectPath("");
        setError("");
        onClose();
      }
    } catch (err) {
      // Handle validation error
      setError(typeof err === 'string' ? err : "Invalid folder path. Please check and try again.");
    } finally {
      setIsValidating(false);
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
              Project Folder
            </label>
            <div className="path-input-group">
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => {
                  setProjectPath(e.target.value);
                  setError(""); // Clear error when user types
                }}
                placeholder="Enter or browse for project folder..."
                className={`form-input path-input ${error ? 'input-error' : ''}`}
                required
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
            {error && <div className="error-message">{error}</div>}
            <small className="form-help">
              Enter the path manually or click Browse to select your project folder
            </small>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!projectPath.trim() || isValidating}
            >
              {isValidating ? "Validating..." : "Open Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OpenProjectDialog;
