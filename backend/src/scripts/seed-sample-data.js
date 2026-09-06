/**
 * Seed Sample Data for Testing
 * 
 * Run: node src/scripts/seed-sample-data.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

async function seedSampleData() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const User = require('../models/User');
        const Product = require('../models/Product');
        const Order = require('../models/Order');
        const Coupon = require('../models/Coupon');
        const Banner = require('../models/Banner');
        const bcrypt = require('bcryptjs');

        // 1. Create Sample Customers/Buyers
        console.log('\n📦 Creating sample customers...');
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
            },
            {
                name: 'Amit Patel',
                email: 'amit@example.com',
                phone: '9876543212',
                password: await bcrypt.hash('password123', 10),
                role: 'BUYER',
                isActive: true,
                addresses: [{
                    name: 'Amit Patel',
                    phone: '9876543212',
                    addressLine1: '78 Electronics Hub',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    pincode: '380001'
                }]
            }
        ];

        let createdCustomers = [];
        for (const customer of sampleCustomers) {
            const existing = await User.findOne({ email: customer.email });
            if (!existing) {
                const created = await User.create(customer);
                createdCustomers.push(created);
                console.log(`   ✅ Created customer: ${customer.name}`);
            } else {
                createdCustomers.push(existing);
                console.log(`   ⏭️  Customer exists: ${customer.name}`);
            }
        }

        // 2. Get products for orders
        const products = await Product.find({ isActive: true }).limit(5);
        if (products.length === 0) {
            console.log('   ⚠️ No products found. Run seed-products first.');
            process.exit(1);
        }

        // 3. Create Sample Orders
        console.log('\n📋 Creating sample orders...');
        const orderStatuses = ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

        for (let i = 0; i < 8; i++) {
            const customer = createdCustomers[i % createdCustomers.length];
            const numItems = Math.floor(Math.random() * 3) + 1;
            const orderItems = [];
            let subtotal = 0;

            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 5) + 1;
                const salePrice = product.salePrice || product.mrp;
                const itemTotal = salePrice * qty;
                subtotal += itemTotal;

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    sku: product.sku || '',
                    quantity: qty,
                    price: salePrice,
                    mrp: product.mrp,
                    total: itemTotal
                });
            }

            const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            const orderNumber = await Order.generateOrderNumber();

            const existingOrder = await Order.findOne({ orderNumber });
            if (!existingOrder) {
                await Order.create({
                    orderNumber,
                    user: customer._id,
                    items: orderItems,
                    subtotal,
                    totalAmount: subtotal,
                    status,
                    shippingAddress: customer.addresses[0],
                    payment: {
                        mode: 'FULL_PAYMENT',
                        amountPaid: status === 'DELIVERED' ? subtotal : 0,
                        paidAt: status === 'DELIVERED' ? new Date() : null
                    }
                });
                console.log(`   ✅ Created order: ${orderNumber} (${status})`);
            }
        }

        // 4. Create Sample Coupons
        console.log('\n🎫 Creating sample coupons...');
        const sampleCoupons = [
            {
                code: 'WELCOME10',
                description: '10% off for new customers',
                type: 'PERCENTAGE',
                value: 10,
                minOrderAmount: 500,
                maxDiscountAmount: 200,
                usageLimit: 100,
                usageCount: 5,
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                isActive: true
            },
            {
                code: 'FLAT100',
                description: 'Flat ₹100 discount on orders above ₹999',
                type: 'FIXED',
                value: 100,
                minOrderAmount: 999,
                usageLimit: 50,
                usageCount: 12,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true
            },
            {
                code: 'BULK20',
                description: '20% off on orders above ₹5000',
                type: 'PERCENTAGE',
                value: 20,
                minOrderAmount: 5000,
                maxDiscountAmount: 1500,
                usageLimit: 20,
                usageCount: 3,
                startDate: new Date(),
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                isActive: true
            }
        ];

        for (const coupon of sampleCoupons) {
            const existing = await Coupon.findOne({ code: coupon.code });
            if (!existing) {
                await Coupon.create(coupon);
                console.log(`   ✅ Created coupon: ${coupon.code}`);
            } else {
                console.log(`   ⏭️  Coupon exists: ${coupon.code}`);
            }
        }

        // 5. Create Sample Banners
        console.log('\n🖼️  Creating sample banners...');
        const sampleBanners = [
            {
                title: 'Summer Sale - Up to 50% Off!',
                description: 'Shop phone accessories at amazing discounts',
                image: 'https://placehold.co/1200x400/3B82F6/ffffff?text=Summer+Sale+50%25+Off',
                linkType: 'URL',
                linkTarget: '/products?category=phone-accessories',
                placement: 'HOME_TOP',
                sortOrder: 1,
                isActive: true
            },
            {
                title: 'New Arrivals',
                description: 'Check out our latest products',
                image: 'https://placehold.co/1200x400/10B981/ffffff?text=New+Arrivals',
                linkType: 'URL',
                linkTarget: '/products?sort=newest',
                placement: 'HOME_TOP',
                sortOrder: 2,
                isActive: true
            },
            {
                title: 'Free Shipping on Orders Above ₹999',
                description: 'Limited time offer',
                image: 'https://placehold.co/1200x200/F59E0B/ffffff?text=Free+Shipping+%E2%82%B9999%2B',
                linkType: 'URL',
                linkTarget: '/products',
                placement: 'HOME_MIDDLE',
                sortOrder: 1,
                isActive: true
            }
        ];

        for (const banner of sampleBanners) {
            const existing = await Banner.findOne({ title: banner.title });
            if (!existing) {
                await Banner.create(banner);
                console.log(`   ✅ Created banner: ${banner.title}`);
            } else {
                console.log(`   ⏭️  Banner exists: ${banner.title}`);
            }
        }

        console.log('\n✅ Sample data seeding complete!');
        console.log(`   - Customers: ${createdCustomers.length}`);
        console.log('   - Orders: 8');
        console.log('   - Coupons: 3');
        console.log('   - Banners: 3');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedSampleData();
