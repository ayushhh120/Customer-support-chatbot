import React from 'react';
import { Ticket, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TicketCreatedBanner = ({ ticketId, onStartNewChat }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground">
                Ticket Created
              </p>
              <p className="text-xs text-muted-foreground">
                Ticket ID: {ticketId || 'Please wait...'}
              </p>
            </div>
          </div>
          <Button
            onClick={onStartNewChat}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Start New Chat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketCreatedBanner;