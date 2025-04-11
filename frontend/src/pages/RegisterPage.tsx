import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Check, User, UserCog, BookOpen, Mail, Lock, ArrowRight } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.role === 'student') {
      if (!formData.admissionNumber.trim()) {
        setError('Admission number is required');
        return false;
      }
      if (!formData.batchName.trim()) {
        setError('Batch name is required');
        return false;
      }
      if (!formData.classNumber.trim()) {
        setError('Class number is required');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep => Math.max(1, currentStep - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) {
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
      
      if (response.data?.success) {
        // Only store email for verification, don't store token or user data yet
        // Redirect to verify OTP page after successful registration
        navigate('/verify-otp', { 
          state: { 
            email: formData.email, 
            message: 'Registration successful! Please verify your email with the OTP sent to your inbox.' 
          } 
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  // Progress indicators
  const Step = ({ number, title, isActive, isCompleted }: { number: number, title: string, isActive: boolean, isCompleted: boolean }) => (
    <div className="flex flex-col items-center">
      <motion.div 
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
          ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}
      >
        {isCompleted ? <Check className="w-4 h-4" /> : number}
      </motion.div>
      <span className={`text-xs ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>{title}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left section with illustration */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 items-center justify-center relative"
      >
        <div className="absolute inset-0 w-full h-full">
          <motion.div 
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3]
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

        <div className="relative z-10 w-3/4 flex flex-col items-center justify-center">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 50 }}
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
            <h2 className="text-3xl font-bold text-indigo-900 font-['Playfair_Display',serif]">Join Our Library</h2>
            <p className="mt-2 text-indigo-700 max-w-sm font-['Inter',sans-serif]">Create an account to access thousands of books and digital resources.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right section with form */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white"
      >
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-md space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Tabs */}
          <motion.div variants={itemVariants} className="flex justify-center border-b mb-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/login" 
                className="pb-2 px-4 font-bold text-xl text-gray-400 hover:text-gray-500 transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
            <motion.button 
              whileHover={{ color: '#4f46e5' }}
              className="pb-2 px-4 font-bold text-xl text-primary border-b-2 border-primary"
            >
              Sign up
            </motion.button>
          </motion.div>

          {/* Progress bar */}
          <motion.div variants={itemVariants} className="flex justify-between items-center mb-8 px-4">
            <Step number={1} title="Account" isActive={currentStep === 1} isCompleted={currentStep > 1} />
            <div className={`h-0.5 flex-1 mx-2 ${currentStep > 1 ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
            <Step number={2} title="Details" isActive={currentStep === 2} isCompleted={currentStep > 2} />
            <div className={`h-0.5 flex-1 mx-2 ${currentStep > 2 ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
            <Step number={3} title="Password" isActive={currentStep === 3} isCompleted={false} />
          </motion.div>
          
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-red-50 text-red-700 rounded-md text-sm border-l-4 border-red-500 mb-6"
            >
              {error}
            </motion.div>
          )}
          
          <form className="mt-4 space-y-6">
            <motion.div 
              key={`step-${currentStep}`}
              custom={currentStep}
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4 text-indigo-500" />
                      Full Name
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      Email Address
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="Your email address"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <UserCog className="w-4 h-4 text-indigo-500" />
                      Account Type
                    </label>
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </motion.select>
                  </motion.div>
                </div>
              )}

              {currentStep === 2 && formData.role === 'student' && (
                <div className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Admission Number
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="text"
                      name="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="e.g., ADM2023001"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Batch Name
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="text"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="e.g., 2023-2027"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Class Number
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="text"
                      name="classNumber"
                      value={formData.classNumber}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="e.g., Class 10-A"
                      required
                    />
                  </motion.div>
                </div>
              )}

              {currentStep === 2 && formData.role !== 'student' && (
                <div className="py-12 flex flex-col items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, 0] }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <Check className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Teacher Account</h3>
                  <p className="text-gray-600 text-center">No additional details required for teachers. Click 'Continue' to set your password.</p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      Password
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="Create a strong password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center gap-2 text-md font-medium text-gray-700 mb-1">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      Confirm Password
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                    />
                  </motion.div>
                </div>
              )}
            </motion.div>

            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  type="button"
                  onClick={prevStep}
                  className="py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </motion.button>
              )}
              
              {currentStep < 3 ? (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  type="button"
                  onClick={nextStep}
                  className="py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center ml-auto"
                >
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center ml-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      ></motion.div>
                      Registering...
                    </div>
                  ) : (
                    <>
                      Register
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <motion.div 
              variants={itemVariants}
              className="flex justify-center items-center space-x-2 pt-4 text-sm"
            >
              <span className="text-gray-500">Already have an account?</span>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage; 