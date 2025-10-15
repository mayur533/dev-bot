import { useState, useCallback } from 'react';
import aiPlatformApi from '../services/aiPlatformApi';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'analysis';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  output?: any;
  error?: string;
}

interface AnalysisResult {
  analysis: string;
  tasks: Task[];
  architecture: any;
}

export function useAIAgents() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeProject = useCallback(async (
    projectBrief: string,
    sessionId: string,
    projectId?: string
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await aiPlatformApi.analyzeProject(projectBrief, sessionId, projectId);
      setCurrentTasks(result.tasks);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const executeTask = useCallback(async (taskId: string): Promise<any> => {
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await aiPlatformApi.executeTask(taskId);
      
      // Update task status in current tasks
      setCurrentTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed', output: result }
          : task
      ));
      
      return result;
    } catch (err: any) {
      setError(err.message);
      
      // Mark task as failed
      setCurrentTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'failed', error: err.message }
          : task
      ));
      
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const loadTasksForSession = useCallback(async (sessionId: string) => {
    try {
      const tasks = await aiPlatformApi.getTasksBySession(sessionId);
      setCurrentTasks(tasks);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return {
    analyzeProject,
    executeTask,
    loadTasksForSession,
    currentTasks,
    isAnalyzing,
    isExecuting,
    error,
  };
}

