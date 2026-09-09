const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Categories
    console.log('Seeding Categories...');
    const catMobiles = await Category.findOneAndUpdate({ slug: 'mobiles' }, {
      name: 'Mobile Phones', slug: 'mobiles', description: 'Smartphones',
      image: 'https://placehold.co/400x400/2563EB/FFFFFF?text=Mobiles', isActive: true
    }, { upsert: true, new: true });

    // 2. Brands
    console.log('Seeding Brands...');
    const brandApple = await Brand.findOneAndUpdate({ slug: 'apple' }, {
      name: 'Apple', slug: 'apple', description: 'Apple Inc.',
      logo: 'https://placehold.co/200x200/000000/FFFFFF?text=Apple', isActive: true
    }, { upsert: true, new: true });

    // 3. Products
    console.log('Seeding Products...');
    const prod = await Product.findOneAndUpdate({ slug: 'iphone-15-pro-max' }, {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'Latest Apple flagship',
        shortDescription: 'Titanium design',
        category: catMobiles._id,
        brand: brandApple._id,
        price: 130000,
        mrp: 140000,
        minQty: 1,
        salePrice: 130000,
        images: ['https://placehold.co/800x800/E2E8F0/1E293B?text=iPhone+15'],
        thumbnail: 'https://placehold.co/400x400/E2E8F0/1E293B?text=iPhone+15',
        stock: 50,
        sku: 'APL-IP15PM',
        isActive: true,
        isFeatured: true
    }, { upsert: true, new: true });

    // 4. Coupons
    console.log('Seeding Coupons...');
    await Coupon.findOneAndUpdate({ code: 'WELCOME50' }, {
      code: 'WELCOME50', description: 'Rs 50 off', discountType: 'flat', discountValue: 50, minOrderAmount: 500, isActive: true, expiryDate: new Date('2030-01-01')
    }, { upsert: true });

    // 5. Customers
    console.log('Seeding Customers...');
    const customer = await User.findOneAndUpdate({ email: 'customer@test.com' }, {
      name: 'Test Customer', email: 'customer@test.com', phone: '8888888888', role: 'CUSTOMER', isActive: true
    }, { upsert: true, new: true });

    // 6. Orders
    console.log('Seeding Orders...');
    const orderExists = await Order.findOne({ user: customer._id });
    if (!orderExists) {
      await Order.create({
        orderNumber: 'ORD-12345',
        user: customer._id,
        items: [{
            product: prod._id,
            name: prod.name,
            quantity: 1,
            price: prod.salePrice,
            mrp: prod.mrp,
            total: prod.salePrice,
            image: prod.thumbnail
        }],
        shippingAddress: {
          name: 'Test Customer', phone: '8888888888', addressLine1: '123 Test St', city: 'Mumbai', state: 'MH', pincode: '400001', country: 'India'
        },
        paymentMethod: 'COD', paymentStatus: 'pending', orderStatus: 'delivered', subtotal: prod.salePrice, totalAmount: prod.salePrice
      });
    }

    console.log('✅ Dummy data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
