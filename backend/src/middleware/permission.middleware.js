/**
 * Permission Middleware
 * 
 * Checks if user has required permission(s) to access a route
 * ADMIN role has all permissions by default
 * EMPLOYEE role must have specific permission in their permissions array
 */

/**
 * Check if user has required permission
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions (OR logic)
 */
const hasPermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // ADMIN has all permissions
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // BUYER has no admin permissions
        if (req.user.role === 'BUYER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Employee access required.'
            });
        }

        // EMPLOYEE - check specific permissions
        if (req.user.role === 'EMPLOYEE') {
            const permissions = Array.isArray(requiredPermissions)
                ? requiredPermissions
                : [requiredPermissions];

            const userPermissions = req.user.permissions || [];
            const hasRequiredPermission = permissions.some(p => userPermissions.includes(p));

            if (!hasRequiredPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You do not have permission for this action.',
                    required: permissions
                });
            }

            return next();
        }

        // Unknown role
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    };
};

/**
 * Check if user is Admin only
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin access required.'
        });
    }

    next();
};

/**
 * Check if user is Admin or Employee
 */
const isStaff = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Staff access required.'
        });
    }

    next();
};

module.exports = {
    hasPermission,
    isAdmin,
    isStaff
};
