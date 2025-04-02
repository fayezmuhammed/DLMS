import api from '../utils/api';

export interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  admissionNumber: string;
  batch: string;
}

export interface Due {
  bookTitle: string;
  dueDate: string;
  fine: number;
}

export const studentService = {
  async getStudentByAdmissionNumber(admissionNumber: string) {
    try {
      const response = await api.get(`/users/admission/${admissionNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching student by admission number:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch student data',
        error: error.message
      };
    }
  },

  async getStudentDues(userId: string) {
    try {
      const response = await api.get(`/transactions/student-dues/${userId}`);
      return {
        success: true,
        data: response.data.data || [], // Ensure we always return an array, even if empty
        message: response.data.message || 'Student dues retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching student dues:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch student dues',
        error: error.message,
        data: [] // Return empty array as fallback
      };
    }
  }
}; 