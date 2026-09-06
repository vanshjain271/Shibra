const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/admin-profile.controller');
const { adminOnly } = require('../../middleware/auth.middleware');

// Routes mapped to /api/v1/admin/profile
router.get('/', adminOnly, profileController.getProfile);
router.put('/', adminOnly, profileController.updateProfile);

module.exports = router;
