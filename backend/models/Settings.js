const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // General settings
  libraryName: {
    type: String,
    default: 'Digital Library Management System'
  },
  email: {
    type: String,
    default: 'admin@library.com'
  },
  phone: {
    type: String,
    default: '+1 (555) 123-4567'
  },
  address: {
    type: String,
    default: '123 Library Street, Bookville, BK 12345'
  },

  // Borrowing rules
  maxBooksStudent: {
    type: Number,
    default: 3,
    min: 1
  },
  maxBooksTeacher: {
    type: Number,
    default: 5,
    min: 1
  },
  maxDaysStudent: {
    type: Number,
    default: 14,
    min: 1
  },
  maxDaysTeacher: {
    type: Number,
    default: 30,
    min: 1
  },
  finePerDay: {
    type: Number,
    default: 0.5,
    min: 0
  },

  // Notification settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  dueDateReminders: {
    type: Boolean,
    default: true
  },
  overdueNotifications: {
    type: Boolean,
    default: true
  },
  newBookNotifications: {
    type: Boolean,
    default: false
  },

  // Meta data
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// There should only be one settings document
settingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // If no settings document exists, create one with default values
  return await this.create({});
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 