import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Ticket, 
  FileUp, 
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import API, { TOKEN_KEY } from '../../../services/axiosInstance';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { path: '/admin/documents', label: 'Documents', icon: FileUp },
];

const AdminSidebar = ({ isOpen, onClose, admin }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post('/admin/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static",
          "flex flex-col ",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 ">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
              <img 
                src="/src/public/logo2.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent",
                  isActive 
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-2 border-primary" 
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          {/* Admin info */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {admin?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{admin?.email || ''}</p>
            </div>
          </div>
          
          {/* Logout button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
