const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('../models/Category');
const connectDB= require('../config/db');

const defaultCategories = [
    { name: 'Fiction', description: 'Fictional literature and novels' },
    { name: 'Non-Fiction', description: 'Non-fictional books and literature' },
    { name: 'Science', description: 'Scientific books and research materials' },
    { name: 'Technology', description: 'Books about technology and computing' },
    { name: 'History', description: 'Historical books and documents' },
    { name: 'Philosophy', description: 'Books about philosophy and thinking' },
    { name: 'Biography', description: 'Biographical books and memoirs' },
    { name: 'Business', description: 'Books about business and economics' },
    { name: 'Art', description: 'Books about art and creativity' },
    { name: 'Reference', description: 'Reference books and materials' }
];

async function createDefaultCategories() {
    try {
        // Connect to MongoDB
        connectDB()
        console.log('Connected to MongoDB');

        // Create categories
        for (const category of defaultCategories) {
            await Category.findOneAndUpdate(
                { name: category.name },
                category,
                { upsert: true, new: true }
            );
        }

        console.log('Default categories created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating default categories:', error);
        process.exit(1);
    }
}

createDefaultCategories(); 