import api from '../utils/api';
import { Category } from './bookService';

export interface EBook {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category?: string | Category | null;
  status: 'Available' | 'Restricted';
  coverImage?: string;
  publisher?: string;
  edition?: string;
  description?: string;
  tags?: string;
  fileUrl: string;
  fileType: 'pdf' | 'epub' | 'mobi' | 'doc' | 'docx' | 'txt';
  fileSize?: number;
  pages?: number;
  accessRestriction: 'Public' | 'Members' | 'Premium';
  downloadable: boolean;
  createdAt?: string;
}

export const ebookService = {
  async getEBooks() {
    const response = await api.get('/ebooks');
    return response.data;
  },

  async getEBook(id: string) {
    const response = await api.get(`/ebooks/${id}`);
    return response.data;
  },

  async createEBook(ebookData: FormData) {
    const response = await api.post('/ebooks', ebookData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateEBook(id: string, ebookData: FormData) {
    const response = await api.put(`/ebooks/${id}`, ebookData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteEBook(id: string) {
    const response = await api.delete(`/ebooks/${id}`);
    return response.data;
  },

  // Generate a download URL for the e-book
  getDownloadUrl(id: string) {
    // Include the token in the URL for authentication when downloading
    const token = localStorage.getItem('token');
    return `${api.defaults.baseURL}/ebooks/${id}/download${token ? `?token=${token}` : ''}`;
  },

  // Generate a view URL for the e-book (especially for PDFs)
  getViewUrl(id: string) {
    // Include the token in the URL for authentication when using in iframes or new windows
    const token = localStorage.getItem('token');
    return `${api.defaults.baseURL}/ebooks/${id}/view${token ? `?token=${token}` : ''}`;
  }
}; 