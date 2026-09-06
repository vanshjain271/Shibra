/**
 * GadgetHub Master Seed Script
 * 
 * Seeds: Categories, Brands, Products, Admin, Customers, and Orders
 */

const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env'),
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');

const ADMIN_EMAIL = 'admin@gadgethub.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_PHONE = '9999999999';
const ADMIN_NAME = 'GadgetHub Admin';

const seedMaster = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Clear Existing Data (Optional but recommended for a clean test)
        console.log('Cleaning existing data...');
        // await Category.deleteMany({});
        // await Brand.deleteMany({});
        // await Product.deleteMany({});
        // await Order.deleteMany({});
        // await User.deleteMany({ role: { $ne: 'ADMIN' } });

        // 2. Seed Admin
        console.log('Seeding Admin...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        let admin = await User.findOne({ email: ADMIN_EMAIL });
        const adminData = {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            phone: ADMIN_PHONE,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
            permissions: [
                'products.view', 'products.manage',
                'orders.view', 'orders.manage',
                'invoices.view', 'invoices.manage',
                'customers.view', 'customers.manage',
                'reports.view',
                'settings.manage',
                'coupons.view', 'coupons.manage',
                'brands.view', 'brands.manage',
                'categories.view', 'categories.manage'
            ]
        };

        if (admin) {
            console.log('   Updating admin...');
            await User.updateOne({ _id: admin._id }, adminData);
        } else {
            console.log('   Creating new admin...');
            await User.create(adminData);
        }

        // 3. Seed Categories
        console.log('Seeding Categories...');
        const categories = [
            { name: 'Smartphones', description: 'Latest mobile phones' },
            { name: 'Laptops', description: 'Laptops and notebooks' },
            { name: 'Accessories', description: 'Cases, cables, and more' },
            { name: 'Tablets', description: 'Tablets and iPads' }
        ];

        const createdCategories = [];
        for (const cat of categories) {
            let existing = await Category.findOne({ name: cat.name });
            if (!existing) {
                existing = await Category.create(cat);
                console.log(`   Created category: ${cat.name}`);
            }
            createdCategories.push(existing);
        }

        // 4. Seed Brands
        console.log('Seeding Brands...');
        const brands = [
            { name: 'Apple', description: 'Premium tech' },
            { name: 'Samsung', description: 'Innovation at its best' },
            { name: 'Xiaomi', description: 'Smart technology for everyone' },
            { name: 'Dell', description: 'The power to do more' }
        ];

        const createdBrands = [];
        for (const brand of brands) {
            let existing = await Brand.findOne({ name: brand.name });
            if (!existing) {
                existing = await Brand.create(brand);
                console.log(`   Created brand: ${brand.name}`);
            }
            createdBrands.push(existing);
        }

        // 5. Seed Products
        console.log('Seeding Products...');
        const products = [
            {
                name: 'iPhone 15 Pro',
                sku: 'IP15P-128-BLK',
                salePrice: 129900,
                mrp: 134900,
                stock: 50,
                category: createdCategories[0]._id,
                brand: createdBrands[0]._id,
                description: 'Titanium design, A17 Pro chip',
                tags: ['apple', 'iphone', 'ios']
            },
            {
                name: 'Galaxy S24 Ultra',
                sku: 'GS24U-256-GRY',
                salePrice: 119900,
                mrp: 129900,
                stock: 30,
                category: createdCategories[0]._id,
                brand: createdBrands[1]._id,
                description: 'Galaxy AI is here',
                tags: ['samsung', 'galaxy', 'android']
            },
            {
                name: 'MacBook Air M3',
                sku: 'MBA-M3-8-256',
                salePrice: 114900,
                mrp: 114900,
                stock: 20,
                category: createdCategories[1]._id,
                brand: createdBrands[0]._id,
                description: 'Supercharged by M3',
                tags: ['apple', 'macbook', 'macos']
            },
            {
                name: 'XPS 13',
                sku: 'DELL-XPS13-9315',
                salePrice: 95000,
                mrp: 110000,
                stock: 15,
                category: createdCategories[1]._id,
                brand: createdBrands[3]._id,
                description: 'Stunning 13-inch laptop',
                tags: ['dell', 'xps', 'windows']
            }
        ];

        const createdProducts = [];
        for (const prod of products) {
            let existing = await Product.findOne({ sku: prod.sku });
            if (!existing) {
                existing = await Product.create(prod);
                console.log(`   Created product: ${prod.name}`);
            }
            createdProducts.push(existing);
        }

        // 6. Seed Customers
        console.log('Seeding Customers...');
        const sampleCustomers = [
            {
                name: 'Rahul Sharma',
                email: 'rahul@example.com',
                phone: '9876543210',
                password: await bcrypt.hash('password123', 10),
                role: 'BUYER',
                isActive: true,
                addresses: [{
                    name: 'Rahul Sharma',
                    phone: '9876543210',
                    addressLine1: '123 Market Street',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110001'
                }]
            },
            {
                name: 'Priya Singh',
                email: 'priya@example.com',
                phone: '9876543211',
                password: await bcrypt.hash('password123', 10),
                role: 'BUYER',
                isActive: true,
                addresses: [{
                    name: 'Priya Singh',
                    phone: '9876543211',
                    addressLine1: '45 Tech Plaza',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                }]
            }
        ];

        const createdCustomers = [];
        for (const customer of sampleCustomers) {
            let existing = await User.findOne({ email: customer.email });
            if (!existing) {
                existing = await User.create(customer);
                console.log(`   Created customer: ${customer.name}`);
            }
            createdCustomers.push(existing);
        }

        // 7. Seed Orders
        console.log('Seeding Orders...');
        const orderStatuses = ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

        for (let i = 0; i < 5; i++) {
            const customer = createdCustomers[i % createdCustomers.length];
            const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            const totalAmount = product.salePrice * qty;

            const orderNumber = `ORD${Date.now()}${i}`;

            await Order.create({
                orderNumber,
                user: customer._id,
                items: [{
                    product: product._id,
                    name: product.name,
                    sku: product.sku,
                    quantity: qty,
                    price: product.salePrice,
                    mrp: product.mrp,
                    total: totalAmount
                }],
                subtotal: totalAmount,
                totalAmount: totalAmount,
                status: orderStatuses[i % orderStatuses.length],
                shippingAddress: customer.addresses[0],
                payment: {
                    mode: 'FULL_PAYMENT',
                    amountPaid: (i % orderStatuses.length) >= 1 ? totalAmount : 0,
                    paidAt: (i % orderStatuses.length) >= 1 ? new Date() : null
                }
            });
            console.log(`   Created order: ${orderNumber}`);
        }

        console.log('✅ Seeding complete!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    }
};

seedMaster();
