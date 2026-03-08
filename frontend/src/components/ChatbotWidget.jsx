import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import "./ChatbotWidget.css";

const BACKEND_URL = "http://localhost:8000"; // Assuming backend is on port 8000

function ChatbotWidget({ context = "sandbox" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your ATmega328P Virtual Lab assistant. How can I help you today? (e.g. 'How do I configure Timer1 for PWM?')" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context: context }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to UI
      setMessages((prev) => [
        ...prev, 
        { 
          role: "assistant", 
          content: data.answer,
          sources: data.sources // We can optionally show sources
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: "⚠️ Sorry, I encountered an error connecting to the server. Please ensure the backend is running and the API key is set." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button - shown when chat is completely closed or minimized */}
      {(!isOpen || isMinimized) && (
        <button className="chat-fab" onClick={toggleChat} aria-label="Open Chat">
          <MessageSquare size={24} />
          {isMinimized && <span className="chat-notification-dot"></span>}
        </button>
      )}

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen && !isMinimized ? "open" : "closed"}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={20} />
            <h3>Virtual Lab Assistant</h3>
          </div>
          <div className="chat-actions">
            <button onClick={() => setIsMinimized(true)} aria-label="Minimize">
              <Minimize2 size={18} />
            </button>
            <button onClick={() => setIsOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message-wrapper ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chat-bubble">
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="chat-sources">
                        <small>Sources: {msg.sources.map(s => `p.${s.page}`).join(", ")}</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message-wrapper assistant">
              <div className="chat-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble loading-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about ATmega328P..."
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}

export default ChatbotWidget;
