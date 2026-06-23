const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT helper
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// REGISTER
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields required' });
    }
    if (!['student', 'instructor'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, role });
        await user.save();

        const token = generateToken(user._id, user.role);
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// LOGIN
exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && await user.matchPassword(password)) {
            if (user.role !== role) return res.status(401).json({ message: `Select correct role: ${user.role}` });
            const token = generateToken(user._id, user.role);
            return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
