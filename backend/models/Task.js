const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  assignee: { type: String },
  deadline: { type: String },
  status: { type: String, enum: ['Pending', 'Done'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Task', taskSchema);
