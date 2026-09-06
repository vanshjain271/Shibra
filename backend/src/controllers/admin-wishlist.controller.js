const User = require('../models/User');

/**
 * Get all users with their wishlists populated
 */
const getWishlists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find users who have at least one item in their wishlist
    const users = await User.find({ 'wishlist.0': { $exists: true } })
      .select('name phone email wishlist')
      .populate('wishlist', 'name images mrp salePrice sku colors sizes attributes')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ 'wishlist.0': { $exists: true } });

    // Format the response
    const wishlists = users.map(user => {
      let totalAmount = 0;
      const items = user.wishlist.map(product => {
        // Calculate total amount assuming quantity is 1 for wishlist items
        const price = product.salePrice || product.mrp || 0;
        totalAmount += price;
        return {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          colors: product.colors,
          sizes: product.sizes,
          attributes: product.attributes,
          image: product.images && product.images.length > 0 ? (product.images[0].url || product.images[0]) : null,
          price: price,
        };
      });

      return {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
        items,
        totalAmount,
      };
    });

    res.json({
      success: true,
      wishlists,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get admin wishlists:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getWishlists
};
