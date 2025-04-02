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
      const response = await axiosAuth.post('/api/reservations', { bookId });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get user's reservations
  getUserReservations: async () => {
    try {
      const response = await axiosAuth.get('/api/reservations');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (reservationId: string) => {
    try {
      const response = await axiosAuth.delete(`/api/reservations/${reservationId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin: Get all reservations
  getAllReservations: async () => {
    try {
      const response = await axiosAuth.get('/api/reservations/all');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Admin: Expire outdated reservations
  expireOutdatedReservations: async () => {
    try {
      const response = await axiosAuth.put('/api/reservations/expire-outdated');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}; 