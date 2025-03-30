import api from '../utils/api';
import { Book } from './bookService';

interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Transaction {
  _id: string;
  user: string | User;
  book: string | Book;
  issueDate: string;
  returnDate?: string;
  dueDate: string;
  status: 'borrowed' | 'returned' | 'overdue';
  createdAt: string;
}

export const transactionService = {
  async getBorrowingHistory() {
    const response = await api.get('/transactions/history');
    return response.data;
  },

  async borrowBook(bookId: string) {
    const response = await api.post(`/transactions/borrow/${bookId}`);
    return response.data;
  },

  async returnBook(bookId: string) {
    const response = await api.post(`/transactions/return/${bookId}`);
    return response.data;
  },

  // Admin functionalities
  async getAllTransactions() {
    const response = await api.get('/transactions');
    return response.data;
  },

  async getActiveTransactions() {
    const response = await api.get('/transactions?status=borrowed');
    return response.data;
  },

  async getOverdueTransactions() {
    const response = await api.get('/transactions?status=overdue');
    return response.data;
  }
}; 