const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        // Use lean() to get plain JavaScript objects and select all fields explicitly
        const users = await User.find()
            .select('name email role admissionNumber batch createdAt')
            .lean();
        
        // Debug log for the server
        console.log('Users data from DB:', JSON.stringify(users.slice(0, 2), null, 2));
        
        // Ensure admissionNumber and batch are always included even if null
        const processedUsers = users.map(user => ({
            ...user,
            admissionNumber: user.admissionNumber || null,
            batch: user.batch || null
        }));
        
        res.json({
            success: true,
            data: processedUsers
        });
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, admissionNumber, batch } = req.body;
        
        // Check if user exists with the same email
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Check if admission number is already in use (for students)
        if (admissionNumber && admissionNumber.trim() !== '' && (role === 'Student' || role === 'student')) {
            const admissionExists = await User.findOne({ admissionNumber });
            if (admissionExists) {
                return res.status(400).json({
                    success: false,
                    message: 'This admission number is already assigned to another student'
                });
            }
        }
        
        // Create user with provided fields
        const userData = {
            name,
            email,
            password, // Will be hashed in the pre-save hook
            role: role || 'student',
        };
        
        // Only add student-specific fields if role is student
        if (role === 'Student' || role === 'student') {
            // Only set admissionNumber if it's not empty
            if (admissionNumber && admissionNumber.trim() !== '') {
                userData.admissionNumber = admissionNumber;
            }
            
            // Only set batch if it's not empty
            if (batch && batch.trim() !== '') {
                userData.batch = batch;
            }
        }
        
        const user = await User.create(userData);
        
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, admissionNumber, batch, password } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if admission number is changed and already in use
        if (admissionNumber && admissionNumber.trim() !== '' && admissionNumber !== user.admissionNumber && 
            (role === 'Student' || role === 'student' || user.role === 'student')) {
            const admissionExists = await User.findOne({ 
                admissionNumber,
                _id: { $ne: user._id } // Exclude current user from check
            });
            
            if (admissionExists) {
                return res.status(400).json({
                    success: false,
                    message: 'This admission number is already assigned to another student'
                });
            }
        }
        
        // Update user fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        
        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        // Update student-specific fields
        if (role === 'Student' || role === 'student' || user.role === 'student') {
            // Handle admissionNumber
            if (admissionNumber !== undefined) {
                // If empty string, set to null or undefined based on schema
                if (admissionNumber.trim() === '') {
                    user.admissionNumber = undefined;
                } else {
                    user.admissionNumber = admissionNumber;
                }
            }
            
            // Handle batch
            if (batch !== undefined) {
                // If empty string, set to null or undefined based on schema
                if (batch.trim() === '') {
                    user.batch = undefined;
                } else {
                    user.batch = batch;
                }
            }
        } else {
            // Remove student fields if role is changed to non-student
            user.admissionNumber = undefined;
            user.batch = undefined;
        }
        
        await user.save();
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get student by admission number
// @route   GET /api/users/admission/:admissionNumber
// @access  Private/Admin
exports.getStudentByAdmissionNumber = async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        
        const student = await User.findOne({ 
            admissionNumber: admissionNumber,
            role: 'student'
        });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
