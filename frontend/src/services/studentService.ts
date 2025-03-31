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
    const response = await api.get(`/users/admission/${admissionNumber}`);
    return response.data;
  },

  async getStudentDues(userId: string) {
    const response = await api.get(`/transactions/student-dues/${userId}`);
    return response.data;
  }
}; 