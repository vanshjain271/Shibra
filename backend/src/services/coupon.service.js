/**
 * Coupon Service - MVP
 * 
 * Manage coupon validation and application
 */

const Coupon = require('../models/Coupon');
const Discount = require('../models/Discount');

class CouponService {
  /**
   * Validate and apply coupon to cart
   */
  async validateCoupon(code, userId, cartItems, cartTotal) {
    try {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });

      if (!coupon) {
        return {
          success: false,
          message: 'Invalid coupon code'
        };
      }

      // Check if coupon is valid
      const validityCheck = coupon.isValid();
      if (!validityCheck.valid) {
        return {
          success: false,
          message: validityCheck.reason
        };
      }

      // Check if user can use
      const userCheck = coupon.canUserUse(userId);
      if (!userCheck.canUse) {
        return {
          success: false,
          message: userCheck.reason
        };
      }

      // Calculate discount
      const discountCalc = coupon.calculateDiscount(cartTotal, cartItems);
      
      if (!discountCalc.applicable) {
        return {
          success: false,
          message: discountCalc.reason
        };
      }

      return {
        success: true,
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description
        },
        discount: discountCalc.discount,
        applicableAmount: discountCalc.applicableAmount,
        finalTotal: Math.max(0, cartTotal - discountCalc.discount)
      };
    } catch (error) {
      console.error('Validate Coupon Error:', error);
      return {
        success: false,
        message: 'Failed to validate coupon'
      };
    }
  }

  /**
   * Apply coupon to order (record usage)
   */
  async applyCoupon(couponId, userId, orderAmount) {
    try {
      const coupon = await Coupon.findById(couponId);

      if (!coupon) {
        return {
          success: false,
          message: 'Coupon not found'
        };
      }

      // Final validation
      const validityCheck = coupon.isValid();
      if (!validityCheck.valid) {
        return {
          success: false,
          message: validityCheck.reason
        };
      }

      const userCheck = coupon.canUserUse(userId);
      if (!userCheck.canUse) {
        return {
          success: false,
          message: userCheck.reason
        };
      }

      // Record usage
      coupon.recordUsage(userId);
      await coupon.save();

      return {
        success: true,
        message: 'Coupon applied successfully'
      };
    } catch (error) {
      console.error('Apply Coupon Error:', error);
      return {
        success: false,
        message: 'Failed to apply coupon'
      };
    }
  }

  /**
   * Get active coupons
   */
  async getActiveCoupons(userId = null) {
    try {
      let coupons = await Coupon.getActiveCoupons();

      // Filter by user if specified
      if (userId) {
        coupons = coupons.filter(coupon => {
          if (coupon.allowedUsers.length === 0) {
            return true; // Available to all
          }
          return coupon.allowedUsers.some(id => id.toString() === userId.toString());
        });

        // Filter out coupons user has exhausted
        coupons = coupons.filter(coupon => {
          const userCheck = coupon.canUserUse(userId);
          return userCheck.canUse;
        });
      }

      return {
        success: true,
        coupons
      };
    } catch (error) {
      console.error('Get Active Coupons Error:', error);
      return {
        success: false,
        message: 'Failed to fetch coupons'
      };
    }
  }

  /**
   * Create coupon (Admin)
   */
  async createCoupon(couponData, adminId) {
    try {
      const coupon = new Coupon({
        ...couponData,
        createdBy: adminId
      });

      await coupon.save();

      return {
        success: true,
        coupon,
        message: 'Coupon created successfully'
      };
    } catch (error) {
      console.error('Create Coupon Error:', error);
      
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Coupon code already exists'
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to create coupon'
      };
    }
  }

  /**
   * Update coupon (Admin)
   */
  async updateCoupon(couponId, updates) {
    try {
      const coupon = await Coupon.findById(couponId);

      if (!coupon) {
        return {
          success: false,
          message: 'Coupon not found'
        };
      }

      const allowedFields = [
        'description', 'value', 'minOrderAmount', 'maxDiscountAmount',
        'usageLimit', 'perUserLimit', 'startDate', 'endDate',
        'applicableProducts', 'applicableCategories', 'allowedUsers', 'isActive'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          coupon[field] = updates[field];
        }
      }

      await coupon.save();

      return {
        success: true,
        coupon,
        message: 'Coupon updated successfully'
      };
    } catch (error) {
      console.error('Update Coupon Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update coupon'
      };
    }
  }

  /**
   * Delete coupon (Admin)
   */
  async deleteCoupon(couponId) {
    try {
      const coupon = await Coupon.findById(couponId);

      if (!coupon) {
        return {
          success: false,
          message: 'Coupon not found'
        };
      }

      await coupon.deleteOne();

      return {
        success: true,
        message: 'Coupon deleted successfully'
      };
    } catch (error) {
      console.error('Delete Coupon Error:', error);
      return {
        success: false,
        message: 'Failed to delete coupon'
      };
    }
  }

  /**
   * Get product discounts
   */
  async getProductDiscounts(productId, categoryId, brandId) {
    try {
      const discounts = await Discount.getActiveDiscountsForProduct(
        productId,
        categoryId,
        brandId
      );

      return {
        success: true,
        discounts
      };
    } catch (error) {
      console.error('Get Product Discounts Error:', error);
      return {
        success: false,
        message: 'Failed to fetch discounts'
      };
    }
  }

  /**
   * Create discount (Admin)
   */
  async createDiscount(discountData, adminId) {
    try {
      const discount = new Discount({
        ...discountData,
        createdBy: adminId
      });

      await discount.save();

      return {
        success: true,
        discount,
        message: 'Discount created successfully'
      };
    } catch (error) {
      console.error('Create Discount Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create discount'
      };
    }
  }

  /**
   * List all coupons (Admin)
   */
  async listAllCoupons() {
    try {
      const coupons = await Coupon.find()
        .sort({ createdAt: -1 })
        .select('-usedBy');

      return {
        success: true,
        coupons
      };
    } catch (error) {
      console.error('List All Coupons Error:', error);
      return {
        success: false,
        message: 'Failed to list coupons'
      };
    }
  }

  /**
   * List all discounts (Admin)
   */
  async listAllDiscounts() {
    try {
      const discounts = await Discount.find().sort({ createdAt: -1 });

      return {
        success: true,
        discounts
      };
    } catch (error) {
      console.error('List All Discounts Error:', error);
      return {
        success: false,
        message: 'Failed to list discounts'
      };
    }
  }
}

module.exports = new CouponService();