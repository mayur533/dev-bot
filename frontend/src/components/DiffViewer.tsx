import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import "./DiffViewer.css";

interface DiffLine {
  type: "unchanged" | "added" | "removed" | "modified";
  lineNumber: number;
  content: string;
  originalLineNumber?: number;
}

interface DiffHunk {
  id: string;
  startLine: number;
  endLine: number;
  lines: DiffLine[];
  accepted?: boolean;
  rejected?: boolean;
}

interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  onAcceptChange: (hunkId: string) => void;
  onRejectChange: (hunkId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

function DiffViewer({
  originalContent,
  modifiedContent,
  fileName,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll
}: DiffViewerProps) {
  const [diffHunks, setDiffHunks] = useState<DiffHunk[]>([]);

  useEffect(() => {
    const hunks = computeDiff(originalContent, modifiedContent);
    setDiffHunks(hunks);
  }, [originalContent, modifiedContent]);

  const computeDiff = (original: string, modified: string): DiffHunk[] => {
    const originalLines = original.split("\n");
    const modifiedLines = modified.split("\n");
    const hunks: DiffHunk[] = [];
    
    let currentHunk: DiffLine[] = [];
    let hunkStartLine = 0;
    let lineNumber = 0;
    let originalLineNumber = 0;
    
    const maxLength = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];
      
      if (origLine === modLine) {
        // Lines match - unchanged
        if (currentHunk.length > 0) {
          // Save current hunk
          hunks.push({
            id: `hunk-${hunks.length}`,
            startLine: hunkStartLine,
            endLine: lineNumber,
            lines: [...currentHunk]
          });
          currentHunk = [];
        }
        lineNumber++;
        originalLineNumber++;
      } else {
        // Lines differ
        if (currentHunk.length === 0) {
          hunkStartLine = lineNumber;
        }
        
        if (origLine !== undefined && modLine === undefined) {
          // Line removed
          currentHunk.push({
            type: "removed",
            lineNumber: originalLineNumber,
            content: origLine,
            originalLineNumber: originalLineNumber
          });
          originalLineNumber++;
        } else if (origLine === undefined && modLine !== undefined) {
          // Line added
          currentHunk.push({
            type: "added",
            lineNumber: lineNumber,
            content: modLine
          });
          lineNumber++;
        } else {
          // Line modified (show as removed + added)
          currentHunk.push({
            type: "removed",
            lineNumber: originalLineNumber,
            content: origLine,
            originalLineNumber: originalLineNumber
          });
          currentHunk.push({
            type: "added",
            lineNumber: lineNumber,
            content: modLine
          });
          originalLineNumber++;
          lineNumber++;
        }
      }
    }
    
    // Save last hunk if exists
    if (currentHunk.length > 0) {
      hunks.push({
        id: `hunk-${hunks.length}`,
        startLine: hunkStartLine,
        endLine: lineNumber,
        lines: [...currentHunk]
      });
    }
    
    return hunks;
  };

  const handleAccept = (hunkId: string) => {
    setDiffHunks(prevHunks =>
      prevHunks.map(hunk =>
        hunk.id === hunkId ? { ...hunk, accepted: true, rejected: false } : hunk
      )
    );
    onAcceptChange(hunkId);
  };

  const handleReject = (hunkId: string) => {
    setDiffHunks(prevHunks =>
      prevHunks.map(hunk =>
        hunk.id === hunkId ? { ...hunk, rejected: true, accepted: false } : hunk
      )
    );
    onRejectChange(hunkId);
  };

  const pendingChanges = diffHunks.filter(h => !h.accepted && !h.rejected).length;

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div className="diff-file-info">
          <span className="diff-file-name">{fileName}</span>
          <span className="diff-stats">
            {diffHunks.length} change{diffHunks.length !== 1 ? 's' : ''} 
            {pendingChanges > 0 && ` (${pendingChanges} pending)`}
          </span>
        </div>
        <div className="diff-actions">
          <button
            className="diff-action-btn accept-all"
            onClick={onAcceptAll}
            disabled={pendingChanges === 0}
            title="Accept all changes"
          >
            <Check size={16} />
            Accept All
          </button>
          <button
            className="diff-action-btn reject-all"
            onClick={onRejectAll}
            disabled={pendingChanges === 0}
            title="Reject all changes"
          >
            <X size={16} />
            Reject All
          </button>
        </div>
      </div>

      <div className="diff-content">
        {diffHunks.length === 0 ? (
          <div className="diff-empty">
            <p>No changes detected</p>
          </div>
        ) : (
          diffHunks.map((hunk) => (
            <div
              key={hunk.id}
              className={`diff-hunk ${hunk.accepted ? 'accepted' : ''} ${hunk.rejected ? 'rejected' : ''}`}
            >
              <div className="diff-hunk-header">
                <span className="diff-hunk-info">
                  Lines {hunk.startLine + 1}-{hunk.endLine + 1}
                </span>
                {!hunk.accepted && !hunk.rejected && (
                  <div className="diff-hunk-actions">
                    <button
                      className="diff-hunk-btn accept"
                      onClick={() => handleAccept(hunk.id)}
                      title="Accept change"
                    >
                      <Check size={14} />
                      Accept
                    </button>
                    <button
                      className="diff-hunk-btn reject"
                      onClick={() => handleReject(hunk.id)}
                      title="Reject change"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                )}
                {hunk.accepted && (
                  <span className="diff-status accepted">✓ Accepted</span>
                )}
                {hunk.rejected && (
                  <span className="diff-status rejected">✕ Rejected</span>
                )}
              </div>
              <div className="diff-lines">
                {hunk.lines.map((line, idx) => (
                  <div key={idx} className={`diff-line ${line.type}`}>
                    <span className="diff-line-marker">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    <span className="diff-line-number">
                      {line.type === "removed" ? line.originalLineNumber! + 1 : line.lineNumber + 1}
                    </span>
                    <span className="diff-line-content">{line.content || " "}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DiffViewer;

