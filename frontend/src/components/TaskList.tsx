import React from 'react';
import { Play, Check, X, Loader2, Code, Database, Layout } from 'lucide-react';
import './TaskList.css';

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

interface TaskListProps {
  tasks: Task[];
  onExecuteTask: (taskId: string) => void;
  isExecuting: boolean;
}

function TaskList({ tasks, onExecuteTask, isExecuting }: TaskListProps) {
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'frontend':
        return <Layout size={16} />;
      case 'backend':
        return <Database size={16} />;
      case 'fullstack':
        return <Code size={16} />;
      default:
        return <Code size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={16} />;
      case 'failed':
        return <X size={16} />;
      case 'in_progress':
        return <Loader2 size={16} className="spinning" />;
      default:
        return null;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <Code size={48} />
        <p>No tasks yet</p>
        <span>Analyze a project to generate tasks</span>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className={`task-card task-status-${task.status}`}>
          <div className="task-header">
            <div className="task-type">
              {getTaskIcon(task.type)}
              <span>{task.type}</span>
            </div>
            <div className={`task-status-badge task-status-${task.status}`}>
              {getStatusIcon(task.status)}
              <span>{task.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="task-content">
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>

            {task.assignedAgent && (
              <div className="task-agent">
                <strong>Agent:</strong> {task.assignedAgent}
              </div>
            )}

            {task.error && (
              <div className="task-error">
                <X size={14} />
                <span>{task.error}</span>
              </div>
            )}
          </div>

          {task.status === 'pending' && (
            <button
              className="task-execute-btn"
              onClick={() => onExecuteTask(task.id)}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Execute Task
                </>
              )}
            </button>
          )}

          {task.status === 'completed' && task.output && (
            <details className="task-output">
              <summary>View Output</summary>
              <pre>{JSON.stringify(task.output, null, 2)}</pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

export default TaskList;

