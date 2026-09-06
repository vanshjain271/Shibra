/**
 * Employee Service
 * 
 * Business logic for managing employee accounts
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Available permissions for reference
const AVAILABLE_PERMISSIONS = [
    'products.view', 'products.manage',
    'orders.view', 'orders.manage',
    'invoices.view', 'invoices.manage',
    'customers.view', 'customers.manage',
    'reports.view',
    'settings.manage',
    'coupons.view', 'coupons.manage',
    'brands.view', 'brands.manage',
    'categories.view', 'categories.manage'
];

class EmployeeService {
    /**
     * Create a new employee
     */
    async createEmployee(adminId, employeeData) {
        const { name, email, phone, password, permissions } = employeeData;

        // Validate email is provided for employees
        if (!email) {
            throw new Error('Email is required for employees');
        }

        // Check if email already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Email already registered');
            }
            if (existingUser.phone === phone) {
                throw new Error('Phone number already registered');
            }
        }

        // Validate permissions
        const validPermissions = (permissions || []).filter(p =>
            AVAILABLE_PERMISSIONS.includes(p)
        );

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create employee
        const employee = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'EMPLOYEE',
            permissions: validPermissions,
            createdBy: adminId,
            isActive: true
        });

        await employee.save();

        // Return without password
        const result = employee.toObject();
        delete result.password;
        return result;
    }

    /**
     * Get all employees
     */
    async getAllEmployees(adminId) {
        const employees = await User.find({
            role: 'EMPLOYEE',
            createdBy: adminId
        })
            .select('-password -otp')
            .sort({ createdAt: -1 });

        return employees;
    }

    /**
     * Get employee by ID
     */
    async getEmployeeById(employeeId, adminId) {
        const employee = await User.findOne({
            _id: employeeId,
            role: 'EMPLOYEE',
            createdBy: adminId
        }).select('-password -otp');

        if (!employee) {
            throw new Error('Employee not found');
        }

        return employee;
    }

    /**
     * Update employee
     */
    async updateEmployee(employeeId, adminId, updateData) {
        const { name, email, phone, permissions, isActive, password } = updateData;

        const employee = await User.findOne({
            _id: employeeId,
            role: 'EMPLOYEE',
            createdBy: adminId
        });

        if (!employee) {
            throw new Error('Employee not found');
        }

        // Update fields
        if (name !== undefined) employee.name = name;
        if (email !== undefined) {
            // Check if email is taken by another user
            const existingUser = await User.findOne({
                email,
                _id: { $ne: employeeId }
            });
            if (existingUser) {
                throw new Error('Email already registered');
            }
            employee.email = email;
        }
        if (phone !== undefined) {
            // Check if phone is taken by another user
            const existingUser = await User.findOne({
                phone,
                _id: { $ne: employeeId }
            });
            if (existingUser) {
                throw new Error('Phone number already registered');
            }
            employee.phone = phone;
        }
        if (permissions !== undefined) {
            employee.permissions = permissions.filter(p =>
                AVAILABLE_PERMISSIONS.includes(p)
            );
        }
        if (isActive !== undefined) {
            employee.isActive = isActive;
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            employee.password = await bcrypt.hash(password, salt);
        }

        await employee.save();

        const result = employee.toObject();
        delete result.password;
        return result;
    }

    /**
     * Delete employee
     */
    async deleteEmployee(employeeId, adminId) {
        const employee = await User.findOneAndDelete({
            _id: employeeId,
            role: 'EMPLOYEE',
            createdBy: adminId
        });

        if (!employee) {
            throw new Error('Employee not found');
        }

        return { message: 'Employee deleted successfully' };
    }

    /**
     * Employee login with email/password
     */
    async employeeLogin(email, password) {
        // Allow both ADMIN and EMPLOYEE roles to login
        const employee = await User.findOne({
            email,
            role: { $in: ['ADMIN', 'EMPLOYEE'] }
        }).select('+password');

        if (!employee) {
            throw new Error('Invalid credentials');
        }

        if (!employee.isActive) {
            throw new Error('Account is deactivated. Contact admin.');
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        employee.lastLoginAt = new Date();
        await employee.save();

        // Generate token
        const token = employee.generateAuthToken();

        const result = employee.toObject();
        delete result.password;

        return { employee: result, token };
    }

    /**
     * Get available permissions list
     */
    getAvailablePermissions() {
        return AVAILABLE_PERMISSIONS.map(p => ({
            key: p,
            category: p.split('.')[0],
            action: p.split('.')[1],
            label: this.formatPermissionLabel(p)
        }));
    }

    formatPermissionLabel(permission) {
        const [category, action] = permission.split('.');
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
        return `${categoryLabel} - ${actionLabel}`;
    }
}

module.exports = new EmployeeService();
