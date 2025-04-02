/**
 * This script checks for expired reservations and updates their status
 * It can be run on a schedule (e.g., every hour) using a cron job
 * 
 * Example cron entry (run every hour):
 * 0 * * * * node /path/to/backend/scripts/checkExpiredReservations.js
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Connect to the database
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import models
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');

// Run the check
const checkExpiredReservations = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Database connected successfully');

    console.log('Checking for expired reservations...');
    
    const now = new Date();
    
    // Find all active reservations that have expired
    const expiredReservations = await Reservation.find({
      status: 'active',
      expiresAt: { $lt: now }
    });
    
    if (expiredReservations.length === 0) {
      console.log('No expired reservations found.');
      process.exit(0);
    }
    
    console.log(`Found ${expiredReservations.length} expired reservations.`);
    
    // Update each expired reservation and corresponding book
    for (const reservation of expiredReservations) {
      // Update reservation status to 'expired'
      reservation.status = 'expired';
      await reservation.save();
      
      // Update book status back to 'Available'
      await Book.findByIdAndUpdate(reservation.book, { status: 'Available' });
      
      console.log(`Expired reservation for book ID ${reservation.book} by user ID ${reservation.user}`);
    }
    
    console.log(`Successfully expired ${expiredReservations.length} reservations.`);
    process.exit(0);
  } catch (error) {
    console.error('Error checking for expired reservations:', error);
    process.exit(1);
  }
};

// Run the function
checkExpiredReservations(); 