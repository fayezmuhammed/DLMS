import React, { Suspense, lazy, useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"

// Lightweight Loading component to show immediately
const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-pulse">Loading...</div>
  </div>
);

// Prefetch component loader
const prefetchComponent = (factory: () => Promise<{ default: React.ComponentType<any> }>) => {
  const Component = lazy(factory);
  void factory();
  return (props: any) => <Component {...props} />;
};

// Lazy loaded components with prefetch
const components = {
  auth: {
    LoginPage: prefetchComponent(() => import('@/pages/LoginPage')),
    RegisterPage: prefetchComponent(() => import('@/pages/RegisterPage')),
    VerifyOtpPage: prefetchComponent(() => import('@/pages/VerifyOtpPage')),
    ForgotPasswordPage: prefetchComponent(() => import('@/pages/ForgotPasswordPage')),
    ResetPasswordPage: prefetchComponent(() => import('@/pages/ResetPasswordPage'))
  },
  main: {
    HomePage: prefetchComponent(() => import('@/pages/HomePage')),
    BooksPage: prefetchComponent(() => import('@/pages/BooksPage')),
    BookDetailPage: prefetchComponent(() => import('@/pages/BookDetailPage')),
    EBooksPage: prefetchComponent(() => import('@/pages/EBooksPage')),
    EBookDetailPage: prefetchComponent(() => import('@/pages/EBookDetailPage')),
    TransactionsPage: prefetchComponent(() => import('@/pages/TransactionsPage')),
    WishlistPage: prefetchComponent(() => import('@/pages/WishlistPage')),
    ProfilePage: prefetchComponent(() => import('@/pages/ProfilePage')),
    ReservationsPage: prefetchComponent(() => import('@/pages/ReservationsPage'))
  },
  admin: {
    DashboardPage: prefetchComponent(() => import('@/pages/admin/DashboardPage')),
    ManageBooksPage: prefetchComponent(() => import('@/pages/admin/ManageBooksPage')),
    ManageUsersPage: prefetchComponent(() => import('@/pages/admin/ManageUsersPage')),
    UserDetailPage: prefetchComponent(() => import('@/pages/admin/UserDetailPage')),
    AddBookPage: prefetchComponent(() => import('@/pages/admin/AddBookPage')),
    EditBookPage: prefetchComponent(() => import('@/pages/admin/EditBookPage')),
    IssueBookPage: prefetchComponent(() => import('@/pages/admin/IssueBookPage')),
    ManageEBooksPage: prefetchComponent(() => import('@/pages/admin/ManageEBooksPage')),
    AddEBookPage: prefetchComponent(() => import('@/pages/admin/AddEBookPage')),
    EditEBookPage: prefetchComponent(() => import('@/pages/admin/EditEBookPage')),
    TransactionsPage: prefetchComponent(() => import('@/pages/admin/TransactionsPage')),
    ReportsPage: prefetchComponent(() => import('@/pages/admin/ReportsPage')),
    NoDuePage: prefetchComponent(() => import('@/pages/admin/NoDuePage')),
    SettingsPage: prefetchComponent(() => import('@/pages/admin/SettingsPage')),
    BookDetailPage: prefetchComponent(() => import('@/pages/admin/BookDetailPage')),
    ManageReservationsPage: prefetchComponent(() => import('@/pages/admin/ManageReservationsPage'))
  },
  layouts: {
    MainLayout: prefetchComponent(() => import('@/layouts/MainLayout')),
    AdminLayout: prefetchComponent(() => import('@/layouts/AdminLayout'))
  }
};

// Optimized Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(_: Error) {
    // You can log errorInfo here if needed
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500">
          <h1>Something went wrong.</h1>
          <p>{(this.state.error as Error)?.message || 'Unknown error'}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Prefetch adjacent routes
interface PrefetchOnViewProps {
  children: ReactNode;
}
const PrefetchOnView = ({ children }: PrefetchOnViewProps) => {
  const location = useLocation();
  useEffect(() => {
    // Prefetch common pages based on current location
    const prefetchMap: Record<string, string[]> = {
      '/': ['BooksPage', 'EBooksPage'],
      '/books': ['BookDetailPage', 'HomePage'],
      '/ebooks': ['EBookDetailPage', 'HomePage'],
      '/admin': ['admin/DashboardPage', 'admin/ManageBooksPage'],
      '/admin/books': ['admin/ManageUsersPage', 'admin/TransactionsPage']
    };
    const pagesToPrefetch = prefetchMap[location.pathname];
    if (pagesToPrefetch) {
      pagesToPrefetch.forEach((page: string) => {
        const importPath = `@/pages/${page}`;
        import(/* @vite-ignore */ importPath).catch(() => {});
      });
    }
  }, [location.pathname]);
  return <>{children}</>;
};

interface AuthState {
  isAuthenticated: boolean;
  user: { role?: string } | null;
  isLoading: boolean;
}

function App() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null, isLoading: true });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const isAuthFlag = localStorage.getItem('isAuthenticated');
        if (storedUser && isAuthFlag) {
          setAuth({ isAuthenticated: true, user: JSON.parse(storedUser), isLoading: false });
        } else {
          setAuth({ isAuthenticated: false, user: null, isLoading: false });
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        setAuth({ isAuthenticated: false, user: null, isLoading: false });
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleAuth = (action: 'login' | 'logout', userData?: { role?: string }) => {
    if (action === 'login' && userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      setAuth({ ...auth, isAuthenticated: true, user: userData });
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      setAuth({ ...auth, isAuthenticated: false, user: null });
    }
  };

  if (auth.isLoading) return <Loading />;

  const isAdmin = auth.user?.role?.toLowerCase() === 'admin';

  return (
    <ErrorBoundary>
      <PrefetchOnView>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              auth.isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/'} replace /> : 
              <components.auth.LoginPage onLogin={(userData: { role?: string }) => handleAuth('login', userData)} />
            } />
            <Route path="/register" element={
              auth.isAuthenticated ? <Navigate to="/" replace /> : 
              <components.auth.RegisterPage onRegister={(userData: { role?: string }) => handleAuth('login', userData)} />
            } />
            <Route path="/verify-otp" element={
              auth.isAuthenticated ? <Navigate to="/" replace /> : <components.auth.VerifyOtpPage />
            } />
            <Route path="/forgot-password" element={
              auth.isAuthenticated ? <Navigate to="/" replace /> : <components.auth.ForgotPasswordPage />
            } />
            <Route path="/reset-password/:resettoken" element={
              auth.isAuthenticated ? <Navigate to="/" replace /> : <components.auth.ResetPasswordPage />
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              !auth.isAuthenticated ? <Navigate to="/login" replace /> :
              !isAdmin ? <Navigate to="/" replace /> :
              <components.layouts.AdminLayout onLogout={() => handleAuth('logout')} />
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<components.admin.DashboardPage />} />
              <Route path="books" element={<components.admin.ManageBooksPage />} />
              <Route path="books/add" element={<components.admin.AddBookPage />} />
              <Route path="books/edit/:id" element={<components.admin.EditBookPage />} />
              <Route path="users" element={<components.admin.ManageUsersPage />} />
              <Route path="users/:userId" element={<components.admin.UserDetailPage />} />
              <Route path="ebooks" element={<components.admin.ManageEBooksPage />} />
              <Route path="ebooks/add" element={<components.admin.AddEBookPage />} />
              <Route path="ebooks/edit/:id" element={<components.admin.EditEBookPage />} />
              <Route path="transactions" element={<components.admin.TransactionsPage />} />
              <Route path="transactions/issue" element={<components.admin.IssueBookPage />} />
              <Route path="reports" element={<components.admin.ReportsPage />} />
              <Route path="no-due" element={<components.admin.NoDuePage />} />
              <Route path="settings" element={<components.admin.SettingsPage />} />
              <Route path="books/:id" element={<components.admin.BookDetailPage />} />
              <Route path="reservations" element={<components.admin.ManageReservationsPage />} />
            </Route>

            {/* User Routes */}
            <Route element={<components.layouts.MainLayout onLogout={() => handleAuth('logout')} />}>
              <Route index element={<components.main.HomePage />} />
              <Route path="books" element={<components.main.BooksPage />} />
              <Route path="books/:id" element={<components.main.BookDetailPage />} />
              <Route path="ebooks" element={<components.main.EBooksPage />} />
              <Route path="ebooks/:id" element={<components.main.EBookDetailPage />} />
              <Route path="transactions" element={
                !auth.isAuthenticated ? <Navigate to="/login" replace /> : <components.main.TransactionsPage />
              } />
              <Route path="wishlist" element={
                !auth.isAuthenticated ? <Navigate to="/login" replace /> : <components.main.WishlistPage />
              } />
              <Route path="profile" element={
                !auth.isAuthenticated ? <Navigate to="/login" replace /> : <components.main.ProfilePage />
              } />
              <Route path="reservations" element={
                !auth.isAuthenticated ? <Navigate to="/login" replace /> : <components.main.ReservationsPage />
              } />
            </Route>
          </Routes>
          <Toaster />
        </Suspense>
      </PrefetchOnView>
    </ErrorBoundary>
  );
}

export default App;
