import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, FormGroup, FormControlLabel, Checkbox, Grid,
    Snackbar, Alert, CircularProgress, Switch, Divider
} from '@mui/material';
import { Add, Edit, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import employeeService from '../services/employee.service';

// Permission categories for display
const PERMISSION_CATEGORIES = [
    {
        name: 'Products',
        permissions: [
            { key: 'products.view', label: 'View Products' },
            { key: 'products.manage', label: 'Add/Edit/Delete Products' }
        ]
    },
    {
        name: 'Orders',
        permissions: [
            { key: 'orders.view', label: 'View Orders' },
            { key: 'orders.manage', label: 'Manage Order Status' }
        ]
    },
    {
        name: 'Invoices',
        permissions: [
            { key: 'invoices.view', label: 'View Invoices' },
            { key: 'invoices.manage', label: 'Generate Invoices' }
        ]
    },
    {
        name: 'Customers',
        permissions: [
            { key: 'customers.view', label: 'View Customers' },
            { key: 'customers.manage', label: 'Edit Customer Details' }
        ]
    },
    {
        name: 'Catalog',
        permissions: [
            { key: 'categories.view', label: 'View Categories' },
            { key: 'categories.manage', label: 'Manage Categories' },
            { key: 'brands.view', label: 'View Brands' },
            { key: 'brands.manage', label: 'Manage Brands' }
        ]
    },
    {
        name: 'Other',
        permissions: [
            { key: 'reports.view', label: 'View Reports' },
            { key: 'settings.manage', label: 'Manage Store Settings' },
            { key: 'coupons.view', label: 'View Coupons' },
            { key: 'coupons.manage', label: 'Manage Coupons' }
        ]
    }
];

interface Employee {
    _id: string;
    name: string;
    email: string;
    phone: string;
    permissions: string[];
    isActive: boolean;
    createdAt: string;
}

const initialFormState = {
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: [] as string[],
    isActive: true
};

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch employees
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await employeeService.getEmployees();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            setSnackbar({ open: true, message: 'Failed to fetch employees', severity: 'error' });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle permission toggle
    const handlePermissionToggle = (permission: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    // Select all permissions in a category
    const handleCategoryToggle = (categoryPermissions: { key: string }[]) => {
        const keys = categoryPermissions.map(p => p.key);
        const allSelected = keys.every(k => formData.permissions.includes(k));

        if (allSelected) {
            setFormData(prev => ({
                ...prev,
                permissions: prev.permissions.filter(p => !keys.includes(p))
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                permissions: [...new Set([...prev.permissions, ...keys])]
            }));
        }
    };

    // Open dialog for new employee
    const handleAddNew = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setDialogOpen(true);
    };

    // Open dialog for editing
    const handleEdit = (employee: Employee) => {
        setEditingId(employee._id);
        setFormData({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            password: '',
            permissions: employee.permissions,
            isActive: employee.isActive
        });
        setDialogOpen(true);
    };

    // Save employee
    const handleSave = async () => {
        try {
            // Don't send empty password on edit
            const payload = { ...formData };
            if (editingId && !payload.password) {
                delete (payload as any).password;
            }

            const data = editingId
                ? await employeeService.updateEmployee(editingId, payload)
                : await employeeService.createEmployee(payload);

            if (data.success) {
                setSnackbar({
                    open: true,
                    message: editingId ? 'Employee updated' : 'Employee created',
                    severity: 'success'
                });
                setDialogOpen(false);
                fetchEmployees();
            } else {
                setSnackbar({ open: true, message: data.message || 'Error saving employee', severity: 'error' });
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            setSnackbar({ open: true, message: 'Failed to save employee', severity: 'error' });
        }
    };

    // Delete employee
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;

        try {
            const data = await employeeService.deleteEmployee(id);
            if (data.success) {
                setSnackbar({ open: true, message: 'Employee deleted', severity: 'success' });
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            setSnackbar({ open: true, message: 'Failed to delete employee', severity: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>👥 Employees</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
                    Add Employee
                </Button>
            </Box>

            <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : employees.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No employees added yet.</Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={handleAddNew}>
                            Add Your First Employee
                        </Button>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Permissions</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp._id} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                                        <TableCell>{emp.email}</TableCell>
                                        <TableCell>{emp.phone}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {emp.permissions.slice(0, 3).map((p) => (
                                                    <Chip key={p} label={p.split('.')[0]} size="small" />
                                                ))}
                                                {emp.permissions.length > 3 && (
                                                    <Chip label={`+${emp.permissions.length - 3}`} size="small" variant="outlined" />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={emp.isActive ? 'Active' : 'Inactive'}
                                                color={emp.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleEdit(emp)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(emp._id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {editingId ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="9876543210"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={editingId ? "New Password (leave empty to keep)" : "Password"}
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!editingId}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    )
                                }}
                            />
                        </Grid>

                        {editingId && (
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>🔐 Permissions</Typography>

                    <Grid container spacing={3}>
                        {PERMISSION_CATEGORIES.map((category) => {
                            const allSelected = category.permissions.every(p => formData.permissions.includes(p.key));
                            return (
                                <Grid item xs={12} sm={6} md={4} key={category.name}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={
                                                        category.permissions.some(p => formData.permissions.includes(p.key)) && !allSelected
                                                    }
                                                    onChange={() => handleCategoryToggle(category.permissions)}
                                                />
                                            }
                                            label={<Typography sx={{ fontWeight: 600 }}>{category.name}</Typography>}
                                        />
                                        <FormGroup sx={{ pl: 3 }}>
                                            {category.permissions.map((perm) => (
                                                <FormControlLabel
                                                    key={perm.key}
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={formData.permissions.includes(perm.key)}
                                                            onChange={() => handlePermissionToggle(perm.key)}
                                                        />
                                                    }
                                                    label={<Typography variant="body2">{perm.label}</Typography>}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!formData.name || !formData.email || !formData.phone || (!editingId && !formData.password)}
                    >
                        {editingId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Employees;
