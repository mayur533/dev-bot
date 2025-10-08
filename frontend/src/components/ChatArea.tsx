import { useRef, useEffect, useState } from "react";
import { Message } from "../types";
import MessageBlock from "./MessageBlock";
import "./ChatArea.css";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!chatAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll);
      return () => chatArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <main className="chat-area" ref={chatAreaRef}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h2>Start a Conversation</h2>
          <p>Send a message to begin chatting with the AI</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Commands</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💻</span>
              <span>Code Blocks</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Fast Streaming</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((message) => (
            <MessageBlock key={message.id} message={message} />
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
        </div>
      )}
      {isUserScrolling && (
        <button 
          className="scroll-to-bottom-btn"
          onClick={scrollToBottom}
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </main>
  );
}

export default ChatArea;


