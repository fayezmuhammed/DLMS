import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"

// Use lazy loading for components
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage')); 
const VerifyOtpPage = lazy(() => import('@/pages/VerifyOtpPage')); 
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const BooksPage = lazy(() => import('@/pages/BooksPage'));
const BookDetailPage = lazy(() => import('@/pages/BookDetailPage'));
const EBooksPage = lazy(() => import('@/pages/EBooksPage'));
const EBookDetailPage = lazy(() => import('@/pages/EBookDetailPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));

// Admin pages
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ManageBooksPage = lazy(() => import('@/pages/admin/ManageBooksPage'));
const ManageUsersPage = lazy(() => import('@/pages/admin/ManageUsersPage'));
const AddBookPage = lazy(() => import('@/pages/admin/AddBookPage'));
// Additional admin pages (even if they're placeholders for now)
const ManageEBooksPage = lazy(() => import('@/pages/admin/ManageEBooksPage'));
const TransactionsPageAdmin = lazy(() => import('@/pages/admin/TransactionsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const NoDuePage = lazy(() => import('@/pages/admin/NoDuePage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

// Import the admin BookDetailPage with a different name to avoid conflicts
const AdminBookDetailPage = lazy(() => import('@/pages/admin/BookDetailPage'));

// Loading component
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Loading...</div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const isAuthFlag = localStorage.getItem('isAuthenticated');
      
      if (storedUser && isAuthFlag) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error parsing user data:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage events (for multi-tab support)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Function to handle login
  const handleLogin = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin' : '/'} replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <RegisterPage onRegister={handleLogin} />
              )
            }
          />
          <Route 
            path="/verify-otp" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <VerifyOtpPage />
              )
            }
          />
          <Route 
            path="/forgot-password" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <ForgotPasswordPage />
              )
            }
          />
          <Route 
            path="/reset-password/:resettoken" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <ResetPasswordPage />
              )
            }
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : user?.role?.toLowerCase() !== 'admin' ? (
                <Navigate to="/" replace />
              ) : (
                <AdminLayout onLogout={handleLogout} />
              )
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="books" element={<ManageBooksPage />} />
            <Route path="books/add" element={<AddBookPage />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="ebooks" element={<ManageEBooksPage />} />
            <Route path="transactions" element={<TransactionsPageAdmin />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="no-due" element={<NoDuePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="books/:id" element={<AdminBookDetailPage />} />
          </Route>

          {/* User Routes */}
          <Route element={<MainLayout onLogout={handleLogout} />}>
            <Route index element={<HomePage />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="books/:id" element={<BookDetailPage />} />
            <Route path="ebooks" element={<EBooksPage />} />
            <Route 
              path="ebooks/:id" 
              element={<EBookDetailPage />} 
            />
            <Route 
              path="transactions" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : (
                  <TransactionsPage />
                )
              } 
            />
            <Route 
              path="wishlist" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : (
                  <WishlistPage />
                )
              } 
            />
            <Route 
              path="profile" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : (
                  <ProfilePage />
                )
              } 
            />
          </Route>
        </Routes>
        <Toaster />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
