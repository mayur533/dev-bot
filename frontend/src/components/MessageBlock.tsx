import { Message } from "../types";
import MixedContentBlock from "./MixedContentBlock";
import { Edit3, Copy, Zap, Code } from "lucide-react";
import "./MessageBlock.css";

interface MessageBlockProps {
  message: Message;
}

function MessageBlock({ message }: MessageBlockProps) {
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
              <button className="copy-btn" onClick={() => copyToClipboard(message.content)}>
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
              <button className="copy-btn" onClick={() => copyToClipboard(message.content)}>
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  return (
    <div className={`message ${message.role}`}>
      {message.role === "assistant" && (
        <div className="message-label">AI Assistant</div>
      )}
      <div className="message-content">
        {renderContent()}
      </div>
      {message.role === "user" && (
        <div className="message-actions">
          <button className="action-btn edit-btn" onClick={() => console.log("Edit:", message.content)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button className="action-btn copy-btn-user" onClick={() => copyToClipboard(message.content)} title="Copy">
            <Copy size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageBlock;

