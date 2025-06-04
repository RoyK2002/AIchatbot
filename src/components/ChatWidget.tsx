import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Maximize2, Send, AlertCircle, Key, Trash } from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { useChatStore } from '../store/chatStore';
import { getChatResponse } from '../lib/openai';

const ChatWidget: React.FC = () => {
  const {
    messages,
    isOpen,
    isMinimized,
    isLoading,
    toggleOpen,
    toggleMinimize,
    addMessage,
    setLoading,
    clearMessages,
  } = useChatStore();
  
  const [apiConfigured, setApiConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageContent = (content: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const sanitizedContent = DOMPurify.sanitize(content);
    const formattedContent = sanitizedContent.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-words">${url}</a>`;
    });
    
    return { __html: formattedContent };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current?.value.trim()) return;

    const userMessage = inputRef.current.value;
    addMessage(userMessage, 'user');
    inputRef.current.value = '';
    setError(null);
    
    setLoading(true);
    try {
      const response = await getChatResponse(userMessage);
      addMessage(response, 'assistant');
      setApiConfigured(true); // Reset API configured state on successful response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (error instanceof Error && (
        error.message.includes('API key') || 
        error.message.includes('401') ||
        error.message.includes('configuration')
      )) {
        setApiConfigured(false);
      }
      
      setError(errorMessage);
      addMessage(errorMessage, 'assistant', true);
    } finally {
      setLoading(false);
    }
  };

  const ApiKeyError = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 space-y-3">
      <Key className="w-12 h-12" />
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">API Key Required</h3>
        <p className="text-sm">
          Please add a valid OpenAI API key to your .env file:
        </p>
        <code className="block mt-2 p-2 bg-red-100 rounded text-xs font-mono">
          VITE_OPENAI_API_KEY=sk-...
        </code>
        <p className="text-sm mt-2">
          Get your API key from{' '}
          <a 
            href="https://platform.openai.com/account/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-red-700"
          >
            OpenAI's dashboard
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-xl w-[380px] max-w-full"
          >
            <div className="p-4 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} />
                <span className="font-semibold">Chat Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="p-1 hover:bg-red-600 rounded"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <Trash size={16} />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-blue-700 rounded"
                  aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={toggleOpen}
                  className="p-1 hover:bg-blue-700 rounded"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {showClearConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-6 w-80 flex flex-col items-center">
                  <Trash className="text-red-600 mb-2" size={32} />
                  <div className="font-semibold mb-2 text-center">Clear all chat messages?</div>
                  <div className="text-sm text-gray-600 mb-4 text-center">
                    This action cannot be undone.
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                      onClick={() => {
                        clearMessages();
                        setShowClearConfirm(false);
                      }}
                    >
                      Yes, Clear
                    </button>
                    <button
                      className="bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {!apiConfigured && messages.length === 0 && <ApiKeyError />}
                    {apiConfigured && messages.length === 0 && (
                      <div className="text-center text-gray-500">
                        <p>👋 Hello! How can I help you today?</p>
                      </div>
                    )}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${
                          message.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.error
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.error && (
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle size={16} />
                              <span className="font-semibold">Error</span>
                            </div>
                          )}
                          {message.role === 'user' ? (
                            <span>{message.content}</span>
                          ) : (
                            <div 
                              dangerouslySetInnerHTML={formatMessageContent(message.content)}
                              className="break-words"
                            />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {format(message.timestamp, 'HH:mm')}
                        </span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-bounce">●</div>
                        <div className="animate-bounce delay-100">●</div>
                        <div className="animate-bounce delay-200">●</div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSubmit} className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        aria-label="Message input"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                        disabled={isLoading}
                      >
                        <Send size={20} />
                      </button>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;