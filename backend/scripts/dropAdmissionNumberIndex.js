const mongoose = require('mongoose');
require('dotenv').config();

console.log('Attempting to drop admissionNumber index...');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    try {
        console.log('Connected to MongoDB');
        
        // Drop the index
        await mongoose.connection.db.collection('users').dropIndex('admissionNumber_1');
        console.log('Successfully dropped admissionNumber index');

    } catch (err) {
        if (err.code === 27) {
            console.log('Index does not exist - nothing to drop');
        } else {
            console.error('Error:', err);
        }
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});