import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface RegisterPageProps {
  onRegister?: (userData: any) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    batchName: '',
    classNumber: '',
    admissionNumber: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data based on role
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'student' && {
          admissionNumber: formData.admissionNumber,
          batchName: formData.batchName,
          classNumber: formData.classNumber
        })
      };

      // Make API call to backend for registration
      const response = await api.post('/auth/register', registerData);
      
      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        
        // Store token in localStorage
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
        
        // Create a user object without the token to avoid security risks
        const userForStorage = { ...userData };
        delete userForStorage.token;
        
        // Call onRegister with user data for state update if provided
        if (onRegister) {
          onRegister(userForStorage);
        }
      }

      // Redirect to verify OTP page after successful registration
      navigate('/verify-otp', { 
        state: { 
          email: formData.email, 
          message: 'Registration successful! Please verify your email with the OTP sent to your inbox.' 
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left section with illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 items-center justify-center relative">
        <div className="relative w-3/4">
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
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white rounded-2xl shadow-lg p-8">
          {/* Tabs */}
          <div className="flex justify-center border-b">
            <Link 
              to="/login" 
              className="pb-2 px-4 font-bold text-xl text-gray-400 hover:text-gray-500 transition-colors"
            >
              Sign in
            </Link>
            <button 
              className="pb-2 px-4 font-bold text-xl text-primary border-b-2 border-primary"
            >
              Sign up
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-6">
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-2">
                      Admission Number
                    </label>
                    <input
                      type="text"
                      name="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                      placeholder="e.g., ADM2023001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-2">
                      Batch Name
                    </label>
                    <input
                      type="text"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                      placeholder="e.g., 2023-2027"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-2">
                      Class Number
                    </label>
                    <input
                      type="text"
                      name="classNumber"
                      value={formData.classNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                      placeholder="e.g., Class 10-A"
                      required
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                  placeholder="Email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-shadow"
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
            
            <div className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 