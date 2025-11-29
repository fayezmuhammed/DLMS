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
  Clock,
  PanelLeftClose,
  Menu
} from 'lucide-react';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in and is an admin
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    // Detect mobile viewport
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    checkIsMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Restore sidebar state from localStorage if available (only on desktop)
    if (!isMobile) {
      const savedSidebarState = localStorage.getItem('adminSidebarOpen');
      if (savedSidebarState !== null) {
        setSidebarOpen(savedSidebarState === 'true');
      }
    }
    
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
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [navigate, isMobile]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    // Save preference to localStorage (only on desktop)
    if (!isMobile) {
      localStorage.setItem('adminSidebarOpen', newState.toString());
    }
  };

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

  // Find current active nav item
  const activeNavItem = navItems.find(item => 
    location.pathname === item.path || 
    (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar - fixed position with transition */}
      <aside 
        className={`bg-indigo-900 text-white h-screen fixed top-0 left-0 overflow-y-auto flex flex-col justify-between transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-16'
        } ${isMobile ? 'z-30' : 'z-10'}`}
      >
        <div>
          {/* Logo section */}
          <div className={`p-4 ${!sidebarOpen && !isMobile ? 'px-2 text-center' : 'mb-8'}`}>
            {sidebarOpen ? (
              <>
                <h1 className="text-xl font-bold">Library Admin</h1>
                <p className="text-sm text-white/80 mt-1">Management Dashboard</p>
              </>
            ) : !isMobile && (
              <div className="flex items-center justify-center py-2">
                <BookOpen className="h-8 w-8" />
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className={`space-y-1 ${sidebarOpen ? 'px-2' : 'px-0'}`}>
            {navItems.map((item) => {
              const isActive = 
                location.pathname === item.path || 
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`flex items-center ${sidebarOpen ? 'px-4 py-2.5 justify-start' : 'p-2 justify-center'} rounded-md transition-colors ${
                    isActive
                      ? 'bg-white text-indigo-900 font-medium'
                      : 'hover:bg-white/10'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div className={sidebarOpen ? '' : 'p-1'}>
                    {React.cloneElement(item.icon as React.ReactElement, { 
                      className: `h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}` 
                    })}
                  </div>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User profile and logout section */}
        {sidebarOpen ? (
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
        ) : !isMobile && (
          <div className="mt-auto p-2 flex flex-col items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white mb-4"
              title={user?.name || 'Admin User'}
            >
              {user?.name?.charAt(0) || 'A'}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>
      
      {/* Main content - with responsive margin based on sidebar state */}
      <main 
        className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        }`}
      >
        {/* Header bar with toggle button */}
        <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 mr-3" 
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            {sidebarOpen ? 
              <PanelLeftClose className="h-5 w-5" /> : 
              <Menu className="h-5 w-5" />
            }
          </Button>
          
          <div className="flex-1">
            {/* Display current page title based on route */}
            <h2 className="text-lg font-medium">
              {activeNavItem?.label || 'Dashboard'}
            </h2>
          </div>
          
          {/* User profile for when sidebar is collapsed - desktop only */}
          {!sidebarOpen && !isMobile && (
            <div className="flex items-center">
              <span className="text-sm mr-2">{user?.name}</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-800">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          )}
        </div>
        
        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile sidebar toggle that appears when sidebar is closed - mobile only */}
      {!sidebarOpen && isMobile && (
        <Button
          variant="default"
          size="sm"
          className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 shadow-lg bg-indigo-900 hover:bg-indigo-800"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default AdminLayout; 