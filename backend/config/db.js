const { JsonWebTokenError } = require('jsonwebtoken');
const mongoose = require('mongoose');

const connectDB = async () => {
    console.log(JsonWebTokenError)
    try {
        const conn = await mongoose.connect("mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms");
        console.log(`MongoDB Connected: ${conn.connection.host}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; // Example of correct MongoDB connection
