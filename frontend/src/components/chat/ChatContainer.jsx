import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import sendChatMessage from '../../services/chatApi';


const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const messagesEndRef = useRef(null);
  const [threadId, setThreadId] = useState(null)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);


  const handleSend = async (content) => {
    setError(false);
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {

      const res = await sendChatMessage({
        query: content,
        thread_id: threadId,
      });
      // save thread_id for continues chat
      setThreadId((res.thread_id))

      const assistantMessage = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
        isEscalated: res.escalated,
        ticketID: res.ticket_id,
      }

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(false);
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        handleSend(lastUserMessage.content);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
      
      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              {error && <ErrorState onRetry={handleRetry} />}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
