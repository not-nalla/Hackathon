const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    // Overdue: deadline < today, and status Pending
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const pending = await Task.countDocuments({ userId: req.userId, status: 'Pending' });
    const done = await Task.countDocuments({ userId: req.userId, status: 'Done' });
    const overdue = await Task.countDocuments({ userId: req.userId, status: 'Pending', deadline: { $lt: startOfToday } });
    
    res.json({ pending, done, overdue });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    let query = { userId: req.userId };
    if (status) query.status = status;
    
    // Quick overdue query logic
    if (status === 'Overdue') {
        query.status = 'Pending';
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.deadline = { $lt: startOfToday };
    }

    const tasks = await Task.find(query).sort({ deadline: 1 }).limit(parseInt(req.query.limit) || 100);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.userId });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (req.body.status === 'Done') {
        req.body.completedAt = new Date();
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
