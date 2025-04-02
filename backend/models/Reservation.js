const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Set expiration to 24 hours from now
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'completed', 'cancelled'],
    default: 'active'
  }
});

// Ensure a user can only have one active reservation for a book
ReservationSchema.index({ user: 1, book: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

module.exports = mongoose.model('Reservation', ReservationSchema); 