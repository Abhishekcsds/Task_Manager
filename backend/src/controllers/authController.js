const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

// Register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // First user becomes Admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'Admin' : (role === 'Admin' ? 'Admin' : 'Member');

    const user = new User({ name, email, password, role: assignedRole });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};
