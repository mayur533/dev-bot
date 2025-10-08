import { ChatTab } from "../types";
import { 
  Menu, 
  Search, 
  MessageSquare, 
  FolderPlus, 
  FolderOpen, 
  Settings, 
  X 
} from "lucide-react";
import "./Sidebar.css";

interface SidebarProps {
  tabs: ChatTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onNewTab: () => void;
  onDeleteTab: (tabId: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateProject: () => void;
  onOpenProject: () => void;
}

function Sidebar({ 
  tabs, 
  activeTabId, 
  onTabSelect, 
  onNewTab, 
  onDeleteTab,
  collapsed,
  onToggle,
  searchQuery,
  onSearchChange,
  onCreateProject,
  onOpenProject
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">AI Platform</h2>}
        <button className="menu-toggle-btn" onClick={onToggle} title={collapsed ? "Open sidebar" : "Close sidebar"}>
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Main Actions */}
      {!collapsed && (
        <div className="sidebar-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            <Search size={14} className="search-icon" />
          </div>
          
          <button className="action-btn primary" onClick={onNewTab}>
            <MessageSquare size={18} className="btn-icon" />
            <span className="btn-text">New Chat</span>
          </button>
          
          <button className="action-btn" onClick={onCreateProject}>
            <FolderPlus size={18} className="btn-icon" />
            <span className="btn-text">Create Project</span>
          </button>
          
          <button className="action-btn" onClick={onOpenProject}>
            <FolderOpen size={18} className="btn-icon" />
            <span className="btn-text">Open Project</span>
          </button>
        </div>
      )}

      {/* Tabs List */}
      <div className="tabs-list">
        {collapsed ? (
          // Collapsed view - just icons
          tabs.slice(0, 8).map((tab) => (
            <div
              key={tab.id}
              className={`tab-item collapsed ${tab.id === activeTabId ? "active" : ""}`}
              onClick={() => onTabSelect(tab.id)}
              title={`${tab.type === "project" ? "Project" : "Chat"}: ${tab.title}`}
            >
              <span className="tab-icon">
                {tab.type === "project" ? <FolderPlus size={18} /> : <MessageSquare size={18} />}
              </span>
            </div>
          ))
        ) : (
          // Expanded view - full tabs
          tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
              onClick={() => onTabSelect(tab.id)}
            >
              <div className="tab-content">
                <span className="tab-icon">
                  {tab.type === "project" ? <FolderPlus size={18} /> : <MessageSquare size={18} />}
                </span>
                <div className="tab-info">
                  <span className="tab-title">{tab.title}</span>
                  {tab.type === "project" && tab.projectPath && (
                    <span className="tab-path">{tab.projectPath}</span>
                  )}
                </div>
              </div>
              {tabs.length > 1 && (
                <button
                  className="delete-tab-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTab(tab.id);
                  }}
                  title={`Delete ${tab.type}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-info">
            <span className="info-label">Total Chats:</span>
            <span className="info-value">{tabs.length}</span>
          </div>
          <button className="user-settings-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;

