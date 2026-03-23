const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const meetingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['Team', 'Client', 'OneOnOne', 'Standup'], default: 'Team' },
  date: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  attendees: [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  isRecorded: { type: Boolean, default: false },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'InProgress'], default: 'Scheduled' },
  recordingUrl: { type: String },
  summary: { type: String },
  // LiveKit room identifier — stable, unique per meeting
  roomId: { type: String, default: () => uuidv4(), unique: true, sparse: true },
  joinUrl: { type: String },
  // The userId of the host (creator = default host)
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Auto-set hostUserId = userId on create if not provided
meetingSchema.pre('save', function(next) {
  if (!this.hostUserId) this.hostUserId = this.userId;
  if (!this.roomId) this.roomId = uuidv4();
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);
