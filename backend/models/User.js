const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String },
  googleId: { type: String },
  jobTitle: { type: String },
  department: { type: String },
  company: { type: String },
  phone: { type: String },
  timezone: { type: String, default: 'UTC' },
  avatarInitials: { type: String },
  preferences: {
    autoRecord: { type: Boolean, default: false },
    sendSummaries: { type: Boolean, default: true },
    emailReminders: { type: Boolean, default: true },
    transcriptionEnabled: { type: Boolean, default: true },
    recurringDefault: { type: Boolean, default: false },
    defaultDuration: { type: Number, default: 30 },
    preferredTimeSlot: { type: String, default: 'Morning' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
