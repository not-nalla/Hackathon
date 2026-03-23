const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const passport = require('passport');
const { configureGoogleAuth } = require('../services/googleAuth');

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendBase = (process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const apiBaseUrl = backendBase.endsWith('/api') ? backendBase : `${backendBase}/api`;
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

configureGoogleAuth({
  passport,
  User,
  baseUrl: apiBaseUrl,
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
});

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
};

router.get('/google', (req, res, next) => {
  if (!googleEnabled) {
    return res.status(503).json({ error: 'Google authentication is not configured' });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleEnabled) {
      return res.status(503).json({ error: 'Google authentication is not configured' });
    }
    return passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=true`
    })(req, res, next);
  },
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }
);

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, jobTitle, department } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarInitials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    const newUser = new User({
      fullName, email, hashedPassword, jobTitle, department, avatarInitials
    });

    await newUser.save();

    const token = generateToken(newUser._id);
    const user = { id: newUser._id, fullName: newUser.fullName, email: newUser.email, initials: newUser.avatarInitials };
    res.json({ token, user });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id);
    const safeUser = { id: user._id, fullName: user.fullName, email: user.email, initials: user.avatarInitials };
    res.json({ token, user: safeUser });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-hashedPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        initials: user.avatarInitials,
        jobTitle: user.jobTitle,
        department: user.department
      }
    });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
