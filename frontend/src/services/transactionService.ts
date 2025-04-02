import api from '../utils/api';
import { Book } from './bookService';
import { BorrowingRules } from './settingsService';

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
  notes?: string;
}

interface IssueBookParams {
  bookId: string;
  userId: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export interface FineCalculation {
  daysOverdue: number;
  fineAmount: number;
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
  },
  
  async getBookTransactions(bookId: string) {
    const response = await api.get(`/transactions/book/${bookId}`);
    return response.data;
  },

  async getUserActiveTransactions(userId: string) {
    const response = await api.get(`/transactions/user/${userId}/active`);
    return response.data;
  },

  async issueBook(params: IssueBookParams) {
    const response = await api.post('/transactions/issue', params);
    return response.data;
  },

  // Utility functions
  calculateOverdueDays(dueDate: string | Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },

  calculateFine(dueDate: string | Date, rules: BorrowingRules): FineCalculation {
    const daysOverdue = this.calculateOverdueDays(dueDate);
    const fineAmount = daysOverdue * rules.finePerDay;
    return {
      daysOverdue,
      fineAmount: parseFloat(fineAmount.toFixed(2))
    };
  }
}; 