import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../../services/axiosInstance';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get('/admin/me');
        setAuthorized(true);
      } catch {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
