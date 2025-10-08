import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File, FileText, FileCode } from "lucide-react";
import "./FileExplorer.css";

interface FileExplorerProps {
  projectPath: string;
  projectName: string;
  width: number;
  onFileOpen: (filePath: string, fileName: string) => void;
  onResize: (width: number) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

function FileExplorer({ projectPath, projectName, width, onFileOpen, onResize }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const loadFileTree = async () => {
      try {
        // Check if we're running in Tauri
        const isTauri = (window as any).__TAURI__;
        
        if (isTauri) {
          const { invoke } = await import("@tauri-apps/api/core");
          const tree = await invoke<FileNode[]>("get_folder_structure", {
            folderPath: projectPath
          });
          setFileTree(tree);
        } else {
          // Mock tree for web mode
          const mockTree: FileNode[] = [
            {
              name: 'src',
              path: `${projectPath}/src`,
              type: 'folder',
              expanded: true,
              children: [
                { name: 'App.tsx', path: `${projectPath}/src/App.tsx`, type: 'file' },
                { name: 'main.tsx', path: `${projectPath}/src/main.tsx`, type: 'file' },
                {
                  name: 'components',
                  path: `${projectPath}/src/components`,
                  type: 'folder',
                  expanded: false,
                  children: [
                    { name: 'Header.tsx', path: `${projectPath}/src/components/Header.tsx`, type: 'file' },
                    { name: 'Sidebar.tsx', path: `${projectPath}/src/components/Sidebar.tsx`, type: 'file' },
                  ]
                }
              ]
            },
            { name: 'package.json', path: `${projectPath}/package.json`, type: 'file' },
            { name: 'README.md', path: `${projectPath}/README.md`, type: 'file' },
          ];
          setFileTree(mockTree);
        }
      } catch (error) {
        console.error("Failed to load file tree:", error);
      }
    };
    
    loadFileTree();
  }, [projectPath]);

  const toggleFolder = (path: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'folder') {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 500) {
          onResize(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, onResize]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs'].includes(ext || '')) {
      return <FileCode size={16} />;
    }
    if (['md', 'txt'].includes(ext || '')) {
      return <FileText size={16} />;
    }
    return <File size={16} />;
  };

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.path} className="tree-item">
        <div
          className="tree-node"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => node.type === 'folder' ? toggleFolder(node.path) : onFileOpen(node.path, node.name)}
        >
          {node.type === 'folder' ? (
            <>
              {node.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="folder-icon" />
            </>
          ) : (
            <>{getFileIcon(node.name)}</>
          )}
          <span className="node-name">{node.name}</span>
        </div>
        {node.type === 'folder' && node.expanded && node.children && (
          <div className="tree-children">
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="file-explorer" style={{ width: `${width}px` }}>
      <div className="explorer-header">
        <span className="explorer-title">{projectName}</span>
      </div>
      <div className="explorer-content">
        {renderTree(fileTree)}
      </div>
      <div
        className="resize-handle"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

export default FileExplorer;

