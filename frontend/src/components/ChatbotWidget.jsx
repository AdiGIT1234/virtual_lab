import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import "./ChatbotWidget.css";
import { API_BASE_URL } from "../lib/api";

const BACKEND_URL = API_BASE_URL;

function ChatbotWidget({ context = "sandbox" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Embedex assistant. How can I help you today? (e.g. 'How do I configure Timer1 for PWM?' or 'How do I use ESP32 Wi-Fi?')" },
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

    const MAX_RETRIES = 3;
    let lastError = null;
    let isColdStart = false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage, context: context }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // 503 = Render cold start (service waking up) — wait and retry
        if (response.status === 503) {
          isColdStart = true;
          throw new Error("cold_start");
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, sources: data.sources },
        ]);
        break;
      } catch (error) {
        lastError = error;
        console.error(`Chat attempt ${attempt + 1} failed:`, error);
        if (attempt < MAX_RETRIES) {
          const wait = isColdStart ? 8000 : 3000;
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
      }
    }

    if (lastError) {
      const isTimeout = lastError.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isTimeout || isColdStart
            ? "⏳ The server is waking up from sleep. Please send your message again in a few seconds."
            : "⚠️ Could not reach the server. Please check your connection and try again.",
        },
      ]);
    }
    setIsLoading(false);
  };

  return (
    <>
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
