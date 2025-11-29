import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data?.success) {
        setSuccessMessage('Password reset instructions have been sent to your email.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">Forgot Password</h1>
            <p className="text-gray-500">Enter your email to receive password reset instructions</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-md font-medium text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="flex justify-center items-center space-x-2 pt-4">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 