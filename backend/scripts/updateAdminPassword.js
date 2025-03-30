const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            adminUser.password = 'admin123';
            await adminUser.save();
            console.log('Admin password updated successfully');
        } else {
            console.log('No admin user found in the database');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

updateAdminPassword(); 