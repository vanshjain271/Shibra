const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('../src/models/Product');
const User = require('../src/models/User');

async function checkSamples() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({}, 'name sku price created_at').limit(40);
    console.log('--- PRODUCTS IN DB ---');
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. Name: "${p.name}" | SKU: "${p.sku}"`);
    });
    
    const users = await User.find({}, 'name phone role').limit(20);
    console.log('\n--- USERS IN DB ---');
    users.forEach((u, idx) => {
      console.log(`${idx + 1}. Name: "${u.name}" | Phone: "${u.phone}" | Role: "${u.role}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
checkSamples();
