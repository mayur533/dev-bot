import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import "./TitleBar.css";

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const appWindow = getCurrentWindow();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Listen for window resize events
    const unlisten = getCurrentWindow().onResized(() => {
      checkMaximized();
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    } catch (error) {
      console.error("Failed to toggle maximize:", error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  const handleDoubleClick = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    } catch (error) {
      console.error("Failed to toggle maximize on double-click:", error);
    }
  };

  return (
    <div className="titlebar" data-tauri-drag-region onDoubleClick={handleDoubleClick}>
      <div className="titlebar-left" data-tauri-drag-region="true">
        <div className="titlebar-icon">
          <img src="/vite.svg" alt="App Icon" className="app-icon" />
        </div>
        <div className="titlebar-title">AI Platform</div>
      </div>

      <div className="titlebar-controls">
        <button
          className="titlebar-button minimize-button"
          onClick={handleMinimize}
          title="Minimize"
          type="button"
        >
          <Minus size={16} />
        </button>
        <button
          className="titlebar-button maximize-button"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          type="button"
        >
          <Square size={14} />
        </button>
        <button
          className="titlebar-button close-button"
          onClick={handleClose}
          title="Close"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;

