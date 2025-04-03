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

export interface EmailServerSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

export const settingsService = {
  async getSettings() {
    const response = await api.get('/settings');
    return response.data;
  },
  
  async updateSettings(settings: Partial<Settings>) {
    // Determine what type of settings are being updated and call the appropriate endpoint
    const updates = { ...settings };
    
    if ('libraryName' in updates || 'email' in updates || 'phone' in updates || 'address' in updates) {
      // General settings
      const generalSettings = {
        libraryName: updates.libraryName,
        email: updates.email,
        phone: updates.phone,
        address: updates.address
      };
      await api.put('/settings/general', generalSettings);
    }
    
    if ('maxBooksStudent' in updates || 'maxBooksTeacher' in updates || 
        'maxDaysStudent' in updates || 'maxDaysTeacher' in updates || 
        'finePerDay' in updates) {
      // Borrowing rules
      const borrowingSettings = {
        maxBooksStudent: updates.maxBooksStudent,
        maxBooksTeacher: updates.maxBooksTeacher,
        maxDaysStudent: updates.maxDaysStudent,
        maxDaysTeacher: updates.maxDaysTeacher,
        finePerDay: updates.finePerDay
      };
      await api.put('/settings/borrowing-rules', borrowingSettings);
    }
    
    if ('emailNotifications' in updates || 'dueDateReminders' in updates || 
        'overdueNotifications' in updates || 'newBookNotifications' in updates) {
      // Notification settings
      const notificationSettings = {
        emailNotifications: updates.emailNotifications,
        dueDateReminders: updates.dueDateReminders,
        overdueNotifications: updates.overdueNotifications,
        newBookNotifications: updates.newBookNotifications
      };
      await api.put('/settings/notifications', notificationSettings);
    }
    
    // Return successful response
    return {
      success: true,
      message: 'Settings updated successfully'
    };
  },
  
  async getBorrowingRules() {
    const response = await api.get('/settings/borrowing-rules');
    return response.data;
  },
  
  async updateEmailServer(emailSettings: EmailServerSettings) {
    const response = await api.put('/settings/email', emailSettings);
    return response.data;
  },
  
  async testEmailSettings(email: string) {
    const response = await api.post('/settings/test-email', { email });
    return response.data;
  },
  
  async sendManualReminders() {
    const response = await api.post('/settings/send-reminders');
    return response.data;
  }
};

export default settingsService; 