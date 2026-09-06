/**
 * GadgetHub - Admin Seed Script
 * Creates initial ADMIN user with email/password for admin panel login
 */

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

console.log('==========================================');
console.log('GadgetHub - Admin Seed Script');
console.log('==========================================');

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@shibra.in';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_PHONE = '9999999999';
const ADMIN_NAME = 'Shibra Admin';

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if admin exists by email or phone
    let admin = await User.findOne({
      $or: [{ email: ADMIN_EMAIL }, { phone: ADMIN_PHONE }]
    });

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (admin) {
      console.log('⚠️ Admin exists, updating credentials...');
      admin.email = ADMIN_EMAIL;
      admin.password = hashedPassword;
      admin.role = 'ADMIN';
      admin.isActive = true;
      admin.permissions = [
        'products.view', 'products.manage',
        'orders.view', 'orders.manage',
        'invoices.view', 'invoices.manage',
        'customers.view', 'customers.manage',
        'reports.view',
        'settings.manage',
        'coupons.view', 'coupons.manage',
        'brands.view', 'brands.manage',
        'categories.view', 'categories.manage'
      ];
      await admin.save();
    } else {
      console.log('Creating new admin...');
      admin = await User.create({
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
      });
    }

    console.log('✅ Admin ready!');
    console.log('------------------------------------------');
    console.log('LOGIN CREDENTIALS:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed script failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
