import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader'
import API from '../../../services/axiosInstance';


const AdminLayout = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await API.get('/admin/me');
        setAdmin(res.data);
      } catch (err) {
        console.error('Failed to fetch admin in layout:', err);
      }
    };
    fetchAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        admin={admin}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          title={title}
          admin={admin}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
