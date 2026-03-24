const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const buildInitials = (fullName, email = '') => {
  const source = String(fullName || email || '').trim();
  if (!source) return 'U';
  if (source.includes('@') && !source.includes(' ')) return source.slice(0, 2).toUpperCase();
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
};

const serializeUser = (userDoc) => ({
  id: userDoc._id,
  _id: userDoc._id,
  fullName: userDoc.fullName,
  email: userDoc.email,
  initials: userDoc.avatarInitials,
  avatarInitials: userDoc.avatarInitials,
  avatarUrl: userDoc.avatarUrl,
  jobTitle: userDoc.jobTitle,
  department: userDoc.department,
  company: userDoc.company,
  phone: userDoc.phone,
  timezone: userDoc.timezone,
  preferences: userDoc.preferences,
});

const getUploadUrlBase = (req) => {
  const configuredBase = process.env.BACKEND_URL || process.env.BASE_URL;
  if (configuredBase) return configuredBase.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
};

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-hashedPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(serializeUser(user));
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const body = req.body || {};
    const allowedFields = ['fullName', 'jobTitle', 'department', 'company', 'phone', 'timezone', 'avatarUrl', 'preferences'];
    const updates = {};

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key];
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'fullName')) {
      updates.fullName = String(updates.fullName || '').trim();
      if (!updates.fullName) {
        return res.status(400).json({ error: 'Full name is required.' });
      }
      updates.avatarInitials = buildInitials(updates.fullName);
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).select('-hashedPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(serializeUser(user));
  } catch(err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/avatar', async (req, res) => {
  try {
    const { imageData, fileName } = req.body || {};
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    const imageMatch = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!imageMatch) {
      return res.status(400).json({ error: 'Unsupported image format.' });
    }

    const extension = imageMatch[1] === 'jpeg' ? 'jpg' : imageMatch[1];
    const imageBase64 = imageMatch[2];
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const maxBytes = 5 * 1024 * 1024;
    if (imageBuffer.length > maxBytes) {
      return res.status(400).json({ error: 'Image exceeds 5MB size limit.' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const cleanFileName = String(fileName || 'avatar')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '')
      .slice(0, 40) || 'avatar';

    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const storedFileName = `${req.userId}-${uniqueSuffix}-${cleanFileName}.${extension}`.replace(/\.+/g, '.');
    const targetPath = path.join(uploadsDir, storedFileName);
    fs.writeFileSync(targetPath, imageBuffer);

    const avatarUrl = `${getUploadUrlBase(req)}/uploads/avatars/${storedFileName}`;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { avatarUrl } },
      { new: true }
    ).select('-hashedPassword');

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ avatarUrl, user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const meetingCount = await Meeting.countDocuments({ userId: req.userId });
    const pendingTasks = await Task.countDocuments({ userId: req.userId, status: 'Pending' });
    const completedTasks = await Task.countDocuments({ userId: req.userId, status: 'Done' });
    
    let productivityScore = 0;
    const totalTasks = pendingTasks + completedTasks;
    if (totalTasks > 0) {
      productivityScore = Math.round((completedTasks / totalTasks) * 100);
    } else if (meetingCount > 0) {
      productivityScore = 100;
    }

    res.json({
      totalMeetings: meetingCount,
      completedTasks,
      pendingTasks,
      productivityScore
    });
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
