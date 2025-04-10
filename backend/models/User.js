const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    admissionNumber: {
        type: String,
        default: null,
        unique: true,
        sparse: true
    },
    batch: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String
    },
    verificationCodeExpires: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Ensure admissionNumber and batch are always included
            if (ret.admissionNumber === undefined) ret.admissionNumber = null;
            if (ret.batch === undefined) ret.batch = null;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    // If admissionNumber is an empty string or undefined, set it to null
    if (this.admissionNumber === '' || this.admissionNumber === undefined) {
        this.admissionNumber = null;
    }
    
    // If batch is an empty string or undefined, set it to null
    if (this.batch === '' || this.batch === undefined) {
        this.batch = null;
    }
    
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification code
userSchema.methods.generateVerificationCode = function() {
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the code
    this.verificationCode = crypto
        .createHash('sha256')
        .update(verificationCode)
        .digest('hex');
    
    // Set expiration (15 minutes)
    this.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    
    return verificationCode;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expire to 10 minutes
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

module.exports = mongoose.model('User', userSchema); 