const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    verifyEmail, 
    resendVerificationCode,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/profile', protect, getProfile);

module.exports = router; 