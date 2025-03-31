const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function createAdminUser() {
    try {
        await mongoose.connect("mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms");
        console.log('Connected to MongoDB');

        // Force remove any existing admin user
        await User.deleteOne({ email: 'fayezmuhammed24@gmail.com' });
        console.log('Cleared any existing admin user');

        // Simple credentials for testing
        const adminEmail = 'fayezmuhammed24@gmail.com';
        const adminPassword = 'fayez123';

        // Create admin user - let the model pre-save hook handle password hashing
        const adminUser = new User({
            name: 'Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isVerified: true, // Admin is automatically verified
            createdAt: new Date()
        });

        await adminUser.save();

        // Verify the user was created correctly
        const verifyUser = await User.findOne({ email: adminEmail });
        if (!verifyUser) {
            throw new Error('Failed to create admin user');
        }

        console.log('Admin user created and verified:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('Role:', verifyUser.role);
        console.log('Verified:', verifyUser.isVerified);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createAdminUser();