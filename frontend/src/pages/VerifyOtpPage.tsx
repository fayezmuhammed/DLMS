import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

interface LocationState {
  email: string;
  message: string;
}

const VerifyOtpPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes countdown
  const [resendDisabled, setResendDisabled] = useState(true);
  const [email, setEmail] = useState('');
  
  // Reference for OTP input fields
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  
  useEffect(() => {
    // Debug logging
    console.log('VerifyOtpPage loaded');
    console.log('Location state:', location.state);
    
    // Check if state exists and has email
    if (state?.email) {
      console.log('Email found in state:', state.email);
      setEmail(state.email);
    } else {
      console.log('No email found in state, redirecting to login');
      // If no email in state, redirect to login
      navigate('/login', { replace: true });
    }
    
    // Focus on the first input
    if (inputRefs.current && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Start countdown for resend button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [state, navigate]);
  
  // Format the countdown time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle OTP input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow numeric input, one digit
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input if current has a value
      if (value && index < 5 && inputRefs.current && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  // Handle key press in OTP inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move focus to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // Handle OTP paste functionality
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // If pasted data is 6 digits, fill the OTP fields
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      
      // Focus the last input
      if (inputRefs.current && inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate OTP format
    const otpValue = otp.join('');
    if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to verify OTP
      const response = await api.post('/auth/verify', {
        email,
        code: otpValue
      });
      
      setSuccess('Email verification successful! Redirecting to login...');
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Your email has been verified successfully. You can now log in.' }
        });
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('/auth/resend-verification', { email });
      
      // Reset countdown and disable resend button
      setCountdown(120);
      setResendDisabled(true);
      
      // Start countdown again
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setSuccess('A new verification code has been sent to your email');
      
      // Clear OTP fields
      setOtp(['', '', '', '', '', '']);
      
      // Focus first input
      if (inputRefs.current && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img 
          src="/logo.png"
          alt="DLMS Logo"
          className="mx-auto h-16 w-auto"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a 6-digit verification code to<br />
          <span className="font-medium text-indigo-600">{email}</span>
        </p>
        {state?.message && (
          <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md text-sm text-center">
            {state.message}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    aria-label={`Digit ${index + 1} of OTP`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="text-gray-600">
                  Didn't receive the code?
                </p>
              </div>
              <div className="text-sm">
                {resendDisabled ? (
                  <span className="text-gray-600">
                    Resend in {formatTime(countdown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || resendDisabled}
                    className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage; 