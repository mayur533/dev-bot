import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * File Management Tools
 * Provides read, write, search, and analyze capabilities for project files
 */
export class FileTools {
  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Replace content in file using search and replace
   */
  async replaceInFile(
    filePath: string, 
    searchPattern: string | RegExp, 
    replacement: string,
    global: boolean = false
  ): Promise<{ success: boolean; replacements: number }> {
    try {
      const content = await this.readFile(filePath);
      
      let newContent: string;
      let replacements = 0;
      
      if (typeof searchPattern === 'string') {
        if (global) {
          const regex = new RegExp(this.escapeRegExp(searchPattern), 'g');
          newContent = content.replace(regex, () => {
            replacements++;
            return replacement;
          });
        } else {
          if (content.includes(searchPattern)) {
            newContent = content.replace(searchPattern, replacement);
            replacements = 1;
          } else {
            newContent = content;
          }
        }
      } else {
        // RegExp pattern
        const matches = content.match(searchPattern);
        replacements = matches ? matches.length : 0;
        newContent = content.replace(searchPattern, replacement);
      }
      
      if (replacements > 0) {
        await this.writeFile(filePath, newContent);
      }
      
      return { success: replacements > 0, replacements };
    } catch (error: any) {
      throw new Error(`Failed to replace in file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Replace entire file content
   */
  async replaceFileContent(filePath: string, newContent: string): Promise<void> {
    try {
      // Backup original file if it exists
      if (this.exists(filePath)) {
        const backupPath = `${filePath}.backup`;
        await this.copyFile(filePath, backupPath);
      }
      
      await this.writeFile(filePath, newContent);
    } catch (error: any) {
      throw new Error(`Failed to replace file content ${filePath}: ${error.message}`);
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if file/directory exists
   */
  exists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string, recursive: boolean = false): Promise<string[]> {
    try {
      if (recursive) {
        return await this.listDirectoryRecursive(dirPath);
      }
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? `${fullPath}/` : fullPath;
      });
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  private async listDirectoryRecursive(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            files.push(`${fullPath}/`);
            await traverse(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await traverse(dirPath);
    return files;
  }

  /**
   * Search files for pattern
   */
  async searchFiles(dirPath: string, pattern: RegExp): Promise<Array<{file: string, matches: string[]}>> {
    const results: Array<{file: string, matches: string[]}> = [];
    const files = await this.listDirectory(dirPath, true);
    
    for (const file of files) {
      if (file.endsWith('/')) continue; // Skip directories
      
      try {
        const content = await this.readFile(file);
        const matches = content.match(pattern);
        
        if (matches && matches.length > 0) {
          results.push({ file, matches });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    return results;
  }

  /**
   * Analyze file (get stats, type, etc.)
   */
  async analyzeFile(filePath: string): Promise<{
    path: string;
    size: number;
    type: string;
    lines?: number;
    extension: string;
    lastModified: Date;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath);
      
      let lines: number | undefined;
      if (stats.isFile() && this.isTextFile(extension)) {
        try {
          const content = await this.readFile(filePath);
          lines = content.split('\n').length;
        } catch {
          // Skip line count if can't read
        }
      }
      
      return {
        path: filePath,
        size: stats.size,
        type: stats.isDirectory() ? 'directory' : 'file',
        lines,
        extension,
        lastModified: stats.mtime,
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get project structure
   */
  async getProjectStructure(projectPath: string): Promise<any> {
    const structure: any = {
      name: path.basename(projectPath),
      path: projectPath,
      type: 'directory',
      children: []
    };

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip certain directories
        if (['node_modules', '.git', 'dist', 'build', '.next', 'venv'].includes(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(projectPath, entry.name);
        
        if (entry.isDirectory()) {
          structure.children.push(await this.getProjectStructure(fullPath));
        } else {
          const stats = await fs.stat(fullPath);
          structure.children.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            extension: path.extname(entry.name)
          });
        }
      }
    } catch (error: any) {
      console.error(`Error reading directory ${projectPath}:`, error);
    }
    
    return structure;
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  /**
   * Copy file
   */
  async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  /**
   * Check if extension is a text file
   */
  private isTextFile(extension: string): boolean {
    const textExtensions = [
      '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx',
      '.css', '.scss', '.html', '.xml', '.yaml', '.yml',
      '.py', '.java', '.c', '.cpp', '.h', '.go', '.rs',
      '.php', '.rb', '.sh', '.bash', '.sql'
    ];
    return textExtensions.includes(extension.toLowerCase());
  }
}

export function getFileTools(): FileTools {
  return new FileTools();
}

export default FileTools;

