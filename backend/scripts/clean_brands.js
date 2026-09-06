const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const Product = require('../src/models/Product');

async function cleanBrands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find products where brand is an ObjectId or looks like one
    const products = await Product.find({
      $or: [
        { brand: { $type: "objectId" } },
        { brand: { $regex: /^[0-9a-fA-F]{24}$/ } }
      ]
    });
    console.log(`Found ${products.length} products with legacy ObjectId brands.`);

    let updatedCount = 0;
    for (const product of products) {
      product.brand = 'Dummy Brand'; // Replace with a generic string
      await product.save();
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning brands:', error);
    process.exit(1);
  }
}

cleanBrands();
