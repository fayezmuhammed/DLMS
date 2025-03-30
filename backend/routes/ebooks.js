const express = require('express');
const router = express.Router();
const eBookController = require('../controllers/eBookController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', eBookController.getEBooks);
router.get('/:id', eBookController.getEBook);
router.get('/:id/view', optionalAuth, eBookController.viewEBook);
router.get('/:id/download', protect, eBookController.downloadEBook);

// Protected routes - Admin only
router.post(
    '/',
    protect,
    authorize('admin'),
    eBookController.uploadEBookFiles,
    eBookController.createEBook
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    eBookController.uploadEBookFiles,
    eBookController.updateEBook
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    eBookController.deleteEBook
);

module.exports = router; 