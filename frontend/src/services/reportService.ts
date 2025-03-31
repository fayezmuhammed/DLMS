import api from '../utils/api';

export interface BorrowingTrendData {
  month: string;
  count: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface OverdueData {
  name: string;
  value: number;
}

export interface PopularBookData {
  name: string;
  count: number;
}

export const reportService = {
  async getBorrowingTrends(startDate: Date, endDate: Date) {
    const response = await api.get('/reports/borrowing-trends', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  },

  async getCategoryDistribution(startDate: Date, endDate: Date) {
    const response = await api.get('/reports/category-distribution', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  },

  async getOverdueAnalysis(startDate: Date, endDate: Date) {
    const response = await api.get('/reports/overdue-analysis', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  },

  async getPopularBooks(startDate: Date, endDate: Date) {
    const response = await api.get('/reports/popular-books', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data;
  }
}; 