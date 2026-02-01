import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/chat/ThemeToggle';
import NotificationPanel from '@/components/admin/notifications/NotificationPanel';
import { toast } from 'sonner';
import API from '../../../services/axiosInstance';

const AdminHeader = ({ onMenuClick, title, admin }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastTicketIdRef = useRef(null);
  const navigate = useNavigate();

  // Poll for new tickets every 10 seconds
  useEffect(() => {
    const fetchInitialTickets = async () => {
      try {
        const res = await API.get('/tickets');
        const tickets = res.data || [];
        if (tickets.length > 0) {
          // Sort by created_at descending
          const sortedTickets = tickets.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          // Set the most recent ticket ID as the last seen
          lastTicketIdRef.current = sortedTickets[0].id || sortedTickets[0].thread_id;
        }
      } catch (err) {
        console.error('Error fetching initial tickets:', err);
      }
    };

    fetchInitialTickets();

    // Poll for new tickets
    const pollInterval = setInterval(async () => {
      try {
        const res = await API.get('/tickets');
        const tickets = res.data || [];
        if (tickets.length > 0) {
          const sortedTickets = tickets.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          const mostRecentTicket = sortedTickets[0];
          const mostRecentId = mostRecentTicket.id || mostRecentTicket.thread_id;

          // Check if there's a new ticket
          if (lastTicketIdRef.current && mostRecentId !== lastTicketIdRef.current) {
            // Find new tickets
            const newTickets = sortedTickets.filter(
              (ticket) => {
                const ticketId = ticket.id || ticket.thread_id;
                return ticketId !== lastTicketIdRef.current;
              }
            );

            if (newTickets.length > 0) {
              setHasNewTickets(true);
              setUnreadCount(newTickets.length);
              
              // Show toast notification
              toast.success('New Ticket Received', {
                description: `${newTickets.length} new ticket${newTickets.length > 1 ? 's' : ''} received`,
                action: {
                  label: 'View',
                  onClick: () => {
                    setIsNotificationOpen(true);
                    setHasNewTickets(false);
                    setUnreadCount(0);
                  },
                },
              });
            }
          }

          // Update last seen ticket ID
          lastTicketIdRef.current = mostRecentId;
        }
      } catch (err) {
        console.error('Error polling for new tickets:', err);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (hasNewTickets) {
      setHasNewTickets(false);
      setUnreadCount(0);
    }
  };

  const handleTicketClick = (ticket) => {
    if (ticket) {
      // Navigate to tickets page - you might want to add a way to highlight specific ticket
      navigate('/admin/tickets');
    } else {
      // Navigate to tickets page when "View All" is clicked
      navigate('/admin/tickets');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/70 rounded-2xl backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {title && (
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {(hasNewTickets || unreadCount > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {isNotificationOpen && (
            <NotificationPanel
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onTicketClick={handleTicketClick}
            />
          )}
        </div>
        
        <ThemeToggle />
        
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <span className="text-sm font-medium">{admin?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
