import api from '../utils/api';
import { Book } from './bookService';

export interface WishlistItem {
  _id: string;
  book: Book;
  user: string;
  addedDate: string;
}

export const wishlistService = {
  async getWishlist() {
    const response = await api.get('/wishlist');
    return response.data;
  },

  async addToWishlist(bookId: string) {
    const response = await api.post('/wishlist/add', { bookId });
    return response.data;
  },

  async removeFromWishlist(bookId: string) {
    const response = await api.delete(`/wishlist/remove/${bookId}`);
    return response.data;
  }
}; 