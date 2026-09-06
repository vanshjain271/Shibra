/**
 * Banner Service - MVP
 * 
 * Manage promotional banners
 */

const Banner = require('../models/Banner');
const S3Service = require('./s3.service');

class BannerService {
  /**
   * Get active banners
   */
  async getActiveBanners(placement = null) {
    try {
      const banners = await Banner.getActiveBanners(placement);

      return {
        success: true,
        banners
      };
    } catch (error) {
      console.error('Get Active Banners Error:', error);
      return {
        success: false,
        message: 'Failed to fetch banners'
      };
    }
  }

  /**
   * Create banner (Admin)
   */
  async createBanner(bannerData, imageFile, adminId) {
    try {
      let imageUrl = '';

      // Enforce image upload
      if (imageFile) {
        const uploadResult = await S3Service.uploadFile(imageFile, 'banners');
        if (!uploadResult.success) {
          return {
            success: false,
            message: 'Failed to upload banner image'
          };
        }
        imageUrl = uploadResult.url;
      } else {
        return {
          success: false,
          message: 'Banner image file is required'
        };
      }

      const banner = new Banner({
        ...bannerData,
        image: imageUrl,
        createdBy: adminId
      });

      await banner.save();

      return {
        success: true,
        banner,
        message: 'Banner created successfully'
      };
    } catch (error) {
      console.error('Create Banner Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create banner'
      };
    }
  }

  /**
   * Update banner (Admin)
   */
  async updateBanner(bannerId, updates, newImageFile = null) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        return {
          success: false,
          message: 'Banner not found'
        };
      }

      // Upload new image if provided
      if (newImageFile) {
        // Delete old image
        if (banner.image) {
          await S3Service.deleteFile(banner.image);
        }

        const uploadResult = await S3Service.uploadFile(newImageFile, 'banners');
        if (!uploadResult.success) {
          return {
            success: false,
            message: 'Failed to upload new banner image'
          };
        }
        // Directly update the banner image
        // updates.image = uploadResult.url;
        banner.image = uploadResult.url;
      }

      // 'title', 'description', 'image', 'linkType', 'linkTarget',
      const allowedFields = [
        'title', 'description', 'linkType', 'linkTarget',
        'placement', 'sortOrder', 'startDate', 'endDate', 'isActive'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          banner[field] = updates[field];
        }
      }

      await banner.save();

      return {
        success: true,
        banner,
        message: 'Banner updated successfully'
      };
    } catch (error) {
      console.error('Update Banner Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update banner'
      };
    }
  }

  /**
   * Delete banner (Admin)
   */
  async deleteBanner(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);

      if (!banner) {
        return {
          success: false,
          message: 'Banner not found'
        };
      }

      // Delete image from S3
      if (banner.image) {
        await S3Service.deleteFile(banner.image);
      }

      await banner.deleteOne();

      return {
        success: true,
        message: 'Banner deleted successfully'
      };
    } catch (error) {
      console.error('Delete Banner Error:', error);
      return {
        success: false,
        message: 'Failed to delete banner'
      };
    }
  }

  /**
   * List all banners (Admin)
   */
  async listAllBanners() {
    try {
      const banners = await Banner.find().sort({ createdAt: -1 });

      return {
        success: true,
        banners
      };
    } catch (error) {
      console.error('List All Banners Error:', error);
      return {
        success: false,
        message: 'Failed to list banners'
      };
    }
  }

  /**
   * Track banner view
   */
  async trackView(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);
      if (banner) {
        banner.incrementViews();
        await banner.save();
      }
      return { success: true };
    } catch (error) {
      console.error('Track Banner View Error:', error);
      return { success: false };
    }
  }

  /**
   * Track banner click
   */
  async trackClick(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);
      if (banner) {
        banner.incrementClicks();
        await banner.save();
      }
      return { success: true };
    } catch (error) {
      console.error('Track Banner Click Error:', error);
      return { success: false };
    }
  }
}

module.exports = new BannerService();