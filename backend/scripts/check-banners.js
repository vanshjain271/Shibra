const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Banner = require('../src/models/Banner');

async function checkBanners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const banners = await Banner.find({});
    console.log('--- BANNERS IN DATABASE ---');
    if (banners.length === 0) {
      console.log('No banners found in the database.');
    } else {
      banners.forEach((b, idx) => {
        console.log(`${idx + 1}. ID: ${b._id} | Title: "${b.title}" | Placement: "${b.placement}" | Active: ${b.isActive}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
checkBanners();
