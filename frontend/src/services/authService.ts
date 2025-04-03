import api from '../utils/api';

interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async verifyEmail(code: string, email: string): Promise<AuthResponse> {
    const response = await api.post('/auth/verify', { code, email });
    return response.data;
  },

  async resendVerification(email: string): Promise<AuthResponse> {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  async getProfile(): Promise<AuthResponse> {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  async updateProfile(profileData: ProfileUpdateData): Promise<AuthResponse> {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  
  async changePassword(passwordData: PasswordChangeData): Promise<AuthResponse> {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }
}; 