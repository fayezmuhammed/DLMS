const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function deleteAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete admin user
        const result = await User.deleteOne({ email: 'fayezmuhammed24@gmail.com' });
        if (result.deletedCount > 0) {
            console.log('Admin user deleted successfully');
        } else {
            console.log('Admin user not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error deleting admin user:', error);
        process.exit(1);
    }
}

deleteAdminUser(); 