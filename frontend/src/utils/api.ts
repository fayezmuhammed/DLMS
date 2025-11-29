import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle authentication errors
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Check if it's a token validation issue
            const errorMessage = error.response.data?.message || '';
            const requestUrl = error.config?.url || '';
            
            console.error('Authentication error:', errorMessage, 'URL:', requestUrl);
            
            // Skip login-related endpoints to avoid redirect loops
            const isAuthEndpoint = 
                requestUrl.includes('/auth/login') || 
                requestUrl.includes('/auth/register') || 
                requestUrl.includes('/auth/verify');
                
            if (!isAuthEndpoint) {
                // Check if token is invalid/expired and user is not on login page
                if (
                    (errorMessage.includes('not authorized') || 
                    errorMessage.includes('Authentication failed') ||
                    errorMessage.includes('invalid token') ||
                    errorMessage.includes('Not authorized')) && 
                    !window.location.pathname.includes('/login')
                ) {
                    console.log('Authentication failed, redirecting to login');
                    
                    // Clear auth data
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('isAuthenticated');
                    
                    // Set a message in session storage to show after redirect
                    sessionStorage.setItem('authError', 'Your session has expired. Please log in again.');
                    
                    // Redirect to login
                    window.location.href = '/login';
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export default api; 