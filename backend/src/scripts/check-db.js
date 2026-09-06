const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Category = require('../models/Category');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Product = require('../models/Product');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Categories:', await Category.countDocuments());
  console.log('Brands:', await Brand.countDocuments());
  console.log('Users:', await User.countDocuments());
  console.log('Products:', await Product.countDocuments());
  
  const cats = await Category.find().limit(5);
  console.log('Sample Categories:', cats.map(c => ({ name: c.name, id: c._id })));
  
  await mongoose.disconnect();
}

check().catch(console.error);
