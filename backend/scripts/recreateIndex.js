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

// Fix ISBN index issues
async function fixIndexIssues() {
    try {
        const conn = await connectDB();
        
        // Access the raw collection to bypass Mongoose validation
        const booksCollection = conn.connection.db.collection('books');
        
        // Get all books
        const books = await booksCollection.find({}).toArray();
        console.log(`Found ${books.length} books in the collection.`);
        
        // Drop all indexes except _id
        console.log('Dropping all indexes...');
        try {
            const indexes = await booksCollection.indexes();
            for (const index of indexes) {
                if (index.name !== '_id_') {
                    await booksCollection.dropIndex(index.name);
                    console.log(`Dropped index: ${index.name}`);
                }
            }
        } catch (err) {
            console.log('Error dropping indexes:', err.message);
        }
        
        // Make sure all books have an isbn field that's not null
        console.log('Updating any null isbn values...');
        let count = 0;
        for (const book of books) {
            if (!book.isbn || book.isbn.trim() === '') {
                count++;
                // Generate a unique placeholder ISBN
                const uniqueISBN = `TEMP-${Date.now()}-${count}`;
                await booksCollection.updateOne(
                    { _id: book._id },
                    { $set: { isbn: uniqueISBN } }
                );
                console.log(`Updated book ${book._id} with temporary ISBN: ${uniqueISBN}`);
            }
        }
        
        // Create a new index with sparse option
        console.log('Creating new unique index on isbn field with sparse option...');
        await booksCollection.createIndex(
            { isbn: 1 }, 
            { 
                unique: true, 
                sparse: true,  // Ignore documents where isbn is null
                background: true 
            }
        );
        
        console.log('Index recreation complete!');
        
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
fixIndexIssues(); 