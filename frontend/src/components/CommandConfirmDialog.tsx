import React from 'react';
import { AlertTriangle, Terminal, X } from 'lucide-react';
import './CommandConfirmDialog.css';

interface PendingCommand {
  id: string;
  command: string;
  workingDirectory: string;
  dangerous: boolean;
  reason?: string;
  timestamp: number;
}

interface CommandConfirmDialogProps {
  command: PendingCommand;
  onConfirm: () => void;
  onCancel: () => void;
}

function CommandConfirmDialog({ command, onConfirm, onCancel }: CommandConfirmDialogProps) {
  return (
    <div className="command-dialog-overlay">
      <div className="command-dialog">
        <div className="command-dialog-header">
          <div className="command-dialog-title">
            <Terminal size={20} />
            <span>Command Confirmation Required</span>
          </div>
          <button className="command-dialog-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="command-dialog-content">
          {command.dangerous && (
            <div className="command-warning">
              <AlertTriangle size={24} />
              <div className="command-warning-text">
                <strong>Potentially Dangerous Command</strong>
                <p>{command.reason}</p>
              </div>
            </div>
          )}

          <div className="command-details">
            <div className="command-detail-row">
              <span className="command-detail-label">Command:</span>
              <code className="command-detail-value">{command.command}</code>
            </div>
            <div className="command-detail-row">
              <span className="command-detail-label">Working Directory:</span>
              <code className="command-detail-value">{command.workingDirectory}</code>
            </div>
            <div className="command-detail-row">
              <span className="command-detail-label">Status:</span>
              <span className={`command-status ${command.dangerous ? 'dangerous' : 'safe'}`}>
                {command.dangerous ? '⚠️ Dangerous' : '✓ Safe'}
              </span>
            </div>
          </div>

          <div className="command-question">
            <p>Do you want to execute this command?</p>
          </div>
        </div>

        <div className="command-dialog-actions">
          <button className="command-btn command-btn-cancel" onClick={onCancel}>
            <X size={16} />
            Cancel
          </button>
          <button className="command-btn command-btn-execute" onClick={onConfirm}>
            <Terminal size={16} />
            Execute Command
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommandConfirmDialog;

