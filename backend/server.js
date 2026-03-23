require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// This is my hackathon project
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const taskRoutes = require('./routes/taskRoutes');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(passport.initialize());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/meetflow_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
