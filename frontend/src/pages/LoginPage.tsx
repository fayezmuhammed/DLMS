import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';

interface LocationState {
  message?: string;
}

interface LoginPageProps {
  onLogin?: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    // Check if there's a message in the location state (e.g. after verification)
    if (state?.message) {
      setSuccessMessage(state.message);
      // Clear state after showing message
      window.history.replaceState({}, document.title);
    }
    
    // Check for authentication error messages stored in sessionStorage
    const authError = sessionStorage.getItem('authError');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('authError');
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        
        // Check if user is verified
        if (!userData.isVerified) {
          // Redirect to verification page if user is not verified
          navigate('/verify-otp', { 
            state: { 
              email: email,
              message: 'Please verify your email before logging in.'
            }
          });
          setIsLoading(false);
          return;
        }
        
        // Store token in localStorage
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
        
        // Create a user object without the token to avoid security risks
        const userForStorage = { ...userData };
        delete userForStorage.token;
        
        // Call onLogin with user data for state update
        if (onLogin) {
          onLogin(userForStorage);
        }
        
        if (userData.role.toLowerCase() === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring",
        stiffness: 50,
        duration: 0.8
      }
    }
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left section with illustration */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 w-full h-full">
          <motion.div 
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 1, 0]
            }}
            transition={{ 
              duration: 12, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -top-1/3 -right-1/3 w-full h-full rounded-full bg-indigo-200 blur-3xl opacity-30"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 10, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -bottom-1/3 -left-1/3 w-full h-full rounded-full bg-blue-200 blur-3xl opacity-20"
          />
        </div>
        
        <div className="relative w-3/4 h-3/4 z-10 flex flex-col items-center justify-center">
          <motion.img 
            variants={imageVariants}
            src="/leftsectionimage.png" 
            alt="Person reading"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center mt-8"
          >
            <h2 className="text-3xl font-bold text-indigo-900 font-['Playfair_Display',serif]">Welcome Back</h2>
            <p className="mt-2 text-indigo-700 max-w-sm font-['Inter',sans-serif]">Sign in to access your account and explore our vast collection of books.</p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Right section with form */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="w-full md:w-1/2 flex items-center justify-center p-8"
      >
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Tabs */}
          <motion.div variants={itemVariants} className="flex mb-8 border-b">
            <motion.button 
              whileHover={{ color: '#4f46e5' }}
              className="pb-2 px-4 font-bold text-xl text-primary border-b-2 border-primary"
            >
              Sign in
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="pb-2 px-4 font-bold text-xl text-gray-400 hover:text-gray-500 transition-colors">
                Sign up
              </Link>
            </motion.div>
          </motion.div>
          
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm border-l-4 border-red-500"
            >
              {error}
            </motion.div>
          )}
          
          {successMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-3 bg-green-50 text-green-700 rounded-md text-sm border-l-4 border-green-500"
            >
              {successMessage}
            </motion.div>
          )}
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-md font-medium text-gray-700 mb-2">
                Email
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                placeholder="Email address"
                required
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-md font-medium text-gray-700 mb-2">
                Password
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                placeholder="Password"
                required
              />
              <div className="flex justify-end mt-1">
                <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-primary">
                    Forgot password?
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  ></motion.div>
                  Signing in...
                </div>
              ) : 'Sign in'}
            </motion.button>
            
            <motion.div 
              variants={itemVariants}
              className="flex justify-center items-center space-x-2 pt-4"
            >
              <span className="text-gray-500">Don't have an account?</span>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </motion.div>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage; 