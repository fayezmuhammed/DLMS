import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, BookOpen, Library, Menu, X, BookMarked, User, LogOut, Heart } from 'lucide-react';
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
                    className={`relative px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors ${
                      (location.pathname === item.path || 
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
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-3 py-2 rounded-full transition-colors"
                    >
                      <Avatar className="h-8 w-8 border-2 border-indigo-300">
                        <AvatarImage src={user.imagePath} />
                        <AvatarFallback className="bg-indigo-600 text-white">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:inline-block">{user.name.split(' ')[0]}</span>
                    </motion.button>
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
                      className={`px-4 py-3 hover:bg-indigo-700 transition-colors ${
                        (location.pathname === item.path || 
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
        <div className="container mx-auto px-4 py-12">
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold font-['Playfair_Display',serif] tracking-wide">
                  <span className="text-white">Book</span>
                  <span className="text-indigo-300">Hive</span>
                </span>
              </Link>
              <p className="text-indigo-100 text-sm max-w-xs">
                A comprehensive solution for managing library resources, books, and user transactions.
              </p>
              <div className="flex space-x-4 pt-2">
                <motion.a href="#" className="bg-indigo-800 p-2 rounded-full text-white hover:bg-indigo-700 transition-colors" whileHover={{ y: -3 }}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </motion.a>
                <motion.a href="#" className="bg-indigo-800 p-2 rounded-full text-white hover:bg-indigo-700 transition-colors" whileHover={{ y: -3 }}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </motion.a>
                <motion.a href="#" className="bg-indigo-800 p-2 rounded-full text-white hover:bg-indigo-700 transition-colors" whileHover={{ y: -3 }}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </motion.a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display',serif]">Quick Links</h3>
              <ul className="space-y-3">
                <motion.li whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Link to="/" className="text-indigo-100 hover:text-white transition-colors flex items-center gap-2">
                    <span className="h-1 w-1 bg-indigo-300 rounded-full"></span>
                    Home
                  </Link>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Link to="/books" className="text-indigo-100 hover:text-white transition-colors flex items-center gap-2">
                    <span className="h-1 w-1 bg-indigo-300 rounded-full"></span>
                    Books
                  </Link>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Link to="/ebooks" className="text-indigo-100 hover:text-white transition-colors flex items-center gap-2">
                    <span className="h-1 w-1 bg-indigo-300 rounded-full"></span>
                    E-Books
                  </Link>
                </motion.li>
                {isLoggedIn && (
                  <>
                    <motion.li whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <Link to="/transactions" className="text-indigo-100 hover:text-white transition-colors flex items-center gap-2">
                        <span className="h-1 w-1 bg-indigo-300 rounded-full"></span>
                        My Transactions
                      </Link>
                    </motion.li>
                    <motion.li whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <Link to="/wishlist" className="text-indigo-100 hover:text-white transition-colors flex items-center gap-2">
                        <span className="h-1 w-1 bg-indigo-300 rounded-full"></span>
                        My Wishlist
                      </Link>
                    </motion.li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display',serif]">Contact</h3>
              <address className="not-italic text-indigo-100 space-y-3">
                <p className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  123 Library Street
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@bookhive.com
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  (123) 456-7890
                </p>
              </address>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display',serif]">Opening Hours</h3>
              <ul className="text-indigo-100 space-y-3">
                <li className="flex justify-between items-center">
                  <span>Monday - Friday</span>
                  <span className="text-white">9:00 AM - 8:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Saturday</span>
                  <span className="text-white">10:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Sunday</span>
                  <span className="text-white">12:00 PM - 4:00 PM</span>
                </li>
              </ul>
            </div>
          </div> */}
          
          <div className="mt-12 pt-8 border-t border-indigo-800/50 flex flex-col md:flex-row justify-between items-center text-indigo-200">
            <p>&copy; {new Date().getFullYear()} BookHive Library Management System. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-indigo-300 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-indigo-300 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 