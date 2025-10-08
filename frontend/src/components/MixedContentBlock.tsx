import { Zap, Code, Copy } from "lucide-react";
import "./MixedContentBlock.css";

interface ContentPart {
  type: "text" | "command" | "code";
  content: string;
  language?: string;
}

interface MixedContentBlockProps {
  parts: ContentPart[];
  isStreaming?: boolean;
}

function MixedContentBlock({ parts, isStreaming }: MixedContentBlockProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mixed-content">
      {parts.map((part, index) => (
        <div key={index} className={`content-part ${part.type}`}>
          {part.type === "text" ? (
            <div className="text-content">
              {part.content}
              {isStreaming && index === parts.length - 1 && (
                <span className="cursor">▋</span>
              )}
            </div>
          ) : part.type === "command" ? (
            <div className="command-block">
              <div className="block-header">
                <Zap size={16} className="block-icon" />
                <span className="block-label">Command</span>
                <button className="copy-btn" onClick={() => copyToClipboard(part.content)}>
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <pre className="command-content">
                <code>{part.content}</code>
              </pre>
            </div>
          ) : (
            <div className="code-block">
              <div className="block-header">
                <Code size={16} className="block-icon" />
                <span className="block-label">{part.language || "Code"}</span>
                <button className="copy-btn" onClick={() => copyToClipboard(part.content)}>
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <pre className="code-content">
                <code className={`language-${part.language || "text"}`}>
                  {part.content}
                </code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MixedContentBlock;

