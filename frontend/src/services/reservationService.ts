import { Book } from './bookService';
import { axiosAuth } from '@/utils/axiosConfig';

export interface Reservation {
  _id: string;
  user: string;
  book: Book | string;
  reservedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
}

export const reservationService = {
  // Reserve a book
  reserveBook: async (bookId: string) => {
    try {
      const response = await axiosAuth.post('/reservations', { bookId });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get user's reservations
  getUserReservations: async () => {
    try {
      const response = await axiosAuth.get('/reservations');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (reservationId: string) => {
    try {
      const response = await axiosAuth.delete(`/reservations/${reservationId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin: Get all reservations
  getAllReservations: async () => {
    try {
      const response = await axiosAuth.get('/reservations/all');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin: Expire outdated reservations
  expireOutdatedReservations: async () => {
    try {
      const response = await axiosAuth.put('/reservations/expire-outdated');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin: Issue book from reservation
  issueBookFromReservation: async (reservationId: string) => {
    try {
      const response = await axiosAuth.post(`/reservations/${reservationId}/issue`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}; 