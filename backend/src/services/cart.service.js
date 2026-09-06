/**
 * Cart Service - MVP
 * 
 * Handles all cart business logic
 * - Add/update/remove items
 * - Get cart with enriched product data
 * - Abandoned cart detection
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const StoreSettings = require('../models/StoreSettings');

class CartService {
  /**
   * Get cart for user
   * Returns cart with enriched product data
   */
  async getCart(userId) {
    try {
      let cart = await Cart.findOrCreateByUser(userId);
      
      // Populate product details including taxRate, minOrderQty, and lotDetails
      await cart.populate({
        path: 'items.product',
        select: 'name slug images salePrice mrp stock hasVariants variants isActive bulkPricing taxRate minOrderQty isLot lotDetails'
      });

      // Enrich cart items with latest pricing and availability
      const enrichedItems = [];
      
      for (const item of cart.items) {
        if (!item.product || !item.product.isActive) {
          // Product no longer available - skip
          continue;
        }

        const product = item.product;
        let price = Number(product.salePrice) || 0;
        let mrp = Number(product.mrp) || 0;
        let stock = Number(product.stock) || 0;
        let available = true;
        let variantData = null;

        if (item.variant && product.hasVariants) {
          const variant = product.variants.id(item.variant);
          
          if (!variant || !variant.isActive) {
            available = false;
          } else {
            price = Number(variant.salePrice) || price;
            mrp = Number(variant.mrp) || mrp;
            stock = Number(variant.stock) || 0;
            variantData = {
              _id: variant._id,
              name: variant.name,
              sku: variant.sku,
              attributes: variant.attributes,
              images: variant.images
            };
          }
        }

        // Apply Bulk Pricing if available
        if (product.bulkPricing && product.bulkPricing.length > 0) {
          const applicableTier = [...product.bulkPricing]
            .sort((a, b) => b.minQty - a.minQty) // Sort by minQty descending
            .find(tier => Number(item.quantity) >= tier.minQty);
          
          if (applicableTier) {
            price = Number(applicableTier.salePrice);
          }
        }

        const itemQuantity = Number(item.quantity) || 0;
        let itemSubtotal = 0;

        // Apply Lot Pricing if product is a lot
        if (product.isLot && product.lotDetails) {
          if (product.lotDetails.allowHalfLot && itemQuantity === product.lotDetails.halfLotQuantity) {
            let totalHalfPrice = product.lotDetails.halfLotPrice;
            if (totalHalfPrice < product.salePrice * 0.1) totalHalfPrice *= product.lotDetails.halfLotQuantity;
            price = itemQuantity > 0 ? totalHalfPrice / itemQuantity : 0;
            itemSubtotal = totalHalfPrice;
            mrp = price; // Override MRP for lot items to avoid weird discounts
          } else if (product.lotDetails.allowMiniLot && itemQuantity === product.lotDetails.miniLotQuantity) {
            let totalMiniPrice = product.lotDetails.miniLotPrice;
            if (totalMiniPrice < product.salePrice * 0.1) totalMiniPrice *= product.lotDetails.miniLotQuantity;
            price = itemQuantity > 0 ? totalMiniPrice / itemQuantity : 0;
            itemSubtotal = totalMiniPrice;
            mrp = price;
          } else if (product.lotDetails.fullLotQuantity > 0) {
            let totalFullPrice = product.lotDetails.fullLotPrice;
            if (totalFullPrice < product.salePrice * 0.1) totalFullPrice *= product.lotDetails.fullLotQuantity;
            price = itemQuantity > 0 ? totalFullPrice / itemQuantity : 0;
            itemSubtotal = totalFullPrice;
            mrp = price;
          }
        } else {
          itemSubtotal = price * itemQuantity;
        }

        enrichedItems.push({
          _id: item._id,
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0] || '',
            isActive: product.isActive,
            taxRate: Number(product.taxRate) || 0,
            minOrderQty: Number(product.minOrderQty) || 1,
            isLot: product.isLot,
            lotDetails: product.lotDetails
          },
          variant: variantData,
          variantName: variantData?.name || null,
          selectedModel: item.selectedModel || null,
          lotType: item.lotType || 'none',
          quantity: itemQuantity,
          price,
          mrp,
          stock,
          available: available && stock >= itemQuantity,
          subtotal: itemSubtotal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
      }

      // Calculate totals with numeric safety
      const subtotal = enrichedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
      const taxTotal = enrichedItems.reduce((sum, item) => {
        const productTaxRate = Number(item.product?.taxRate) || 0;
        return sum + ((Number(item.subtotal) || 0) * productTaxRate) / 100;
      }, 0);
      
      const settings = await StoreSettings.getSettings();
      let shippingCharge = 0; 
      if (subtotal > 0 && subtotal < settings.freeDeliveryThreshold) {
        shippingCharge = settings.deliveryFee;
      }

      const discount = 0; 

      return {
        success: true,
        cart: {
          _id: cart._id,
          user: cart.user,
          items: enrichedItems,
          itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(taxTotal.toFixed(2)),
          shippingCharge: Number(shippingCharge.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          total: Number((subtotal + taxTotal + shippingCharge - discount).toFixed(2)),
          lastModified: cart.lastModified,
          isAbandoned: cart.isAbandoned
        }
      };
    } catch (error) {
      console.error('Get Cart Error:', error);
      return {
        success: false,
        message: 'Failed to fetch cart'
      };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(userId, productId, variantId, quantity, lotType = 'none', selectedModel = null) {
    try {
      // Validate product exists and is active
      const product = await Product.findById(productId);
      
      if (!product || !product.isActive) {
        return {
          success: false,
          message: 'Product not available'
        };
      }

      // Validate variant if specified
      let stock;
      
      if (variantId && product.hasVariants) {
        const variant = product.variants.id(variantId);
        
        if (!variant || !variant.isActive) {
          return {
            success: false,
            message: 'Variant not available'
          };
        }
        
        stock = variant.stock;
      } else if (variantId) {
        return {
          success: false,
          message: 'This product does not have variants'
        };
      } else {
        stock = product.stock;
      }
      
      // If a model is selected, validate its specific stock
      if (selectedModel && product.hasModels) {
        const model = product.availableModels.find(m => m.name === selectedModel);
        if (!model) {
          return { success: false, message: 'Selected model not available' };
        }
        stock = model.stock;
      }

      // Check stock availability
      const cart = await Cart.findOrCreateByUser(userId);
      
      // Calculate total quantity (existing + new)
      const variantIdStr = variantId ? variantId.toString() : null;
      const existingItem = cart.items.find(item => {
        const itemProductId = item.product.toString();
        const itemVariantId = item.variant ? item.variant.toString() : null;
        const itemSelectedModel = item.selectedModel || null;
        return itemProductId === productId.toString() && 
               itemVariantId === variantIdStr && 
               itemSelectedModel === selectedModel;
      });

      const totalQuantity = (existingItem?.quantity || 0) + quantity;

      if (!product.isLot && totalQuantity > stock) {
        return {
          success: false,
          message: `Insufficient stock. Only ${stock} units available.`
        };
      }

      // Check aggregate product quantity against MOQ
      const allProductItems = cart.items.filter(item => item.product.toString() === productId.toString());
      const aggregateQty = allProductItems.reduce((sum, item) => sum + item.quantity, 0) + quantity;
      
      if (aggregateQty < product.minOrderQty) {
        // We do not block here to allow them to add items one by one, 
        // but we will enforce it during checkout. 
        // However, if they only add one item and it's less than MOQ, we could warn them in the UI.
      }

      // Add item to cart
      cart.addItem(productId, variantId, quantity, lotType, selectedModel);
      await cart.save();

      return await this.getCart(userId);
    } catch (error) {
      console.error('Add Item to Cart Error:', error);
      return {
        success: false,
        message: 'Failed to add item to cart'
      };
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(userId, itemId, quantity) {
    try {
      const cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        return {
          success: false,
          message: 'Cart not found'
        };
      }

      const item = cart.items.id(itemId);
      
      if (!item) {
        return {
          success: false,
          message: 'Item not found in cart'
        };
      }

      // Validate stock
      const product = await Product.findById(item.product);
      
      if (!product || !product.isActive) {
        return {
          success: false,
          message: 'Product not available'
        };
      }

      let stock;
      
      if (item.variant && product.hasVariants) {
        const variant = product.variants.id(item.variant);
        
        if (!variant || !variant.isActive) {
          return {
            success: false,
            message: 'Variant not available'
          };
        }
        
        stock = variant.stock;
      } else {
        stock = product.stock;
      }
      
      if (item.selectedModel && product.hasModels) {
        const model = product.availableModels.find(m => m.name === item.selectedModel);
        if (!model) {
          return { success: false, message: 'Selected model not available' };
        }
        stock = model.stock;
      }

      if (!product.isLot && quantity > stock) {
        return {
          success: false,
          message: `Insufficient stock. Only ${stock} units available.`
        };
      }

      // Update quantity
      const updateResult = cart.updateItemQuantity(itemId, quantity);
      
      if (!updateResult.success) {
        return updateResult;
      }

      await cart.save();

      return await this.getCart(userId);
    } catch (error) {
      console.error('Update Cart Item Error:', error);
      return {
        success: false,
        message: 'Failed to update cart item'
      };
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, itemId) {
    try {
      const cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        return {
          success: false,
          message: 'Cart not found'
        };
      }

      const removeResult = cart.removeItem(itemId);
      
      if (!removeResult.success) {
        return removeResult;
      }

      await cart.save();

      return await this.getCart(userId);
    } catch (error) {
      console.error('Remove Cart Item Error:', error);
      return {
        success: false,
        message: 'Failed to remove item from cart'
      };
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        return {
          success: true,
          message: 'Cart already empty'
        };
      }

      cart.clearCart();
      await cart.save();

      return {
        success: true,
        message: 'Cart cleared successfully'
      };
    } catch (error) {
      console.error('Clear Cart Error:', error);
      return {
        success: false,
        message: 'Failed to clear cart'
      };
    }
  }

  /**
   * Get abandoned carts (Admin)
   */
  async getAbandonedCarts(thresholdHours = 24, timeframe = 'all') {
    try {
      const carts = await Cart.findAbandonedCarts(thresholdHours, timeframe);
      
      // Enrich with product details
      const enrichedCarts = [];
      
      for (const cart of carts) {
        await cart.populate({
          path: 'items.product',
          select: 'name images salePrice mrp sku'
        });

        const items = cart.items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }));

        let total = 0;
        for (const item of items) {
          if (item.product) {
            total += item.product.salePrice * item.quantity;
          }
        }

        enrichedCarts.push({
          _id: cart._id,
          user: cart.user,
          items,
          itemCount: cart.itemCount,
          total,
          lastModified: cart.lastModified,
          hoursSinceLastModified: Math.floor((Date.now() - cart.lastModified) / (1000 * 60 * 60))
        });
      }

      return {
        success: true,
        carts: enrichedCarts
      };
    } catch (error) {
      console.error('Get Abandoned Carts Error:', error);
      return {
        success: false,
        message: 'Failed to fetch abandoned carts'
      };
    }
  }

  /**
   * Mark abandoned carts (Cron Job)
   * Should be called periodically
   */
  async markAbandonedCarts(thresholdHours = 24) {
    try {
      const carts = await Cart.findAbandonedCarts(thresholdHours);
      
      let markedCount = 0;
      
      for (const cart of carts) {
        cart.markAsAbandoned();
        await cart.save();
        markedCount++;
      }

      return {
        success: true,
        markedCount
      };
    } catch (error) {
      console.error('Mark Abandoned Carts Error:', error);
      return {
        success: false,
        message: 'Failed to mark abandoned carts'
      };
    }
  }
}

module.exports = new CartService();