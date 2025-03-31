const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    verifyEmail, 
    resendVerificationCode 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.get('/profile', protect, getProfile);

module.exports = router; 