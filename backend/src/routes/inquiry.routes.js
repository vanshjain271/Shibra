const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/', inquiryController.createInquiry);
router.get('/', authenticate, authorize('ADMIN'), inquiryController.getInquiries);
router.patch('/:id/status', authenticate, authorize('ADMIN'), inquiryController.updateInquiryStatus);

module.exports = router;
