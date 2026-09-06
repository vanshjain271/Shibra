const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Banner = require('../src/models/Banner');

async function deleteBanners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');
    
    const countBefore = await Banner.countDocuments();
    console.log(`Banners count before deletion: ${countBefore}`);
    
    const result = await Banner.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} banners.`);
    
    const countAfter = await Banner.countDocuments();
    console.log(`Banners count after deletion: ${countAfter}`);
  } catch (err) {
    console.error('Error deleting banners:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deleteBanners();
