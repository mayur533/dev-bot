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
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left">
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
        >
          <Minus size={16} />
        </button>
        <button
          className="titlebar-button maximize-button"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square size={14} />
        </button>
        <button
          className="titlebar-button close-button"
          onClick={handleClose}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;

