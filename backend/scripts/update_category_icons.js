const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const Category = require('../src/models/Category');

const iconMapping = {
  'Mobile Accessories': 'smartphone',
  'Chargers & Adapters': 'power',
  'TWS Earbuds': 'earbuds',
  'Neckbands': 'headphones',
  'Smart Watches': 'watch',
  'Power Banks': 'battery_charging_full',
  'Phone Cases': 'phone_iphone',
  'Screen Protectors': 'security',
  'Data Cables': 'usb',
  'Car Accessories': 'directions_car',
  'Speakers': 'speaker',
  'Computer Accessories': 'computer',
  'Deals of the Day': 'local_offer'
};

async function updateCategoryIcons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let updatedCount = 0;
    
    for (const [name, icon] of Object.entries(iconMapping)) {
      const result = await Category.updateOne({ name }, { $set: { icon } });
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`Updated icon for ${name} to ${icon}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} categories.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating category icons:', error);
    process.exit(1);
  }
}

updateCategoryIcons();
