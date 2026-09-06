/**
 * Admin Settings Routes
 */

const express = require('express');
const router = express.Router();
const StoreSettings = require('../../models/StoreSettings');
const { adminOnly } = require('../../middleware/auth.middleware');
const { handleSingleUpload } = require('../../middleware/upload.middleware');
const S3Service = require('../../services/s3.service');

// Get store settings
router.get('/', adminOnly, async (req, res) => {
    try {
        const settings = await StoreSettings.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Settings Get Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

// Update store settings
router.put('/', adminOnly, handleSingleUpload, async (req, res) => {
    try {
        let settings = await StoreSettings.findOne();
        const updates = req.body;
        // Parse fields correctly (Multipart form-data sends everything as strings)
        Object.keys(updates).forEach(key => {
            let value = updates[key];
            
            // 1. Handle JSON strings (e.g., storeFeatures)
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Not valid JSON, keep as string
                }
            }
            
            // 2. Handle Booleans
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            
            // 3. Handle Numbers
            if (['minOrderAmount', 'deliveryFee', 'freeDeliveryThreshold', 'partialPaymentPercent'].includes(key)) {
                if (typeof value === 'string') {
                    value = parseFloat(value) || 0;
                }
            }

            updates[key] = value;
        });

        // Handle QR Code upload if present
        if (req.file) {
            const uploadResult = await S3Service.uploadFile(req.file, 'settings');
            if (uploadResult.success) {
                updates.paymentQrCode = uploadResult.url;
            }
        }

        if (!settings) {
            settings = await StoreSettings.create(updates);
        } else {
            // Update all fields that are provided
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    settings[key] = updates[key];
                }
            });
            await settings.save();
        }

        res.json({ success: true, data: settings, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Settings Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

module.exports = router;
