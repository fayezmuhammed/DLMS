import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@dlms.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data && response.data.data) {
        const userData = response.data.data;
        // Store the token
        localStorage.setItem('token', userData.token);
        // Remove token from userData before storing
        const { token, ...userWithoutToken } = userData;
        onLogin(userWithoutToken);
        
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

  return (
    <div className="flex h-screen bg-white">
      {/* Left section with illustration */}
      <div className="hidden md:flex md:w-1/2 bg-blue-50 items-center justify-center relative overflow-hidden">
        <div className="relative w-3/4 h-3/4">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-30">
              <path d="M488.5,274.5Q401,299,430.5,357.5Q460,416,396.5,439Q333,462,277,471Q221,480,161,457Q101,434,61.5,376.5Q22,319,47,254.5Q72,190,113.5,147.5Q155,105,202.5,76.5Q250,48,305,72Q360,96,424.5,112.5Q489,129,488.5,189.5Q488,250,488.5,274.5Z" fill="#a5b4fc"></path>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-center">
              <img 
                src="/leftsectionimage.png" 
                alt="Person reading"
                className="max-w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right section with form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {/* Tabs */}
          <div className="flex mb-8 border-b">
            <button className="pb-2 px-4 font-bold text-xl text-primary border-b-2 border-primary">
              Sign in
            </button>
            <Link to="/register" className="pb-2 px-4 font-bold text-xl text-gray-400 hover:text-gray-500">
              Sign up
            </Link>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-md font-medium text-primary mb-2">
                Name
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Email address"
                required
              />
            </div>
            
            <div>
              <label className="block text-md font-medium text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Password"
                required
              />
              <div className="flex justify-end mt-1">
                <button type="button" className="text-sm text-gray-400 hover:text-gray-600">
                  forget password?
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <div className="flex justify-center items-center space-x-2 pt-4">
              <span className="text-gray-500">Don't have an account?</span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 