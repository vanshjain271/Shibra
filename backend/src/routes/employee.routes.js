/**
 * Employee Routes
 * 
 * Admin-only routes for managing employee accounts
 */

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/permission.middleware');

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Get available permissions (before :id routes)
router.get('/permissions', employeeController.getAvailablePermissions);

// CRUD routes
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
