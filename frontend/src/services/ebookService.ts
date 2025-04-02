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
  coverImagePublicId?: string;
  publisher?: string;
  edition?: string;
  description?: string;
  tags?: string;
  fileUrl: string;
  filePublicId?: string;
  fileType: 'pdf' | 'epub' | 'mobi' | 'doc' | 'docx' | 'txt';
  fileSize?: number;
  pages?: number;
  accessRestriction: 'Public' | 'Members' | 'Premium';
  downloadable: boolean;
  createdAt?: string;
  image?: string;
  imagePath?: string;
}

export const ebookService = {
  async getEBooks() {
    const response = await api.get('/ebooks');
    
    // Normalize image fields for consistency
    if (response.data && response.data.data) {
      response.data.data.forEach((ebook: EBook) => {
        if (ebook.coverImage && !ebook.image) {
          ebook.image = ebook.coverImage;
        }
        if (ebook.image && !ebook.coverImage) {
          ebook.coverImage = ebook.image;
        }
        if (ebook.imagePath && !ebook.coverImage) {
          ebook.coverImage = ebook.imagePath;
        }
        if (ebook.coverImage && !ebook.imagePath) {
          ebook.imagePath = ebook.coverImage;
        }
      });
    }
    
    return response.data;
  },

  async getEBook(id: string) {
    const response = await api.get(`/ebooks/${id}`);
    
    // Normalize image fields for consistency
    if (response.data && response.data.data) {
      const ebook = response.data.data;
      if (ebook.coverImage && !ebook.image) {
        ebook.image = ebook.coverImage;
      }
      if (ebook.image && !ebook.coverImage) {
        ebook.coverImage = ebook.image;
      }
      if (ebook.imagePath && !ebook.coverImage) {
        ebook.coverImage = ebook.imagePath;
      }
      if (ebook.coverImage && !ebook.imagePath) {
        ebook.imagePath = ebook.coverImage;
      }
    }
    
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
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    return `${api.defaults.baseURL}/ebooks/${id}/view${token ? `?token=${token}&t=${timestamp}` : `?t=${timestamp}`}`;
  }
}; 