import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Library, Menu, X, BookMarked, User, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  imagePath?: string;
}

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (storedUser && isAuthenticated) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home', isVisible: true },
    { path: '/books', label: 'Books', isVisible: true },
    { path: '/ebooks', label: 'E-Books', isVisible: true },
    { path: '/transactions', label: 'My Transactions', isVisible: isLoggedIn },
    { path: '/reservations', label: 'My Reservations', isVisible: isLoggedIn },
    { path: '/wishlist', label: 'My Wishlist', isVisible: isLoggedIn },
    { path: '/admin', label: 'Admin Dashboard', isVisible: isLoggedIn && user?.role === 'Admin' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white py-4 shadow-lg sticky top-0 z-50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between relative">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold font-['Playfair_Display',serif] tracking-wide">
                  <span className="text-white">Book</span>
                  <span className="text-indigo-300">Hive</span>
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.filter(item => item.isVisible).map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Link
                    to={item.path}
                    className={`relative px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors ${(location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path)))
                        ? 'text-white font-semibold'
                        : 'text-indigo-100'
                      }`}
                  >
                    {item.label}
                    {(location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path))) && (
                        <motion.div
                          layoutId="navigation-underline"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-300 mx-3"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center">
              {loading ? (
                <div className="h-9 w-24 bg-white/20 animate-pulse rounded-md"></div>
              ) : isLoggedIn && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-3 py-2 rounded-full transition-colors cursor-pointer">
                      <Avatar className="h-8 w-8 border-2 border-indigo-300">
                        <AvatarImage src={user.imagePath} />
                        <AvatarFallback className="bg-indigo-600 text-white">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:inline-block">{user.name.split(' ')[0]}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/transactions" className="flex items-center gap-2 cursor-pointer">
                        <Clock className="h-4 w-4" />
                        <span>My Transactions</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/reservations" className="flex items-center gap-2 cursor-pointer">
                        <BookMarked className="h-4 w-4" />
                        <span>My Reservations</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4" />
                        <span>My Wishlist</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'Admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Library className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="space-x-2 flex items-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="text-white hover:text-white/90 hover:bg-indigo-800" asChild>
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-white text-indigo-900 hover:bg-white/90" asChild>
                      <Link to="/register">Sign up</Link>
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white hover:bg-indigo-800"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden mt-4 bg-indigo-800 rounded-lg overflow-hidden"
              >
                <nav className="flex flex-col py-2">
                  {navItems.filter(item => item.isVisible).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-3 hover:bg-indigo-700 transition-colors ${(location.pathname === item.path ||
                          (item.path !== '/' && location.pathname.startsWith(item.path)))
                          ? 'text-white font-semibold bg-indigo-700'
                          : 'text-indigo-100'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="border-t border-indigo-800/50 flex justify-center items-center text-indigo-200 pt-4">
            <p>&copy; {new Date().getFullYear()} BookHive Library Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;