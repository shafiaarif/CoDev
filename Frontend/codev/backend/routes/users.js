const express = require('express');
const router = express.Router();
const { protect, instructorOnly, studentOnly } = require('../middleware/authMiddleware');
const { getProfile, getInstructorDashboardData, getStudentDashboardData } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.get('/instructor/dashboard-data', protect, instructorOnly, getInstructorDashboardData);
router.get('/student/dashboard-data', protect, studentOnly, getStudentDashboardData);

module.exports = router;
