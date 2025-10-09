import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, PanelLeft, PanelRight, Terminal, Settings, ArrowLeft } from "lucide-react";
import "./TitleBar.css";

interface TitleBarProps {
  isIDEMode?: boolean;
  showExplorer?: boolean;
  showChat?: boolean;
  showTerminal?: boolean;
  onToggleExplorer?: () => void;
  onToggleChat?: () => void;
  onToggleTerminal?: () => void;
  onCloseIDE?: () => void;
  onSettings?: () => void;
}

function TitleBar({ 
  isIDEMode = false,
  showExplorer = true,
  showChat = true,
  showTerminal = false,
  onToggleExplorer,
  onToggleChat,
  onToggleTerminal,
  onCloseIDE,
  onSettings
}: TitleBarProps) {
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

  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Maximize button clicked");
    try {
      const appWindow = getCurrentWindow();
      console.log("Current window obtained:", appWindow);
      console.log("Before maximize, isMaximized:", isMaximized);
      await appWindow.toggleMaximize();
      console.log("toggleMaximize called");
      // Small delay to ensure state updates
      setTimeout(async () => {
        const maximized = await appWindow.isMaximized();
        console.log("After maximize, isMaximized:", maximized);
        setIsMaximized(maximized);
      }, 100);
    } catch (error) {
      console.error("Failed to toggle maximize:", error);
      console.error("Error details:", JSON.stringify(error));
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
    <div className="titlebar" data-tauri-drag-region="true" onDoubleClick={handleDoubleClick}>
      <div className="titlebar-left" data-tauri-drag-region="true">
        {/* Back button - before icon/title */}
        {isIDEMode && (
          <button
            className="titlebar-ide-button back-button"
            onClick={onCloseIDE}
            title="Back to Chat"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        
        <div className="titlebar-icon">
          <img src="/vite.svg" alt="App Icon" className="app-icon" />
        </div>
        <div className="titlebar-title">AI Platform</div>
      </div>

      <div className="titlebar-controls">
        {/* IDE Mode Controls - near window controls */}
        {isIDEMode && (
          <div className="titlebar-ide-controls">
            <button
              className="titlebar-ide-button"
              onClick={onToggleExplorer}
              title="Toggle File Explorer"
              type="button"
            >
              {showExplorer ? <PanelLeft size={16} fill="currentColor" /> : <PanelLeft size={16} />}
            </button>
            <button
              className="titlebar-ide-button"
              onClick={onToggleChat}
              title="Toggle Chat Sidebar"
              type="button"
            >
              {showChat ? <PanelRight size={16} fill="currentColor" /> : <PanelRight size={16} />}
            </button>
            <button
              className="titlebar-ide-button"
              onClick={onToggleTerminal}
              title="Toggle Terminal"
              type="button"
            >
              {showTerminal ? <Terminal size={16} fill="currentColor" /> : <Terminal size={16} />}
            </button>
            <button
              className="titlebar-ide-button"
              onClick={onSettings}
              title="Settings"
              type="button"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
        
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

