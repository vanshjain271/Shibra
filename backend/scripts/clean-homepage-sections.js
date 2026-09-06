require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function clean() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const products = await Product.find({ homepageSections: { $exists: true, $not: { $size: 0 } } });
    console.log(`Found ${products.length} products with homepageSections`);

    let updatedCount = 0;

    for (const product of products) {
      let changed = false;
      const newSections = [];

      for (const section of product.homepageSections) {
        if (section.includes(',')) {
          // It's a huge SEO string, just take the first part
          newSections.push(section.split(',')[0].trim());
          changed = true;
        } else if (section.length > 50) {
          // Too long even without commas, truncate it
          newSections.push(section.substring(0, 50).trim());
          changed = true;
        } else {
          newSections.push(section);
        }
      }

      if (changed) {
        // Remove duplicates just in case
        product.homepageSections = [...new Set(newSections)];
        await product.save();
        updatedCount++;
        console.log(`Updated product: ${product.name}`);
      }
    }

    console.log(`Successfully cleaned homepageSections for ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clean();
