import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import sendChatMessage from '../../services/chatApi';
import TicketCreatedBanner from './TicketCreatedBanner';


const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const messagesEndRef = useRef(null);
  const [threadId, setThreadId] = useState(null);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [createdTicketID, setCreatedTicketID] = useState(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);


  const handleSend = async (content) => {
    if (ticketCreated) return;
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
   
      setThreadId((res.thread_id))

      const assistantMessage = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
        isEscalated: res.escalated,
        ticketId: res.ticket_id,
      }

      setMessages(prev => [...prev, assistantMessage]);
      // If backend created a ticket, lock the input and show the "ticket created" banner.
      // Avoid matching on exact answer text (it can change slightly).
      if (res.escalated || res.ticket_id) {
        setTicketCreated(true);
        setCreatedTicketID(res.ticket_id);
      }
      
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

  const handleStartNewChat = () => {
    setMessages([]);
    setTicketCreated(false);
    setCreatedTicketID(null);
    setThreadId(null);
    setError(false);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onBack={() => window.history.back()} />
      
      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onSuggestionClick={handleSend} disabled={isLoading} />
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
      {ticketCreated ? (
       <TicketCreatedBanner 
       ticketId={createdTicketID} 
       onStartNewChat={handleStartNewChat} 
      />
    ) : (
    <ChatInput 
    onSend={handleSend} 
    isLoading={isLoading} 
    disabled={ticketCreated} 
    />
)}
    </div>
  );
};

export default ChatContainer;
