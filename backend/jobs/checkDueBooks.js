/**
 * Script to check for due/overdue books and send email notifications
 * This script can be run as a standalone process or scheduled with cron
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const dotenv = require('dotenv');
const notifyUsers = require('../services/notifyUsers');

// Load environment variables
dotenv.config();

// Update transaction status to 'overdue' if due date has passed
const updateOverdueTransactions = async () => {
  try {
    const now = new Date();
    
    // Find transactions that are borrowed and past due date
    const result = await Transaction.updateMany(
      { 
        status: 'borrowed',
        dueDate: { $lt: now }
      },
      { 
        $set: { status: 'overdue' }
      }
    );
    
    if (result.modifiedCount > 0) {
      logger.info(`Updated ${result.modifiedCount} transactions to 'overdue' status`);
    } else {
      logger.info('No transactions needed to be updated to overdue status');
    }
    
    return {
      success: true,
      updatedCount: result.modifiedCount
    };
  } catch (error) {
    logger.error('Error updating overdue transactions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Main function to check due books and send notifications
const checkDueBooks = async () => {
  try {
    // Step 1: Update transaction status for overdue books
    const updateResult = await updateOverdueTransactions();
    
    // Step 2: Send email notifications
    const notificationResult = await notifyUsers.sendDueBookReminders(3); // Notify for books due within 3 days
    
    return {
      success: true,
      statusUpdates: updateResult,
      notifications: notificationResult
    };
  } catch (error) {
    logger.error('Error in checkDueBooks job:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// If run directly (node checkDueBooks.js)
if (require.main === module) {
  // Connect to MongoDB
  const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms";
  
  mongoose.connect(mongoURI)
    .then(async () => {
      logger.info('MongoDB connected for due books check');
      
      try {
        // Run the check
        const result = await checkDueBooks();
        logger.info('Due books check completed:', result);
      } catch (error) {
        logger.error('Failed to complete due books check:', error);
      } finally {
        // Close database connection
        mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }
    })
    .catch(err => {
      logger.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

// To be used when imported as a module
module.exports = {
  checkDueBooks,
  updateOverdueTransactions,
  
  // Schedule the job with a cron expression
  schedule: (cronExpression = '0 9 * * *') => { // Default: Run daily at 9am
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression: ${cronExpression}`);
      return null;
    }
    
    logger.info(`Scheduling due books check with cron: ${cronExpression}`);
    
    return cron.schedule(cronExpression, async () => {
      logger.info('Running scheduled due books check');
      await checkDueBooks();
    });
  }
}; 