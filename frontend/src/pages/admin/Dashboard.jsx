import { Ticket, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import StatCard from '@/components/admin/dashboard/StatCard';
import { useEffect, useState } from 'react';
import API from '../../services/axiosInstance'
import { formatDistanceToNow } from 'date-fns'

const Dashboard = () => {
  const [count, setCount] = useState(0)
  const [openTickets, setOpenTickets] = useState(0)
  const [resolvedTickets, setResolvedTickets] = useState(0)
  const [uploadedDocuments, setUploadedDocuments] = useState(0)
  const [trends, setTrends] = useState({
    total: { value: 0, isPositive: true },
    open: { value: 0, isPositive: true },
    resolved: { value: 0, isPositive: true },
    documents: { value: 0, isPositive: true }
  })
  const [activity, setActivity] = useState([])

  
useEffect(() => {
  const fetchTicketStats = async () => {
try {
      const res = await API.get('/tickets/stats')
      setCount(res.data.total)
      setOpenTickets(res.data.open)
      setResolvedTickets(res.data.resolved)
      setUploadedDocuments(res.data.documents || 0)
      if (res.data.trends) {
        setTrends(res.data.trends)
      }
} catch (err) {
  console.error("Error", err || "Error While Fetching Tickets");  
}   
}
  fetchTicketStats()
}, [])

useEffect(() => {
  const fetchRecentActivity = async () => {
    try {
      const res = await API.get('/admin/activity?limit=10')
      setActivity(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("Error", err || "Error While Fetching Recent Activity");
      setActivity([])
    }
  }

  fetchRecentActivity()
}, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="rounded-xl p-6 text-white shadow-lg shadow-cyan-400/25"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 212, 255, 1) 0%, rgba(9, 72, 121, 1) 50%, rgba(2, 0, 36, 1) 100%)'
        }}
      >
        <h2 className="text-2xl font-bold mb-1">Resolvify</h2>
        <p className="text-white/90 text-sm">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={count}
          icon={Ticket}
          trend={trends.total}
        />
        <StatCard
          title="Open Tickets"
          value={openTickets}
          icon={AlertCircle}
          trend={trends.open}
        />
        <StatCard
          title="Resolved Tickets"
          value={resolvedTickets}
          icon={CheckCircle}
          trend={trends.resolved}
        />
        <StatCard
          title="Uploaded Documents"
          value={uploadedDocuments}
          icon={FileText}
          trend={trends.documents}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {(activity.length ? activity : []).map((activityItem, index) => {
            const d = activityItem?.timestamp ? new Date(activityItem.timestamp) : null
            const time = d && !Number.isNaN(d.getTime())
              ? formatDistanceToNow(d, { addSuffix: true })
              : ''

            const type = activityItem?.type || 'default'

            return (
            <div 
              key={index}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 
             p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors 
             overflow-hidden"
            >
              <div className={`w-2 h-2 rounded-full ${
                type === 'success' ? 'bg-green-500' :
                type === 'warning' ? 'bg-yellow-500' :
                type === 'info' ? 'bg-blue-500' :
                'bg-gray-400'
              }`} />
              <span className="flex-1 text-sm break-words min-w-0">
  {activityItem?.action || ''}</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
