import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TicketCard from "@/components/admin/tickets/TicketCard";
import { cn } from "@/lib/utils";
import API from "../../services/axiosInstance";

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // =========================
  // FETCH ALL TICKETS (ADMIN)
  // =========================
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tickets");
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // =========================
  // RESOLVE TICKET (ADMIN)
  // =========================
  const handleResolve = async (ticketId, adminRemarks) => {
    try {
      await API.post("/tickets/resolve", {
        ticket_id: ticketId,
        admin_remarks: adminRemarks,
      });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: "RESOLVED",
                remark: adminRemarks,
              }
            : ticket
        )
      );

      toast({
        title: "Ticket Resolved",
        description: `Ticket ${ticketId} marked as resolved.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to resolve ticket",
        variant: "destructive",
      });
    }
  };

  // =========================
  // DELETE TICKET (ADMIN)
  // =========================
  const handleDelete = async (ticketId) => {
    try {
      await API.delete(`/tickets/${ticketId}`);

      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));

      toast({
        title: "Ticket Deleted",
        description: "Ticket has been permanently deleted.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    }
  };

  // =========================
  // FILTER LOGIC (REAL)
  // =========================
  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "open") return ticket.status !== "RESOLVED";
    if (filter === "resolved") return ticket.status === "RESOLVED";
    return true;
  });

  const filterButtons = [
    { value: "all", label: "All", count: tickets.length },
    {
      value: "open",
      label: "Open",
      count: tickets.filter((t) => t.status !== "RESOLVED").length,
    },
    {
      value: "resolved",
      label: "Resolved",
      count: tickets.filter((t) => t.status === "RESOLVED").length,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
          <p className="text-muted-foreground">
            Manage customer support tickets
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Filter className="h-4 w-4 text-muted-foreground ml-2" />
          {filterButtons.map(({ value, label, count }) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(value)}
              className={cn(
                "transition-all",
                filter === value
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              {label}
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({count})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <p className="text-muted-foreground">Loading tickets...</p>
) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTickets.map((ticket, index) => (
            <TicketCard
              key={ticket.id || ticket.thread_id || `ticket-${index}`}
              ticket={ticket}
              onResolve={handleResolve}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {filteredTickets.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tickets found.</p>
        </div>
      )}
    </div>
  );
};

export default Tickets;
