const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', auth, getMe);
router.patch('/me', auth, updateProfile);

module.exports = router;
