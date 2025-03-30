const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Fix ISBN field names
async function fixIsbnFields() {
    try {
        const conn = await connectDB();
        
        // Access the raw collection to bypass Mongoose validation
        const booksCollection = conn.connection.db.collection('books');
        
        console.log('Dropping existing isbn index...');
        try {
            await booksCollection.dropIndex('isbn_1');
            console.log('Successfully dropped existing index.');
        } catch (err) {
            console.log('No existing index found or error dropping index:', err.message);
        }
        
        console.log('Migrating ISBN field to isbn...');
        await booksCollection.updateMany(
            { ISBN: { $exists: true } },
            [{ $set: { isbn: '$ISBN' } }]
        );
        
        console.log('Removing old ISBN field...');
        await booksCollection.updateMany(
            { ISBN: { $exists: true } },
            { $unset: { ISBN: 1 } }
        );
        
        console.log('Creating new unique index on isbn field...');
        await booksCollection.createIndex({ isbn: 1 }, { unique: true });
        
        console.log('Migration complete!');
        
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the migration
fixIsbnFields(); 