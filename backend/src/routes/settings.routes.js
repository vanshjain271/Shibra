/**
 * Public Settings Routes
 */

const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');

// Get public store settings (Ticker, etc.)
router.get('/', async (req, res) => {
    try {
        const settings = await StoreSettings.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Public Settings Get Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

module.exports = router;
