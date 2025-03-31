import api from '../utils/api';

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface Book {
  _id: string;
  bookNo: string;
  title: string;
  author: string;
  ISBN: string;
  category?: string | Category | null;
  status: 'Available' | 'Reserved' | 'Issued' | 'Lost';
  copies: number;
  coverImage?: string;
  image?: string;
  imagePublicId?: string;
  imagePath?: string;
  publisher?: string;
  edition?: string;
  description?: string;
  tags?: string;
  addedOn?: string;
  shelf?: string;
}

export const bookService = {
  async getBooks() {
    const response = await api.get('/books');
    return response.data;
  },

  async getBookById(id: string) {
    const response = await api.get(`/books/${id}`);
    
    // If response contains a book property, use it directly
    if (response.data && response.data.book) {
      // Make sure image fields are consistent
      const book = response.data.book;
      if (book.image && !book.coverImage) {
        book.coverImage = book.image;
      }
      if (book.coverImage && !book.image) {
        book.image = book.coverImage;
      }
      return response.data;
    }
    
    // Otherwise use the original response which might have data.success
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  async createBook(bookData: FormData) {
    const response = await api.post('/books/add', bookData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateBook(id: string, bookData: FormData) {
    const response = await api.put(`/books/update/${id}`, bookData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteBook(id: string) {
    const response = await api.delete(`/books/delete/${id}`);
    return response.data;
  }
};