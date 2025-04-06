const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting migration...');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('MongoDB connected...'); 
    
    try {
        // Find all users with null admissionNumbers
        const users = await User.find({ admissionNumber: null });
        console.log(`Found ${users.length} users with null admissionNumber`);
        
        // For each user except the first one, set a unique temporary admissionNumber
        for (let i = 1; i < users.length; i++) {
            const user = users[i];
            const tempAdmissionNumber = `TEMP-${user._id}`;
            
            // Update user
            await User.findByIdAndUpdate(user._id, { 
                admissionNumber: tempAdmissionNumber 
            });
            
            console.log(`Updated user ${user.email} with temporary admissionNumber: ${tempAdmissionNumber}`);
        }
        
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
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