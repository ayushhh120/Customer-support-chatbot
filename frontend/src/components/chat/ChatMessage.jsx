import React from 'react';
import { User, AlertTriangle, Ticket } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} ${
        isUser ? 'animate-slide-in-right' : 'animate-slide-in-left'
      }`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-2 ${
        isUser 
          ? 'bg-secondary' 
          : 'gradient-primary'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-secondary-foreground" />
        ) : (
          <img src="/src/public/images/logo2.jpg" alt="AI Assistant" className="w-full h-full rounded-full object-cover" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col gap-2 max-w-[80%] sm:max-w-[70%] mt-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2 rounded-2xl ${
          isUser 
            ? 'gradient-primary text-primary-foreground rounded-tr-md' 
            : 'bg-secondary text-secondary-foreground rounded-tl-md'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {message.isEscalated && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-escalated/10 border border-escalated/20">
              <AlertTriangle className="w-3 h-3 text-escalated" />
              <span className="text-xs font-medium text-escalated">Escalated to human support</span>
            </div>
          )}
          
          {message.ticketId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Ticket className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Ticket #{message.ticketId}</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
