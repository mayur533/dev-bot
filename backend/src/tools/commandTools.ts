import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
}

export interface PendingCommand {
  id: string;
  command: string;
  workingDirectory: string;
  dangerous: boolean;
  reason?: string;
  timestamp: number;
}

/**
 * Command Execution Tools
 * Executes shell commands with safety checks and confirmation requirements
 */
export class CommandTools {
  private pendingCommands: Map<string, PendingCommand> = new Map();
  
  // Dangerous command patterns that always require confirmation
  private dangerousPatterns = [
    /rm\s+-rf/,           // Recursive force delete
    /rm\s+.*\*/,          // Delete with wildcards
    /sudo/,               // Elevated privileges
    /dd\s+if=/,           // Disk operations
    /mkfs/,               // Format filesystem
    /fdisk/,              // Partition operations
    />\/dev\//,           // Write to device
    /chmod\s+-R\s+777/,   // Dangerous permissions
    /chown\s+-R/,         // Ownership changes
    /kill\s+-9/,          // Force kill
    /pkill/,              // Kill processes
    /shutdown/,           // System shutdown
    /reboot/,             // System reboot
    /iptables/,           // Firewall changes
    /git\s+push.*--force/,// Force push
    /npm\s+publish/,      // Package publishing
    /docker.*rm.*-f/,     // Docker force remove
  ];

  /**
   * Request to execute a command (requires confirmation)
   */
  requestCommand(
    command: string,
    workingDirectory: string = process.cwd()
  ): PendingCommand {
    const dangerous = this.isDangerous(command);
    
    const pendingCommand: PendingCommand = {
      id: this.generateId(),
      command,
      workingDirectory,
      dangerous,
      reason: dangerous ? this.getDangerReason(command) : undefined,
      timestamp: Date.now(),
    };
    
    this.pendingCommands.set(pendingCommand.id, pendingCommand);
    
    // Auto-expire after 5 minutes
    setTimeout(() => {
      this.pendingCommands.delete(pendingCommand.id);
    }, 5 * 60 * 1000);
    
    return pendingCommand;
  }

  /**
   * Get all pending commands
   */
  getPendingCommands(): PendingCommand[] {
    return Array.from(this.pendingCommands.values());
  }

  /**
   * Get specific pending command
   */
  getPendingCommand(id: string): PendingCommand | undefined {
    return this.pendingCommands.get(id);
  }

  /**
   * Execute a confirmed command
   */
  async executeConfirmedCommand(
    commandId: string,
    confirmed: boolean
  ): Promise<CommandResult> {
    const pending = this.pendingCommands.get(commandId);
    
    if (!pending) {
      throw new Error(`Command not found or expired: ${commandId}`);
    }
    
    if (!confirmed) {
      this.pendingCommands.delete(commandId);
      return {
        success: false,
        stdout: '',
        stderr: 'Command execution cancelled by user',
        exitCode: -1,
        command: pending.command,
      };
    }
    
    // Remove from pending
    this.pendingCommands.delete(commandId);
    
    // Execute command
    return await this.executeCommand(pending.command, pending.workingDirectory);
  }

  /**
   * Execute command directly (for safe commands only)
   */
  async executeCommand(
    command: string,
    workingDirectory: string = process.cwd(),
    timeout: number = 300000 // 5 minutes default
  ): Promise<CommandResult> {
    try {
      console.log(`Executing command: ${command}`);
      console.log(`Working directory: ${workingDirectory}`);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDirectory,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: {
          ...process.env,
          // Prevent interactive prompts
          DEBIAN_FRONTEND: 'noninteractive',
          npm_config_yes: 'true',
        }
      });
      
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        command,
      };
      
    } catch (error: any) {
      console.error(`Command failed: ${command}`, error);
      
      return {
        success: false,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        exitCode: error.code || 1,
        command,
      };
    }
  }

  /**
   * Execute command with real-time output streaming
   */
  async executeCommandStreaming(
    command: string,
    workingDirectory: string = process.cwd(),
    onOutput?: (data: string, isError: boolean) => void
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      // Split command into program and args
      const parts = command.split(' ');
      const program = parts[0];
      const args = parts.slice(1);
      
      const child = spawn(program, args, {
        cwd: workingDirectory,
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
          npm_config_yes: 'true',
        },
        shell: true,
      });
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (onOutput) onOutput(text, false);
      });
      
      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (onOutput) onOutput(text, true);
      });
      
      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          command,
        });
      });
      
      child.on('error', (error) => {
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: 1,
          command,
        });
      });
    });
  }

  /**
   * Check if command is dangerous
   */
  private isDangerous(command: string): boolean {
    return this.dangerousPatterns.some(pattern => pattern.test(command));
  }

  /**
   * Get reason why command is dangerous
   */
  private getDangerReason(command: string): string {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        const patternStr = pattern.toString();
        
        if (patternStr.includes('rm -rf')) return 'Recursive force deletion - can delete entire directories';
        if (patternStr.includes('sudo')) return 'Requires elevated privileges';
        if (patternStr.includes('dd if=')) return 'Low-level disk operation';
        if (patternStr.includes('chmod.*777')) return 'Sets dangerous file permissions';
        if (patternStr.includes('kill -9')) return 'Force kills processes';
        if (patternStr.includes('shutdown|reboot')) return 'System shutdown/reboot';
        if (patternStr.includes('force')) return 'Force operation - bypasses safety checks';
        
        return 'Potentially dangerous command';
      }
    }
    return 'Unknown risk';
  }

  /**
   * Generate unique ID for command
   */
  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * List common safe commands with descriptions
   */
  getSafeCommandExamples(): Array<{ command: string; description: string }> {
    return [
      { command: 'ls -la', description: 'List directory contents' },
      { command: 'pwd', description: 'Print working directory' },
      { command: 'cat filename.txt', description: 'Display file contents' },
      { command: 'mkdir dirname', description: 'Create directory' },
      { command: 'cp source dest', description: 'Copy file' },
      { command: 'mv source dest', description: 'Move/rename file' },
      { command: 'npm install', description: 'Install npm packages' },
      { command: 'npm run dev', description: 'Run development server' },
      { command: 'git status', description: 'Check git status' },
      { command: 'git add .', description: 'Stage all changes' },
      { command: 'git commit -m "message"', description: 'Commit changes' },
      { command: 'git push', description: 'Push to remote' },
      { command: 'python script.py', description: 'Run Python script' },
      { command: 'node app.js', description: 'Run Node.js app' },
    ];
  }
}

// Singleton instance
let commandToolsInstance: CommandTools | null = null;

export function getCommandTools(): CommandTools {
  if (!commandToolsInstance) {
    commandToolsInstance = new CommandTools();
  }
  return commandToolsInstance;
}

export default CommandTools;

