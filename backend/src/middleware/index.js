/**
 * Middleware Index - MVP
 */

const authMiddleware = require('./auth.middleware');
const validationMiddleware = require('./validation.middleware');

module.exports = {
  ...authMiddleware,
  ...validationMiddleware
};
