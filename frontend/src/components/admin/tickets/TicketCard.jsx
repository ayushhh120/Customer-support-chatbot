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
    if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      onDelete(ticket.id);
    }
  };

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ESCALATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const handleResolve = () => {
    onResolve(ticket.id, remark);
  };

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 space-y-4",
      "transition-all duration-300 hover:shadow-md",
      ticket.status === 'RESOLVED' && "opacity-75"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{ticket.userName || 'Unknown User'}</p>
            <p className="text-sm text-muted-foreground">{ticket.userEmail || 'No email'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {ticket.status === 'RESOLVED' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              title="Delete Ticket"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Badge variant="outline" className={cn("font-medium", statusColors[ticket.status])}>
            {ticket.status}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            {ticket.assignedTo === 'BOT' ? (
              <>
                <Bot className="h-3 w-3" />
                Bot
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                Human
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Query */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          User Query
        </div>
        <p className="text-sm bg-muted/50 rounded-lg p-3">{ticket.query}</p>
      </div>

      {/* LLM Answer - Expandable */}
      <div className="space-y-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bot className="h-4 w-4" />
          AI Response
          <span className="text-xs">({isExpanded ? 'collapse' : 'expand'})</span>
        </button>
        <div className={cn(
          "text-sm bg-primary/5 rounded-lg p-3 transition-all duration-300",
          !isExpanded && "line-clamp-2"
        )}>
          {ticket.llmAnswer}
        </div>
      </div>

      {/* Ticket ID and Date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span>Ticket ID: {ticket.id}</span>
        <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : 'N/A'}</span>
      </div>

      {/* Actions - Only show for non-resolved tickets */}
      {ticket.status !== 'RESOLVED' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <Textarea
            placeholder="Add a remark before resolving..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleResolve}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolve Ticket
          </Button>
        </div>
      )}

      {/* Show remark for resolved tickets */}
      {ticket.status === 'RESOLVED' && ticket.remark && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground">Resolution Remark:</p>
          <p className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg p-3">
            {ticket.remark}
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
