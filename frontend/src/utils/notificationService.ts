import axios from 'axios';

interface Book {
  id: string;
  title: string;
  author: string;
  dueDate: string;
  fine?: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

/**
 * Send overdue notifications to users
 */
export const sendOverdueNotifications = async (user: User, books: Book[]) => {
  try {
    await axios.post(
      'http://localhost:5001/api/transactions/send-overdue-notification',
      {
        userId: user._id,
        books: books
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error sending overdue notification:', error);
    return false;
  }
};

/**
 * Send fine notifications to users
 */
export const sendFineNotifications = async (user: User, books: Book[]) => {
  try {
    await axios.post(
      'http://localhost:5001/api/transactions/send-fine-notification',
      {
        userId: user._id,
        books: books
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error sending fine notification:', error);
    return false;
  }
};

/**
 * Send due date reminder notifications
 */
export const sendDueDateReminders = async (user: User, books: Book[]) => {
  try {
    await axios.post(
      'http://localhost:5001/api/transactions/send-due-date-reminder',
      {
        userId: user._id,
        books: books
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error sending due date reminder:', error);
    return false;
  }
};

/**
 * Check for books that are due soon and send reminders
 */
export const checkAndSendDueDateReminders = async (user: User, books: Book[]) => {
  const today = new Date();
  const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3));
  
  const booksDueSoon = books.filter(book => {
    const dueDate = new Date(book.dueDate);
    return dueDate <= threeDaysFromNow && dueDate > today;
  });
  
  if (booksDueSoon.length > 0) {
    await sendDueDateReminders(user, booksDueSoon);
  }
};

/**
 * Check for overdue books and send notifications
 */
export const checkAndSendOverdueNotifications = async (user: User, books: Book[]) => {
  const today = new Date();
  
  const overdueBooks = books.filter(book => {
    const dueDate = new Date(book.dueDate);
    return dueDate < today;
  });
  
  if (overdueBooks.length > 0) {
    await sendOverdueNotifications(user, overdueBooks);
    
    // If there are fines, send fine notifications
    const booksWithFines = overdueBooks.filter(book => book.fine && book.fine > 0);
    if (booksWithFines.length > 0) {
      await sendFineNotifications(user, booksWithFines);
    }
  }
}; 