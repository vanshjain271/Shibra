const express = require('express');
const router = express.Router();

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/address.controller');

const { buyerOrAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(buyerOrAdmin);

router
  .route('/')
  .get(getAddresses)
  .post(addAddress);

router
  .route('/:id')
  .patch(updateAddress)
  .delete(deleteAddress);

module.exports = router;
