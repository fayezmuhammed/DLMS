// Email service utility for sending various notifications
// In a production environment, this would connect to a real email sending service

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  isHTML?: boolean;
}

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  dueDate?: string;
  borrowDate?: string;
  coverImage?: string;
  fine?: number;
}

/**
 * Simulated function to send emails
 * In production, this would be replaced with actual email sending logic
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // In a real app, this would connect to an email API
  console.log('Sending email:', options);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success (or occasional failure)
  const success = Math.random() > 0.05; // 95% success rate
  
  if (!success) {
    console.error('Failed to send email to:', options.to);
  } else {
    console.log('Email sent successfully to:', options.to);
  }
  
  return success;
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (user: User): Promise<boolean> => {
  const subject = `Welcome to BookHive Library, ${user.name}!`;
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #312e81;">Welcome to BookHive Library!</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for joining BookHive Library. We're excited to have you as part of our community of book lovers!</p>
      <p>With your new account, you can:</p>
      <ul>
        <li>Browse our extensive collection of books and e-books</li>
        <li>Reserve books for pickup</li>
        <li>Manage your borrowing history</li>
        <li>Create and maintain your personal wishlist</li>
      </ul>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">Your account details:</p>
        <p style="margin: 5px 0;">Email: ${user.email}</p>
        <p style="margin: 5px 0;">Account type: ${user.role || 'User'}</p>
      </div>
      <p>Happy reading!</p>
      <p>The BookHive Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    body,
    isHTML: true
  });
};

/**
 * Send book reservation confirmation
 */
export const sendBookReservationEmail = async (user: User, book: Book): Promise<boolean> => {
  const subject = `Your Book Reservation: ${book.title}`;
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #312e81;">Book Reservation Confirmation</h2>
      <p>Dear ${user.name},</p>
      <p>Your book reservation has been confirmed. Here are the details:</p>
      
      <div style="display: flex; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        ${book.coverImage ? `
          <div style="flex: 0 0 100px;">
            <img src="${book.coverImage}" alt="${book.title}" style="width: 100px; height: auto; object-fit: cover;">
          </div>
        ` : ''}
        <div style="padding: 15px; flex: 1;">
          <h3 style="margin: 0 0 10px 0;">${book.title}</h3>
          <p style="margin: 5px 0; color: #6b7280;">by ${book.author}</p>
          ${book.isbn ? `<p style="margin: 5px 0; font-size: 0.9em; color: #6b7280;">ISBN: ${book.isbn}</p>` : ''}
          ${book.borrowDate ? `<p style="margin: 5px 0;">Borrow date: ${new Date(book.borrowDate).toLocaleDateString()}</p>` : ''}
          ${book.dueDate ? `<p style="margin: 5px 0; font-weight: bold;">Due date: ${new Date(book.dueDate).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
      
      <p>The book will be held for you at our library for 3 days. Please bring your ID when you come to pick it up.</p>
      <p>If you have any questions, please contact our library staff.</p>
      <p>Thank you for using our services!</p>
      <p>The BookHive Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    body,
    isHTML: true
  });
};

/**
 * Send due date reminder email
 */
export const sendDueDateReminderEmail = async (user: User, books: Book[]): Promise<boolean> => {
  const subject = `Reminder: Books Due Soon`;
  
  // Build the list of books
  const booksList = books.map(book => `
    <div style="display: flex; margin: 10px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      ${book.coverImage ? `
        <div style="flex: 0 0 80px;">
          <img src="${book.coverImage}" alt="${book.title}" style="width: 80px; height: auto; object-fit: cover;">
        </div>
      ` : ''}
      <div style="padding: 15px; flex: 1;">
        <h3 style="margin: 0 0 10px 0;">${book.title}</h3>
        <p style="margin: 5px 0; color: #6b7280;">by ${book.author}</p>
        <p style="margin: 5px 0; font-weight: bold; color: ${isDateSoon(book.dueDate) ? '#ef4444' : '#312e81'};">
          Due date: ${new Date(book.dueDate || '').toLocaleDateString()}
        </p>
      </div>
    </div>
  `).join('');
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #312e81;">Books Due Soon Reminder</h2>
      <p>Dear ${user.name},</p>
      <p>This is a friendly reminder that you have one or more books due soon:</p>
      
      ${booksList}
      
      <p>Please return these items to avoid any late fees. If you need more time, you may renew eligible items online through your account.</p>
      <p>Thank you for using our library services!</p>
      <p>The BookHive Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    body,
    isHTML: true
  });
};

/**
 * Send overdue notification with fine information
 */
export const sendOverdueFineEmail = async (user: User, books: Book[]): Promise<boolean> => {
  const totalFine = books.reduce((sum, book) => sum + (book.fine || 0), 0);
  const subject = `Overdue Books and Fines Notification`;
  
  // Build the list of overdue books
  const booksList = books.map(book => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${book.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${book.author}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(book.dueDate || '').toLocaleDateString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(book.fine || 0).toFixed(2)}</td>
    </tr>
  `).join('');
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Overdue Books Notification</h2>
      <p>Dear ${user.name},</p>
      <p>Our records indicate that you have overdue books in your account. Please return these items as soon as possible to avoid additional fines.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Title</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Author</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Due Date</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Fine</th>
          </tr>
        </thead>
        <tbody>
          ${booksList}
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 10px; text-align: right;">Total Fine:</td>
            <td style="padding: 10px; text-align: right;">$${totalFine.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <p>You can pay your fines online through your account or in person at the library.</p>
      <p>If you believe this notification was sent in error, please contact our library staff.</p>
      <p>Thank you for your attention to this matter.</p>
      <p>The BookHive Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    body,
    isHTML: true
  });
};

// Helper function to check if a date is approaching soon (within 3 days)
const isDateSoon = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 && diffDays <= 3;
}; 