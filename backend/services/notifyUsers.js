const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const nodemailer = require('nodemailer');
const settings = require('../utils/settings');
const logger = require('../utils/logger');

/**
 * Configure nodemailer transporter
 * @returns {object} Configured nodemailer transporter
 */
const configureMailer = async () => {
  try {
    // Get email settings from database
    const emailSettings = await settings.getEmailSettings();
    
    if (!emailSettings || !emailSettings.host || !emailSettings.port) {
      logger.error('Email settings not found or incomplete');
      return null;
    }
    
    // Create nodemailer transporter
    return nodemailer.createTransport({
      host: emailSettings.host,
      port: emailSettings.port,
      secure: emailSettings.secure,
      auth: {
        user: emailSettings.username,
        pass: emailSettings.password
      }
    });
  } catch (error) {
    logger.error('Error configuring mail transporter:', error);
    return null;
  }
};

/**
 * Send due date reminder email to user
 * @param {object} transporter - Nodemailer transporter
 * @param {object} user - User to send email to
 * @param {array} dueBooks - Array of due books
 * @param {array} upcomingBooks - Array of books due soon
 * @returns {Promise<boolean>} Success status
 */
const sendReminderEmail = async (transporter, user, dueBooks = [], upcomingBooks = []) => {
  try {
    if (!user.email) {
      logger.error(`Cannot send reminder to user ${user._id}: Email not found`);
      return false;
    }
    
    const emailSettings = await settings.getEmailSettings();
    
    if (!dueBooks.length && !upcomingBooks.length) {
      return false; // No reminders to send
    }
    
    // Create due books list HTML
    let dueBooksHtml = '';
    if (dueBooks.length > 0) {
      dueBooksHtml = `
        <h3 style="color: #e11d48;">Overdue Books</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Title</th>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Due Date</th>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Days Overdue</th>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Fine</th>
          </tr>
          ${dueBooks.map(book => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${book.title}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(book.dueDate).toLocaleDateString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${book.daysOverdue}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${book.fine.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }
    
    // Create upcoming due books list HTML
    let upcomingBooksHtml = '';
    if (upcomingBooks.length > 0) {
      upcomingBooksHtml = `
        <h3 style="color: #f59e0b;">Books Due Soon</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Title</th>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Due Date</th>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Days Remaining</th>
          </tr>
          ${upcomingBooks.map(book => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${book.title}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(book.dueDate).toLocaleDateString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${book.daysRemaining}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }
    
    // Create email content
    const subject = dueBooks.length > 0 
      ? `URGENT: You have ${dueBooks.length} overdue book(s)` 
      : `Reminder: Books due soon`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Library Book Reminder</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
          <p>Dear ${user.name},</p>
          
          ${dueBooks.length > 0 
            ? `<p><strong>You have ${dueBooks.length} overdue book(s)</strong> that should be returned immediately to avoid additional fines.</p>` 
            : ''}
            
          ${upcomingBooks.length > 0 
            ? `<p>You have ${upcomingBooks.length} book(s) that will be due soon. Please return them by the due date to avoid fines.</p>` 
            : ''}
          
          ${dueBooksHtml}
          ${upcomingBooksHtml}
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin-top: 0;"><strong>Please note:</strong></p>
            <ul>
              <li>The fine rate is ₹${emailSettings.finePerDay || '0.50'} per day per book.</li>
              <li>You can return books at the library circulation desk during operating hours.</li>
              <li>Contact us if you have any questions or need to request an extension.</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">Thank you for using our library services.</p>
          <p style="margin-bottom: 0;">Regards,<br>Library Management Team</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;
    
    // Send email
    const info = await transporter.sendMail({
      from: `"Library Management System" <${emailSettings.username}>`,
      to: user.email,
      subject: subject,
      html: html
    });
    
    logger.info(`Due book reminder sent to ${user.email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending reminder email to ${user.email}:`, error);
    return false;
  }
};

/**
 * Send reminders to all users with due or upcoming due books
 * @param {number} upcomingDays - Days threshold for upcoming due books (default: 3)
 * @returns {Promise<object>} Results of sending reminders
 */
exports.sendDueBookReminders = async (upcomingDays = 3) => {
  const results = {
    success: false,
    overdueCount: 0,
    upcomingCount: 0,
    emailsSent: 0,
    errors: 0
  };
  
  try {
    // Configure email transporter
    const transporter = await configureMailer();
    if (!transporter) {
      logger.error('Failed to configure email transporter');
      return {
        ...results,
        error: 'Failed to configure email transporter'
      };
    }
    
    // Get all active transactions
    const transactions = await Transaction.find({
      status: { $in: ['borrowed', 'overdue'] }
    }).populate('user book');
    
    if (!transactions.length) {
      logger.info('No active transactions found for reminder emails');
      return {
        ...results,
        success: true
      };
    }
    
    // Get borrowing rules
    const borrowingRules = await settings.getBorrowingRules();
    const finePerDay = borrowingRules?.finePerDay || 0.5;
    
    // Group transactions by user
    const userTransactions = {};
    const now = new Date();
    
    transactions.forEach(transaction => {
      const userId = transaction.user?._id.toString();
      if (!userId || !transaction.book) return;
      
      if (!userTransactions[userId]) {
        userTransactions[userId] = {
          user: transaction.user,
          overdue: [],
          upcoming: []
        };
      }
      
      const dueDate = new Date(transaction.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      // Process overdue books
      if (daysDiff < 0) {
        const daysOverdue = Math.abs(daysDiff);
        const fine = daysOverdue * finePerDay;
        
        userTransactions[userId].overdue.push({
          _id: transaction.book._id,
          title: transaction.book.title,
          author: transaction.book.author,
          dueDate: transaction.dueDate,
          daysOverdue,
          fine
        });
        
        results.overdueCount++;
      } 
      // Process upcoming due books
      else if (daysDiff <= upcomingDays) {
        userTransactions[userId].upcoming.push({
          _id: transaction.book._id,
          title: transaction.book.title,
          author: transaction.book.author,
          dueDate: transaction.dueDate,
          daysRemaining: daysDiff
        });
        
        results.upcomingCount++;
      }
    });
    
    // Send emails to users
    const emailPromises = Object.values(userTransactions).map(async ({ user, overdue, upcoming }) => {
      // Only send emails if there are overdue or upcoming due books
      if (overdue.length > 0 || upcoming.length > 0) {
        const sent = await sendReminderEmail(transporter, user, overdue, upcoming);
        if (sent) {
          results.emailsSent++;
        } else {
          results.errors++;
        }
      }
    });
    
    // Wait for all emails to be sent
    await Promise.all(emailPromises);
    
    logger.info(`Due book reminders sent: ${results.emailsSent} emails, ${results.overdueCount} overdue books, ${results.upcomingCount} upcoming due books`);
    
    return {
      ...results,
      success: true
    };
  } catch (error) {
    logger.error('Error sending due book reminders:', error);
    return {
      ...results,
      error: error.message
    };
  }
};

/**
 * Setup a scheduled job to send reminders
 * @param {string} schedule - Cron schedule expression (e.g., "0 8 * * *" for daily at 8am)
 * @param {object} cron - Node-cron instance
 * @returns {object} Scheduled job
 */
exports.scheduleReminders = (schedule, cron) => {
  if (!cron) {
    logger.error('No cron instance provided for scheduling reminders');
    return null;
  }
  
  logger.info(`Scheduling due book reminders with schedule: ${schedule}`);
  
  return cron.schedule(schedule, async () => {
    logger.info('Running scheduled due book reminders');
    await exports.sendDueBookReminders();
  });
};

/**
 * Send a reminder for a specific transaction
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<object>} Result of sending reminder
 */
exports.sendReminderForTransaction = async (transactionId) => {
  try {
    // Configure email transporter
    const transporter = await configureMailer();
    if (!transporter) {
      return {
        success: false,
        error: 'Failed to configure email transporter'
      };
    }
    
    // Get transaction with populated user and book
    const transaction = await Transaction.findById(transactionId)
      .populate('user book');
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }
    
    if (!transaction.user || !transaction.book) {
      return {
        success: false,
        error: 'Transaction has missing user or book information'
      };
    }
    
    // Get borrowing rules
    const borrowingRules = await settings.getBorrowingRules();
    const finePerDay = borrowingRules?.finePerDay || 0.5;
    
    const now = new Date();
    const dueDate = new Date(transaction.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    let overdueBooks = [];
    let upcomingBooks = [];
    
    // Categorize as overdue or upcoming
    if (daysDiff < 0) {
      const daysOverdue = Math.abs(daysDiff);
      const fine = daysOverdue * finePerDay;
      
      overdueBooks.push({
        _id: transaction.book._id,
        title: transaction.book.title,
        author: transaction.book.author,
        dueDate: transaction.dueDate,
        daysOverdue,
        fine
      });
    } else {
      upcomingBooks.push({
        _id: transaction.book._id,
        title: transaction.book.title,
        author: transaction.book.author,
        dueDate: transaction.dueDate,
        daysRemaining: daysDiff
      });
    }
    
    // Send email
    const sent = await sendReminderEmail(transporter, transaction.user, overdueBooks, upcomingBooks);
    
    return {
      success: sent,
      transactionId,
      user: transaction.user._id,
      book: transaction.book._id,
      isOverdue: daysDiff < 0
    };
  } catch (error) {
    logger.error(`Error sending reminder for transaction ${transactionId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}; 