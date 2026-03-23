const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-hashedPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const updates = req.body;
    // Disallow password via this route
    delete updates.hashedPassword;
    
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).select('-hashedPassword');
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: 'Failed to update profile' });
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
