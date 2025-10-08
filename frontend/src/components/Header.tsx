import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Header.css";

interface HeaderProps {
  className?: string;
  title?: string;
  contextUsed?: number; // Number of tokens/characters used
  contextLimit?: number; // Total context limit
}

function Header({ className = "", title, contextUsed = 0, contextLimit = 1000000 }: HeaderProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculatedPercentage = (contextUsed / contextLimit) * 100;
    setPercentage(Math.min(calculatedPercentage, 100));
  }, [contextUsed, contextLimit]);

  const getProgressColor = () => {
    if (percentage < 50) return "var(--success-color, #10b981)";
    if (percentage < 75) return "var(--warning-color, #f59e0b)";
    return "var(--error-color, #ef4444)";
  };

  return (
    <header className={`app-header ${className}`}>
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">{title || "AI Platform"}</h1>
        </div>
        <div className="header-right">
          <div className="context-indicator">
            <span className="context-label">Context</span>
            <div className="context-progress-bar">
              <div 
                className="context-progress-fill" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: getProgressColor()
                }}
              />
            </div>
            <span className="context-percentage">{percentage.toFixed(1)}%</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;

