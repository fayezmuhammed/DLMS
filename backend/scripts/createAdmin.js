const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms");
        console.log('Connected to MongoDB');

        // Admin credentials
        // email: admin@dlms.com
        // password: Admin@123

        // Check if admin user already exists
        const adminExists = await User.findOne({ email: 'admin@dlms.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@dlms.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date()
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();