import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Maximize2, Send, AlertCircle, Key, Trash } from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { useChatStore } from '../store/chatStore.ts';
import { getChatResponse } from '../lib/openai.ts';

const ChatWidget = () => {
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
  const [error, setError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageContent = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const sanitizedContent = DOMPurify.sanitize(content);
    const formattedContent = sanitizedContent.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-words">${url}</a>`;
    });
    return { __html: formattedContent };
  };

  const handleSubmit = async (e) => {
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
      setApiConfigured(true);
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
            {!isMinimized && (
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-gray-400 text-center mt-10">How can I help you today?</div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] break-words shadow text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white self-end'
                            : msg.error
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-white text-gray-800'
                        }`}
                        dangerouslySetInnerHTML={formatMessageContent(msg.content)}
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {error && (
                  <div className="p-2 bg-red-100 text-red-700 text-xs flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                {!apiConfigured && <ApiKeyError />}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center p-2 border-t bg-white"
                  autoComplete="off"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400 text-sm"
                    placeholder="Type your message..."
                    disabled={isLoading || !apiConfigured}
                  />
                  <button
                    type="submit"
                    className="ml-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading || !apiConfigured}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
                >
                  <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                    <p className="mb-4 text-gray-700">Clear all chat messages?</p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          clearMessages();
                          setShowClearConfirm(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
