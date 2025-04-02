import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Users, 
  BarChart4, 
  Settings, 
  LogOut,
  FileCheck,
  Clock
} from 'lucide-react';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in and is an admin
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (storedUser && isAuthenticated) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Redirect non-admin users
        if (parsedUser.role?.toLowerCase() !== 'admin') {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login', { replace: true });
      }
    } else {
      // Redirect to login if not logged in
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  // Navigation items with exact paths
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { path: '/admin/books', label: 'Manage Books', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { path: '/admin/ebooks', label: 'Manage E-Books', icon: <FileText className="h-5 w-5 mr-3" /> },
    { path: '/admin/users', label: 'Manage Users', icon: <Users className="h-5 w-5 mr-3" /> },
    { path: '/admin/transactions', label: 'Transactions', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { path: '/admin/reservations', label: 'Reservations', icon: <Clock className="h-5 w-5 mr-3" /> },
    { path: '/admin/reports', label: 'Reports', icon: <BarChart4 className="h-5 w-5 mr-3" /> },
    { path: '/admin/no-due', label: 'No Due', icon: <FileCheck className="h-5 w-5 mr-3" /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - fixed position */}
      <aside className="w-64 bg-indigo-900 text-white h-screen fixed top-0 left-0 overflow-y-auto flex flex-col justify-between z-10">
        <div>
          <div className="mb-8 p-4">
            <h1 className="text-xl font-bold">Library Admin</h1>
            <p className="text-sm text-white/80 mt-1">Management Dashboard</p>
          </div>
          
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center px-4 py-2.5 rounded-md transition-colors ${
                  (location.pathname === item.path || 
                   (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)))
                    ? 'bg-white text-indigo-900 font-medium'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User profile and logout section */}
        <div className="mt-auto p-4">
          <div className="flex items-center mb-2 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-2 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-white/60 truncate">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-white border-opacity-20 hover:bg-white/10 hover:text-white text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </aside>
      
      {/* Main content - with left margin to make space for the fixed sidebar */}
      <main className="flex-1 overflow-y-auto bg-gray-50 ml-64">
        <div className="container mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 