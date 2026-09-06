/**
 * Cron Jobs Script - MVP
 * 
 * Run scheduled tasks:
 * 1. Cleanup expired stock reservations
 * 2. Mark abandoned carts
 * 
 * Usage:
 * - Run manually: node src/scripts/cron-jobs.js
 * - Run on schedule using cron or task scheduler
 * 
 * Recommended Schedule:
 * - Every 5 minutes
 */

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const mongoose = require('mongoose');
const OrderService = require('../services/order.service');
const CartService = require('../services/cart.service');

const runCronJobs = async () => {
  try {
    console.log('==========================================');
    console.log('GadgetHub - Cron Jobs');
    console.log('Started at:', new Date().toISOString());
    console.log('==========================================');

    // Connect to database
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');

    // Task 1: Cleanup expired stock reservations
    console.log('\n📦 Cleaning up expired stock reservations...');
    const cleanupResult = await OrderService.cleanupExpiredReservations();
    
    if (cleanupResult.success) {
      console.log(`✅ Cleaned up ${cleanupResult.cleanedCount} expired reservations`);
    } else {
      console.log('⚠️ Failed to cleanup reservations:', cleanupResult.message);
    }

    // Task 2: Mark abandoned carts
    console.log('\n🛒 Marking abandoned carts...');
    const abandonedResult = await CartService.markAbandonedCarts(24);
    
    if (abandonedResult.success) {
      console.log(`✅ Marked ${abandonedResult.markedCount} carts as abandoned`);
    } else {
      console.log('⚠️ Failed to mark abandoned carts:', abandonedResult.message);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\n==========================================');
    console.log('Cron jobs completed successfully');
    console.log('Finished at:', new Date().toISOString());
    console.log('==========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cron jobs failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

runCronJobs();