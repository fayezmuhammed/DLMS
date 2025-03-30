const mongoose = require('mongoose');
require('dotenv').config();

// Create Student Schema
const studentSchema = new mongoose.Schema({
    admnNo: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    }
});

const Student = mongoose.model('Student', studentSchema);

async function createTestStudent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create test student
        const testStudent = new Student({
            admnNo: 'STU001',
            name: 'John Doe',
            batch: '2023-2024',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890'
        });

        await testStudent.save();
        console.log('Test student created successfully');
        console.log('Admission Number:', testStudent.admnNo);
        process.exit(0);
    } catch (error) {
        console.error('Error creating test student:', error);
        process.exit(1);
    }
}

createTestStudent(); 