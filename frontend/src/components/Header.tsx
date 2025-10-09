import ThemeToggle from "./ThemeToggle";
import "./Header.css";

interface HeaderProps {
  className?: string;
  title?: string;
}

function Header({ className = "", title }: HeaderProps) {
  return (
    <header className={`app-header ${className}`}>
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">{title || "AI Platform"}</h1>
        </div>
        <div className="header-right">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;

