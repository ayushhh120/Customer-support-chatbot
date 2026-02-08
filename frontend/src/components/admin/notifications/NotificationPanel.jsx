import { useState, useEffect, useRef } from 'react';
import { X, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import API from '../../../services/axiosInstance';

const NotificationPanel = ({ isOpen, onClose, onTicketClick }) => {
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) fetchRecentTickets();
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchRecentTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tickets');
      const tickets = Array.isArray(res.data) ? res.data : [];

      const sorted = tickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setRecentTickets(sorted);
    } catch (err) {
      console.error('Error fetching recent tickets:', err);
      setRecentTickets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "z-50 bg-card border border-border rounded-lg shadow-lg",
        "max-h-[70vh] overflow-hidden",
    
        // 📱 MOBILE: viewport based center
        "fixed top-16 left-1/2 -translate-x-1/2",
        "w-[86vw] max-w-sm mt-1",
    
        // 💻 DESKTOP: bell aligned dropdown
        "sm:absolute sm:top-full sm:left-auto sm:right-0 sm:translate-x-0 sm:mt-4 sm:w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Recent Tickets</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            Loading tickets...
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No tickets yet
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
                  onClick={() => {
                    onTicketClick?.(ticket);
                    onClose();
                  }}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-2 shrink-0",
                        ticket.status === 'RESOLVED'
                          ? "bg-green-500"
                          : "bg-blue-500"
                      )}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground break-all sm:truncate">
                          Ticket #{ticket.id || ticket.thread_id} </p>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full shrink-0",
                            ticket.status === 'RESOLVED'
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                          )}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ticket.user_query || ticket.summary || ''}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;