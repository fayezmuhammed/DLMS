const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Reserve a book
// @route   POST /api/reservations
// @access  Private
exports.reserveBook = asyncHandler(async (req, res, next) => {
    const { bookId } = req.body;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
        return next(new ErrorResponse(`Book not found with id of ${bookId}`, 404));
    }
    
    // Check if book is available
    if (book.status !== 'Available') {
        return next(new ErrorResponse(`Book is not available for reservation`, 400));
    }
    
    // Check if user already has an active reservation for this book
    const existingReservation = await Reservation.findOne({
        user: req.user.id,
        book: bookId,
        status: 'active'
    });
    
    if (existingReservation) {
        return next(new ErrorResponse(`You already have an active reservation for this book`, 400));
    }
    
    // Check maximum reservation limit (3 books)
    const activeReservationsCount = await Reservation.countDocuments({
        user: req.user.id,
        status: 'active'
    });
    
    if (activeReservationsCount >= 3) {
        return next(new ErrorResponse(`You have reached the maximum limit of 3 active reservations. Please cancel an existing reservation before making a new one.`, 400));
    }
    
    // Create reservation
    const reservation = await Reservation.create({
        user: req.user.id,
        book: bookId
    });
    
    // Update book status to 'Reserved'
    await Book.findByIdAndUpdate(bookId, { status: 'Reserved' });
    
    res.status(201).json({
        success: true,
        message: 'Book reserved successfully. Your reservation is valid for 24 hours.',
        data: reservation
    });
});

// @desc    Get user's reservations
// @route   GET /api/reservations
// @access  Private
exports.getUserReservations = asyncHandler(async (req, res, next) => {
    const reservations = await Reservation.find({ 
        user: req.user.id,
        status: 'active'
    })
    .populate({
        path: 'book',
        select: 'title author isbn status coverImage image imagePath'
    })
    .sort({ reservedAt: -1 });
    
    res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations
    });
});

// @desc    Cancel reservation
// @route   DELETE /api/reservations/:id
// @access  Private
exports.cancelReservation = asyncHandler(async (req, res, next) => {
    let reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
        return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is reservation owner
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User not authorized to cancel this reservation`, 401));
    }
    
    // Update reservation status
    reservation.status = 'cancelled';
    await reservation.save();
    
    // Update book status back to 'Available'
    await Book.findByIdAndUpdate(reservation.book, { status: 'Available' });
    
    res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: {}
    });
});

// @desc    Get all reservations (admin only)
// @route   GET /api/reservations/all
// @access  Private/Admin
exports.getAllReservations = asyncHandler(async (req, res, next) => {
    const reservations = await Reservation.find()
        .populate({
            path: 'book',
            select: 'title author isbn status'
        })
        .populate({
            path: 'user',
            select: 'name email'
        })
        .sort({ reservedAt: -1 });
    
    res.status(200).json({
        success: true,
        count: reservations.length,
        data: reservations
    });
});

// @desc    Check for and expire outdated reservations
// @route   PUT /api/reservations/expire-outdated
// @access  Private/Admin
exports.expireOutdatedReservations = asyncHandler(async (req, res, next) => {
    const now = new Date();
    
    // Find all expired but still active reservations
    const expiredReservations = await Reservation.find({
        status: 'active',
        expiresAt: { $lt: now }
    });
    
    // Update reservation statuses and book statuses
    const updates = expiredReservations.map(async (reservation) => {
        // Update reservation status
        reservation.status = 'expired';
        await reservation.save();
        
        // Update book status
        await Book.findByIdAndUpdate(reservation.book, { status: 'Available' });
        
        return reservation;
    });
    
    await Promise.all(updates);
    
    res.status(200).json({
        success: true,
        count: expiredReservations.length,
        message: `${expiredReservations.length} outdated reservations expired successfully`,
        data: expiredReservations
    });
}); 