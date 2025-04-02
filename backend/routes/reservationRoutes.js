const express = require('express');
const {
    reserveBook,
    getUserReservations,
    cancelReservation,
    getAllReservations,
    expireOutdatedReservations
} = require('../controllers/reservationController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Routes requiring authentication
router.use(protect);

// User routes
router.post('/', reserveBook);
router.get('/', getUserReservations);
router.delete('/:id', cancelReservation);

// Admin routes
router.get('/all', authorize('admin'), getAllReservations);
router.put('/expire-outdated', authorize('admin'), expireOutdatedReservations);

module.exports = router; 