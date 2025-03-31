const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    getUser, 
    createUser, 
    updateUser, 
    deleteUser,
    getStudentByAdmissionNumber
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes below are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

// Special routes
router.get('/admission/:admissionNumber', getStudentByAdmissionNumber);

module.exports = router; 