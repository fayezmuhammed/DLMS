import api from '../utils/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  booksIssued?: number;
  admissionNumber?: string;
  batch?: string;
  createdAt?: string;
}

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: Omit<User, '_id'>) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(id: string, userData: Partial<User>) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
}; 