import { useState } from 'react';
import { User, Bot, MessageSquare, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TicketCard = ({ ticket, onResolve, onDelete }) => {
  const [remark, setRemark] = useState(ticket.remark || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      onDelete(ticket.id);
    }
  };

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ESCALATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-4 space-y-4",
        "overflow-hidden",
        "text-sm sm:text-base",
        ticket.status === 'RESOLVED' && "opacity-80"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {ticket.userName || 'Unknown User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {ticket.userEmail || 'No email'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {ticket.status === 'RESOLVED' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Badge className={cn("text-xs", statusColors[ticket.status])}>
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* User Query */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          User Query
        </div>
        <p className="
          text-xs sm:text-sm
          bg-muted/50 rounded-lg p-3
          break-words whitespace-pre-wrap
        ">
          {ticket.query}
        </p>
      </div>

      {/* AI Response */}
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <Bot className="h-4 w-4" />
          AI Response ({isExpanded ? 'collapse' : 'expand'})
        </button>
        <div
          className={cn(
            "text-xs sm:text-sm bg-primary/5 rounded-lg p-3",
            "break-words whitespace-pre-wrap",
            !isExpanded && "line-clamp-2"
          )}
        >
          {ticket.llmAnswer}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground border-t pt-2">
        <span className="break-all">
          Ticket ID: {ticket.id}
        </span>
        <span>
          {ticket.createdAt
            ? new Date(ticket.createdAt).toLocaleString()
            : 'N/A'}
        </span>
      </div>

      {/* Resolve Section */}
      {ticket.status !== 'RESOLVED' && (
        <div className="space-y-2 border-t pt-2"><Textarea
        placeholder="Add a remark..."
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        className="resize-none text-sm"
        rows={2}
      />
      <Button
        onClick={() => onResolve(ticket.id, remark)}
        className="w-full text-sm"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Resolve Ticket
      </Button>
    </div>
  )}

  {ticket.status === 'RESOLVED' && ticket.remark && (
    <div className="border-t pt-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        Resolution Remark
      </p>
      <p className="
        text-xs sm:text-sm
        bg-green-50 dark:bg-green-900/20
        text-green-700 dark:text-green-400
        rounded-lg p-3 break-words
      ">
        {ticket.remark}
      </p>
    </div>
  )}
</div>
);
};

export default TicketCard;