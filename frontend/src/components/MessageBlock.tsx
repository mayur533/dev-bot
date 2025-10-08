import { Message } from "../types";
import MixedContentBlock from "./MixedContentBlock";
import { Edit3, Copy, Zap, Code, Share2, ThumbsUp, ThumbsDown, RotateCw, Check } from "lucide-react";
import "./MessageBlock.css";
import { useState, useRef, useEffect } from "react";

interface MessageBlockProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onRetry?: (messageId: string) => void;
}

function MessageBlock({ message, onEdit, onRetry }: MessageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || "");
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const minHeight = 120; // 4 lines minimum
    const maxHeight = 304; // 10 lines maximum
    textarea.style.height = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight)) + "px";
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const minHeight = 120;
      const maxHeight = 304;
      textarea.style.height = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight)) + "px";
      textarea.focus();
    }
  }, [isEditing]);
  const renderContent = () => {
    switch (message.type) {
      case "mixed":
        return (
          <MixedContentBlock 
            parts={message.parts || []} 
            isStreaming={message.isStreaming}
          />
        );

      case "command":
        return (
          <div className="command-block">
            <div className="block-header">
              <Zap size={16} className="block-icon" />
              <span className="block-label">Command</span>
              <button className="copy-btn" onClick={() => copyCodeToClipboard(message.content)}>
                <Copy size={14} />
                Copy
              </button>
            </div>
            <pre className="command-content">
              <code>{message.content}</code>
            </pre>
          </div>
        );

      case "code":
        return (
          <div className="code-block">
            <div className="block-header">
              <Code size={16} className="block-icon" />
              <span className="block-label">{message.language || "Code"}</span>
              <button className="copy-btn" onClick={() => copyCodeToClipboard(message.content)}>
                <Copy size={14} />
                Copy
              </button>
            </div>
            <pre className="code-content">
              <code className={`language-${message.language || "text"}`}>
                {message.content}
              </code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="text-content">
            {message.content}
            {message.isStreaming && <span className="cursor">▋</span>}
          </div>
        );
    }
  };

  const getMessageText = () => {
    if (message.type === "mixed" && message.parts) {
      return message.parts
        .map(part => part.content)
        .join("\n\n");
    }
    return message.content || "";
  };

  const handleCopy = async () => {
    try {
      const textToCopy = message.role === "assistant" ? getMessageText() : (message.content || "");
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = () => {
    console.log("Share message");
  };

  const handleGoodResponse = () => {
    console.log("Good response");
  };

  const handleBadResponse = () => {
    console.log("Bad response");
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry(message.id);
    }
  };

  const copyCodeToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content || "");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content || "");
  };

  const handleSend = () => {
    if (editedContent.trim() && onEdit) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={`message ${message.role}`}>
      {message.role === "assistant" && (
        <>
          <div className="message-label">AI Assistant</div>
          <div className="message-content">
            {renderContent()}
          </div>
          {!message.isStreaming && (
            <div className="assistant-actions">
              <button 
                className={`action-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopy} 
                title={isCopied ? "Copied!" : "Copy"}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button className="action-btn" onClick={handleShare} title="Share">
                <Share2 size={14} />
              </button>
              <button className="action-btn" onClick={handleGoodResponse} title="Good response">
                <ThumbsUp size={14} />
              </button>
              <button className="action-btn" onClick={handleBadResponse} title="Bad response">
                <ThumbsDown size={14} />
              </button>
              <button className="action-btn" onClick={handleRetry} title="Retry">
                <RotateCw size={14} />
              </button>
            </div>
          )}
        </>
      )}
      {message.role === "user" && isEditing ? (
        <div className="edit-wrapper">
          <textarea
            ref={textareaRef}
            className="edit-textarea"
            value={editedContent}
            onChange={handleTextareaChange}
            autoFocus
          />
          <div className="edit-actions">
            <button className="edit-btn-text cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="edit-btn-text send-btn" 
              onClick={handleSend}
              disabled={editedContent.trim() === (message.content || "").trim()}
            >
              Send
            </button>
          </div>
        </div>
      ) : message.role === "user" ? (
        <>
          <div className="message-content">
            {renderContent()}
          </div>
          <div className="message-actions">
            <button className="action-btn edit-btn" onClick={handleEdit} title="Edit">
              <Edit3 size={14} />
            </button>
            <button 
              className={`action-btn copy-btn-user ${isCopied ? 'copied' : ''}`}
              onClick={handleCopy} 
              title={isCopied ? "Copied!" : "Copy"}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default MessageBlock;

