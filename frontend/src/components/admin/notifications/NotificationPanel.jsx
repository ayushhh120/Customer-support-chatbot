import { useState, useEffect, useRef } from 'react';
import { X, Ticket, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import API from '../../../services/axiosInstance';

const NotificationPanel = ({ isOpen, onClose, onTicketClick }) => {
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecentTickets();
    }
  }, [isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchRecentTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tickets');
      const tickets = res.data || [];
      // Sort by created_at descending and take first 5
      const sortedTickets = tickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentTickets(sortedTickets);
    } catch (err) {
      console.error('Error fetching recent tickets:', err);
      setRecentTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticket) => {
    if (onTicketClick) {
      onTicketClick(ticket);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Recent Tickets</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[500px]">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading tickets...
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tickets yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTickets.map((ticket) => {
              const timeAgo = ticket.createdAt
                ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
                : '';

              return (
                <button
                  key={ticket.id || ticket.thread_id}
                  onClick={() => handleTicketClick(ticket)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      ticket.status === 'RESOLVED' 
                        ? "bg-green-500" 
                        : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          Ticket #{ticket.id || ticket.thread_id}
                        </p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          ticket.status === 'RESOLVED'
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {ticket.query || 'No query'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {recentTickets.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              if (onTicketClick) {
                onTicketClick(null); // Navigate to tickets page
              }
              onClose();
            }}
          >
            View All Tickets
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

