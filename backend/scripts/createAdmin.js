const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdminUser() {
    try {
        await mongoose.connect("mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms");
        console.log('Connected to MongoDB');

        // Force remove any existing admin user
        await User.deleteOne({ email: 'admin@admin.com' });
        console.log('Cleared any existing admin user');

        // Simple credentials for testing
        const adminEmail = 'admin@admin.com';
        const adminPassword = 'admin123'; // simpler password

        // Use consistent salt rounds
        const salt = await bcrypt.genSalt(12); // use specific salt rounds
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = new User({
            name: 'Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });

        await adminUser.save();

        // Verify the user was created correctly
        const verifyUser = await User.findOne({ email: adminEmail });
        if (!verifyUser) {
            throw new Error('Failed to create admin user');
        }

        // Verify password hash works
        const isMatch = await bcrypt.compare(adminPassword, verifyUser.password);
        if (!isMatch) {
            throw new Error('Password hash verification failed');
        }

        console.log('Admin user created and verified:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('Role:', verifyUser.role);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createAdminUser();