import { useRef, useEffect } from "react";
import { Message } from "../types";
import MessageBlock from "./MessageBlock";
import InputArea from "./InputArea";
import "./ChatSidebar.css";

interface ChatSidebarProps {
  messages: Message[];
  isLoading: boolean;
  width: number;
  onSendMessage: (message: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRetryMessage: (messageId: string) => void;
  onResize: (width: number) => void;
}

function ChatSidebar({ 
  messages, 
  isLoading, 
  width, 
  onSendMessage, 
  onEditMessage, 
  onRetryMessage,
  onResize 
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 600) {
          onResize(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  return (
    <div className="chat-sidebar" style={{ width: `${width}px` }}>
      <div
        className="resize-handle-left"
        onMouseDown={handleMouseDown}
      />
      
      <div className="sidebar-header">
        <span className="sidebar-title">AI Assistant</span>
      </div>

      <div className="sidebar-messages">
        {messages.length === 0 ? (
          <div className="sidebar-empty">
            <div className="empty-icon">💬</div>
            <p>Ask AI about your code</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBlock 
                key={message.id} 
                message={message} 
                onEdit={onEditMessage}
                onRetry={onRetryMessage}
              />
            ))}
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="sidebar-input">
        <InputArea 
          onSendMessage={onSendMessage} 
          isLoading={isLoading}
          showFooter={false}
        />
      </div>
    </div>
  );
}

export default ChatSidebar;

