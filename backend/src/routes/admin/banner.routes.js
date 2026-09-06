/**
 * Admin Banner Routes - MVP
 */

const express = require('express');
const router = express.Router();
const BannerController = require('../../controllers/banner.controller');
const auth = require('../../middleware/auth.middleware');
const { handleSingleUpload } = require('../../middleware/upload.middleware');

router.get('/', auth.adminOnly, BannerController.listAllBanners);
router.post('/', auth.adminOnly, handleSingleUpload, BannerController.createBanner);
router.put('/:bannerId', auth.adminOnly, handleSingleUpload, BannerController.updateBanner);
router.delete('/:bannerId', auth.adminOnly, BannerController.deleteBanner);

module.exports = router;