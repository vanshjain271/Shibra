const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkRawBanners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check banners collection
    const banners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log('\nRaw banners in DB:', banners.length);
    banners.forEach((b, idx) => {
      console.log(`${idx + 1}. ID: ${b._id} | Title: "${b.title}" | Placement: "${b.placement}" | isActive: ${b.isActive}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
checkRawBanners();
