/**
 * GadgetHub Invoice Seeding Script
 * Generates invoices for all existing orders
 */

const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env'),
});

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Invoice = require('../models/invoice');
const User = require('../models/User');
const InvoiceService = require('../services/invoice.service');

const seedInvoices = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders. Generating invoices...`);

        for (const order of orders) {
            // Temporarily set to CONFIRMED to allow generation
            const originalStatus = order.status;
            if (originalStatus !== 'CONFIRMED') {
                order.status = 'CONFIRMED';
                await order.save();
            }

            const result = await InvoiceService.generateInvoice(order._id);
            if (result.success) {
                console.log(`   ✅ Generated invoice for order ${order.orderNumber}`);
            } else {
                console.log(`   ❌ Failed for order ${order.orderNumber}: ${result.message}`);
            }

            // Restore original status
            if (originalStatus !== 'CONFIRMED') {
                order.status = originalStatus;
                await order.save();
            }
        }

        console.log('✅ Invoice seeding complete!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Invoice seeding failed:', error);
        process.exit(1);
    }
};

seedInvoices();
