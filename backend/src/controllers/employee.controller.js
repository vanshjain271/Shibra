/**
 * Employee Controller
 * 
 * Handles HTTP requests for employee management
 */

const employeeService = require('../services/employee.service');

/**
 * Create new employee
 * POST /api/admin/employees
 */
const createEmployee = async (req, res) => {
    try {
        const employee = await employeeService.createEmployee(req.user._id, req.body);
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all employees
 * GET /api/admin/employees
 */
const getAllEmployees = async (req, res) => {
    try {
        const employees = await employeeService.getAllEmployees(req.user._id);
        res.json({
            success: true,
            data: employees,
            count: employees.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get employee by ID
 * GET /api/admin/employees/:id
 */
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id, req.user._id);
        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update employee
 * PUT /api/admin/employees/:id
 */
const updateEmployee = async (req, res) => {
    try {
        const employee = await employeeService.updateEmployee(
            req.params.id,
            req.user._id,
            req.body
        );
        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete employee
 * DELETE /api/admin/employees/:id
 */
const deleteEmployee = async (req, res) => {
    try {
        await employeeService.deleteEmployee(req.params.id, req.user._id);
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get available permissions
 * GET /api/admin/employees/permissions
 */
const getAvailablePermissions = async (req, res) => {
    try {
        const permissions = employeeService.getAvailablePermissions();
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Employee login
 * POST /api/auth/employee/login
 */
const employeeLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await employeeService.employeeLogin(email, password);
        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getAvailablePermissions,
    employeeLogin
};
