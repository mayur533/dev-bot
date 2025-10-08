import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, X, FileText, Image as ImageIcon, Mic } from "lucide-react";
import "./InputArea.css";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showFooter?: boolean;
}

interface AttachedFile {
  file: File;
  type: 'image' | 'document';
  preview?: string;
}

function InputArea({ onSendMessage, isLoading, showFooter = true }: InputAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    const maxHeight = window.innerHeight * 0.5; // 50vh
    e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + "px";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    // TODO: Include attachedFiles in the message
    onSendMessage(inputValue.trim());
    setInputValue("");
    setAttachedFiles([]); // Clear attachments after sending

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
    setShowModelMenu(false);
  };

  const handleModelClick = () => {
    setShowModelMenu(!showModelMenu);
    setShowAttachmentMenu(false);
  };

  const handleSelectAttachment = (type: string) => {
    setShowAttachmentMenu(false);
    if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'document') {
      documentInputRef.current?.click();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove any existing image and add new one
        const withoutImages = attachedFiles.filter(f => f.type !== 'image');
        setAttachedFiles([...withoutImages, {
          file,
          type: 'image',
          preview: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Remove any existing document and add new one
      const withoutDocuments = attachedFiles.filter(f => f.type !== 'document');
      setAttachedFiles([...withoutDocuments, {
        file,
        type: 'document'
      }]);
    }
    e.target.value = ''; // Reset input
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    setShowModelMenu(false);
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log("Voice recording:", !isRecording);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.control-group')) {
        setShowAttachmentMenu(false);
        setShowModelMenu(false);
      }
    };

    if (showAttachmentMenu || showModelMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAttachmentMenu, showModelMenu]);

  return (
    <footer className="input-area">
      <form onSubmit={handleSendMessage} className="input-form">
        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleDocumentSelect}
          style={{ display: 'none' }}
        />

        <div className="input-container">
          <div className="input-left-controls">
            {/* File Previews - Small inside input above buttons */}
            {attachedFiles.length > 0 && (
              <div className="file-previews-inline">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="file-preview-small">
                    {file.type === 'image' && file.preview ? (
                      <img src={file.preview} alt={file.file.name} className="preview-image-small" />
                    ) : (
                      <div className="preview-document-small">
                        <FileText size={12} />
                      </div>
                    )}
                    <button
                      type="button"
                      className="remove-file-btn-small"
                      onClick={() => handleRemoveFile(index)}
                      title="Remove file"
                    >
                      <X size={8} />
                    </button>
                    {/* Hover Preview */}
                    <div className="file-preview-hover">
                      {file.type === 'image' && file.preview ? (
                        <img src={file.preview} alt={file.file.name} className="preview-image-large" />
                      ) : (
                        <div className="preview-document-large">
                          <FileText size={48} />
                          <span className="file-name-large">{file.file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Controls Row */}
            <div className="bottom-controls">
              {/* Plus Button */}
              <div className="control-group">
                <button
                  type="button"
                  className="control-button"
                  onClick={handleAttachmentClick}
                  title="Add attachment"
                >
                  <Plus size={16} />
                </button>
                {showAttachmentMenu && (
                  <div className="dropdown-menu attachment-menu">
                    <button 
                      type="button"
                      className="dropdown-item" 
                      onClick={() => handleSelectAttachment('image')}
                    >
                      Image
                    </button>
                    <button 
                      type="button"
                      className="dropdown-item" 
                      onClick={() => handleSelectAttachment('document')}
                    >
                      Document
                    </button>
                  </div>
                )}
              </div>

              {/* Model Selector */}
              <div className="control-group">
                <button
                  type="button"
                  className="control-button model-button"
                  onClick={handleModelClick}
                  title="Select model"
                >
                  <span className="model-name">{selectedModel}</span>
                  <ChevronDown size={12} />
                </button>
                {showModelMenu && (
                  <div className="dropdown-menu model-menu">
                    <button 
                      type="button"
                      className="dropdown-item" 
                      onClick={() => handleSelectModel('Gemini')}
                    >
                      Gemini
                    </button>
                    <button 
                      type="button"
                      className="dropdown-item" 
                      onClick={() => handleSelectModel('GPT-4')}
                    >
                      GPT-4
                    </button>
                    <button 
                      type="button"
                      className="dropdown-item" 
                      onClick={() => handleSelectModel('Claude')}
                    >
                      Claude
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="input-textarea"
            rows={1}
            disabled={isLoading}
          />
          
          <button
            type="button"
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={handleMicClick}
            title={isRecording ? "Stop recording" : "Start voice recording"}
          >
            <Mic size={18} />
          </button>

          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              <span className="send-icon">➤</span>
            )}
          </button>
        </div>
      </form>
      {showFooter && (
        <div className="input-footer">
          Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
        </div>
      )}
    </footer>
  );
}

export default InputArea;


