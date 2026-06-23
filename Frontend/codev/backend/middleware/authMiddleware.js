const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'Not authorized' });
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Token failed' });
        }
    } else {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
};

const instructorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'instructor') return next();
    res.status(403).json({ message: 'Instructor access only' });
};

const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'student') return next();
    res.status(403).json({ message: 'Student access only' });
};

module.exports = { protect, instructorOnly, studentOnly };
