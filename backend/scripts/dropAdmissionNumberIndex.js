const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.g45sf.mongodb.net/lms", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('MongoDB connected...'); 
    
    try {
        // Drop the index on admissionNumber field
        console.log('Dropping admissionNumber index...');
        await mongoose.connection.db.collection('users').dropIndex('admissionNumber_1');
        console.log('Index dropped successfully!');
    } catch (error) {
        console.error('Error dropping index:', error.message);
        if (error.code === 27) {
            console.log('Index does not exist, nothing to drop.');
        }
    } finally {
        // Close connection
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
}); 