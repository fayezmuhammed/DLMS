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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-900 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold">BookHive</Link>
              <nav className="absolute left-1/2 transform -translate-x-1/2 flex space-x-6">
                <Link 
                  to="/" 
                  className={`hover:text-white/80 transition-colors ${
                    location.pathname === '/' ? 'font-semibold' : ''
                  }`}
                >
                  Home
                </Link>
                <Link 
                  to="/books" 
                  className={`hover:text-white/80 transition-colors ${
                    location.pathname.startsWith('/books') ? 'font-semibold' : ''
                  }`}
                >
                  Books
                </Link>
                <Link 
                  to="/ebooks" 
                  className={`hover:text-white/80 transition-colors ${
                    location.pathname.startsWith('/ebooks') ? 'font-semibold' : ''
                  }`}
                >
                  E-Books
                </Link>
                {isLoggedIn && (
                  <>
                    <Link 
                      to="/transactions" 
                      className={`hover:text-white/80 transition-colors ${
                        location.pathname.startsWith('/transactions') ? 'font-semibold' : ''
                      }`}
                    >
                      My Transactions
                    </Link>
                    <Link 
                      to="/wishlist" 
                      className={`hover:text-white/80 transition-colors ${
                        location.pathname.startsWith('/wishlist') ? 'font-semibold' : ''
                      }`}
                    >
                      My Wishlist
                    </Link>
                  </>
                )}
                {isLoggedIn && user?.role === 'Admin' && (
                  <Link 
                    to="/admin" 
                    className="hover:text-white/80 transition-colors font-semibold"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center">
              {loading ? (
                <div className="h-9 w-24 bg-white/20 animate-pulse rounded-md"></div>
              ) : isLoggedIn && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user.imagePath} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/transactions">My Transactions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist">My Wishlist</Link>
                    </DropdownMenuItem>
                    {user.role === 'Admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="space-x-4">
                  <Button variant="ghost" className="text-white hover:text-white/80" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button className="bg-white text-indigo-900 hover:bg-white/90" asChild>
                    <Link to="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-indigo-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Library Management System</h3>
              <p className="text-white/80">
                A comprehensive solution for managing library resources, books, and user transactions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-white/80 hover:text-white">Home</Link></li>
                <li><Link to="/books" className="text-white/80 hover:text-white">Books</Link></li>
                {isLoggedIn && (
                  <>
                    <li><Link to="/transactions" className="text-white/80 hover:text-white">My Transactions</Link></li>
                    <li><Link to="/wishlist" className="text-white/80 hover:text-white">My Wishlist</Link></li>
                  </>
                )}
                <li><Link to="/contact" className="text-white/80 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <address className="not-italic text-white/80">
                <p>123 Library Street</p>
                <p>Bookville, BK 12345</p>
                <p>Email: info@library.com</p>
                <p>Phone: (123) 456-7890</p>
              </address>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/20 text-center text-white/70">
            <p>&copy; {new Date().getFullYear()} Library Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 