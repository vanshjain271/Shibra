const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Category = require('../src/models/Category');

async function deleteCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');
    
    const countBefore = await Category.countDocuments();
    console.log(`Categories count before deletion: ${countBefore}`);
    
    const result = await Category.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} categories.`);
    
    const countAfter = await Category.countDocuments();
    console.log(`Categories count after deletion: ${countAfter}`);
  } catch (err) {
    console.error('Error deleting categories:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deleteCategories();
