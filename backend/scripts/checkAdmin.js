const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            console.log('Admin user found:', {
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role
            });
        } else {
            console.log('No admin user found in the database');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkAdmin(); 