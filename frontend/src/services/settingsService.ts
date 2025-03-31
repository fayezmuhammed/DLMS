import api from '../utils/api';

export interface BorrowingRules {
  maxBooksStudent: number;
  maxBooksTeacher: number;
  maxDaysStudent: number;
  maxDaysTeacher: number;
  finePerDay: number;
}

export interface Settings {
  // General settings
  libraryName: string;
  email: string;
  phone: string;
  address: string;
  
  // Borrowing rules
  maxBooksStudent: number;
  maxBooksTeacher: number;
  maxDaysStudent: number;
  maxDaysTeacher: number;
  finePerDay: number;
  
  // Notification settings
  emailNotifications: boolean;
  dueDateReminders: boolean;
  overdueNotifications: boolean;
  newBookNotifications: boolean;
  
  // Meta data
  updatedAt: string;
  _id: string;
}

export const settingsService = {
  async getSettings() {
    const response = await api.get('/settings');
    return response.data;
  },
  
  async updateSettings(settings: Partial<Settings>) {
    const response = await api.put('/settings', settings);
    return response.data;
  },
  
  async getBorrowingRules() {
    const response = await api.get('/settings/borrowing-rules');
    return response.data;
  }
};

export default settingsService; 