const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId).select('+password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If trying to change password
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Incorrect old password' });
            }
            // Hash the new password before saving
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        } else if (newPassword && !oldPassword) {
            return res.status(400).json({ success: false, message: 'Old password is required to set a new password' });
        }

        if (name) user.name = name;
        
        if (email && email !== user.email) {
            // Check if new email is already taken
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
            }
            user.email = email;
        }

        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
