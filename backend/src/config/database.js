const mongoose = require('mongoose');
const path = require('path');

// 🔒 Force-load env here as well (important)
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    console.log('DEBUG Mongo URI:', mongoUri ? 'Found' : 'undefined');

    if (!mongoUri) {
      throw new Error('MONGODB_URI is undefined');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
      family: 4, // Force IPv4
    });

    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error Details:');
    console.error('Error Object:', error); // Log the full error object
    
    // Don't exit immediately in dev, it's annoying for the AI assistant
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Server exiting due to DB connection failure in production.');
      process.exit(1);
    }
  }
};

module.exports = { connectDB };

