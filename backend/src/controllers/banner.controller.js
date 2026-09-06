/**
 * Banner Controller - MVP (Buyer & Admin)
 */

const BannerService = require('../services/banner.service');

/**
 * @desc    Get active banners
 * @route   GET /api/v1/banners
 * @access  Public
 * @query   placement
 */
const getActiveBanners = async (req, res) => {
  try {
    const { placement } = req.query;

    const result = await BannerService.getActiveBanners(placement || null);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      banners: result.banners
    });
  } catch (error) {
    console.error('Get Active Banners Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching banners'
    });
  }
};

/**
 * @desc    Track banner view
 * @route   POST /api/v1/banners/:bannerId/view
 * @access  Public
 */
const trackView = async (req, res) => {
  try {
    const { bannerId } = req.params;
    await BannerService.trackView(bannerId);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

/**
 * @desc    Track banner click
 * @route   POST /api/v1/banners/:bannerId/click
 * @access  Public
 */
const trackClick = async (req, res) => {
  try {
    const { bannerId } = req.params;
    await BannerService.trackClick(bannerId);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

/**
 * @desc    List all banners (Admin)
 * @route   GET /api/v1/admin/banners
 * @access  Admin
 */
const listAllBanners = async (req, res) => {
  try {
    const result = await BannerService.listAllBanners();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      banners: result.banners
    });
  } catch (error) {
    console.error('List All Banners Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while listing banners'
    });
  }
};

/**
 * @desc    Create banner (Admin)
 * @route   POST /api/v1/admin/banners
 * @access  Admin
 */
const createBanner = async (req, res) => {
  try {
    const result = await BannerService.createBanner(
      req.body,
      req.file,
      req.user.userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      banner: result.banner
    });
  } catch (error) {
    console.error('Create Banner Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating banner'
    });
  }
};

/**
 * @desc    Update banner (Admin)
 * @route   PUT /api/v1/admin/banners/:bannerId
 * @access  Admin
 */
const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const result = await BannerService.updateBanner(
      bannerId,
      req.body,
      req.file
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      banner: result.banner
    });
  } catch (error) {
    console.error('Update Banner Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating banner'
    });
  }
};

/**
 * @desc    Delete banner (Admin)
 * @route   DELETE /api/v1/admin/banners/:bannerId
 * @access  Admin
 */
const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const result = await BannerService.deleteBanner(bannerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete Banner Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting banner'
    });
  }
};

module.exports = {
  getActiveBanners,
  trackView,
  trackClick,
  listAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
};