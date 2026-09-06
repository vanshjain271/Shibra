/**
 * Cart Controller - MVP
 */

const CartService = require('../services/cart.service');

/**
 * @desc    Get user's cart
 * @route   GET /api/v1/cart
 * @access  Buyer
 */
const getCart = async (req, res) => {
  try {
    const result = await CartService.getCart(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      cart: result.cart
    });
  } catch (error) {
    console.error('Get Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching cart'
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/items
 * @access  Buyer
 * @body    { productId, variantId?, quantity, lotType }
 */
const addItem = async (req, res) => {
  try {
    const { productId, variantId, quantity, lotType, selectedModel } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const result = await CartService.addItem(
      req.user.userId,
      productId,
      variantId || null,
      parseInt(quantity),
      lotType,
      selectedModel || null
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: result.cart
    });
  } catch (error) {
    console.error('Add Item to Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while adding item to cart'
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/v1/cart/items/:itemId
 * @access  Buyer
 * @body    { quantity }
 */
const updateItemQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const result = await CartService.updateItemQuantity(
      req.user.userId,
      itemId,
      parseInt(quantity)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart: result.cart
    });
  } catch (error) {
    console.error('Update Cart Item Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating cart item'
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/items/:itemId
 * @access  Buyer
 */
const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const result = await CartService.removeItem(req.user.userId, itemId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: result.cart
    });
  } catch (error) {
    console.error('Remove Cart Item Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while removing item from cart'
    });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/v1/cart
 * @access  Buyer
 */
const clearCart = async (req, res) => {
  try {
    const result = await CartService.clearCart(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while clearing cart'
    });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
};