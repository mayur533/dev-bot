import { useState, useCallback, useEffect } from 'react';
import aiPlatformApi from '../services/aiPlatformApi';

interface PendingCommand {
  id: string;
  command: string;
  workingDirectory: string;
  dangerous: boolean;
  reason?: string;
  timestamp: number;
}

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
}

export function useCommands() {
  const [pendingCommands, setPendingCommands] = useState<PendingCommand[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  const requestCommand = useCallback(async (
    command: string,
    workingDirectory?: string
  ): Promise<PendingCommand | null> => {
    try {
      const pending = await aiPlatformApi.requestCommand(command, workingDirectory);
      setPendingCommands(prev => [...prev, pending]);
      return pending;
    } catch (error: any) {
      console.error('Failed to request command:', error);
      return null;
    }
  }, []);

  const executeCommand = useCallback(async (
    commandId: string,
    confirmed: boolean
  ): Promise<CommandResult | null> => {
    setIsExecuting(true);
    
    try {
      const result = await aiPlatformApi.executeCommand(commandId, confirmed);
      setLastResult(result);
      
      // Remove from pending
      setPendingCommands(prev => prev.filter(cmd => cmd.id !== commandId));
      
      return result;
    } catch (error: any) {
      console.error('Failed to execute command:', error);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const loadPendingCommands = useCallback(async () => {
    try {
      const commands = await aiPlatformApi.getPendingCommands();
      setPendingCommands(commands);
    } catch (error: any) {
      console.error('Failed to load pending commands:', error);
    }
  }, []);

  // Load pending commands on mount
  useEffect(() => {
    loadPendingCommands();
  }, [loadPendingCommands]);

  return {
    pendingCommands,
    requestCommand,
    executeCommand,
    isExecuting,
    lastResult,
    loadPendingCommands,
  };
}

