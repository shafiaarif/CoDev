const User = require('../models/User');

// Get user profile
exports.getProfile = async (req, res) => {
    if (req.user) {
        res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Instructor dashboard data
exports.getInstructorDashboardData = async (req, res) => {
    res.json({ message: `Welcome, Instructor ${req.user.name}!`, stats: { coursesTaught: 5, pendingReviews: 12 } });
};

// Student dashboard data
exports.getStudentDashboardData = async (req, res) => {
    res.json({ message: `Welcome, Student ${req.user.name}!`, stats: { enrolledCourses: 3, upcomingDeadline: 'Math Quiz (Nov 15)' } });
};
