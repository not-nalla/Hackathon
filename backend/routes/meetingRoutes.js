const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const authMiddleware = require('../middleware/authMiddleware');
const { AccessToken } = require('livekit-server-sdk');
const { randomUUID } = require('crypto');

const getFrontendBaseUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const buildJoinUrl = (roomId) => `${getFrontendBaseUrl()}/join/${roomId}`;
const buildRoomUrl = (roomId) => `${getFrontendBaseUrl()}/room/${roomId}`;

const toClientMeeting = (meetingDoc) => {
  const meeting = meetingDoc.toObject ? meetingDoc.toObject() : meetingDoc;
  return {
    ...meeting,
    joinUrl: meeting.joinUrl || buildJoinUrl(meeting.roomId),
  };
};

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    // Generate counts for last 7 weeks grouping
    // Mocking an aggregation for now or returning static weekly values that the frontend parses
    const now = new Date();
    const stats = [];
    for(let i = 6; i >= 0; i--) {
      const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i*7 + 7));
      const lt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i*7));
      const count = await Meeting.countDocuments({
        userId: req.userId,
        date: { $gte: gte, $lt: lt }
      });
      stats.push(count);
    }
    // Also push current week
    const currentGte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const currentCount = await Meeting.countDocuments({
       userId: req.userId,
       date: { $gte: currentGte }
    });
    stats.push(currentCount);

    res.json({ weeklyCounts: stats });
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch meeting stats' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const meetings = await Meeting.find({
      userId: req.userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    res.json(meetings.map(toClientMeeting));
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch today meetings' });
  }
});

router.get('/upcoming', async (req, res) => {
  try {
    const meetings = await Meeting.find({
      userId: req.userId,
      date: { $gte: new Date() },
      status: { $ne: 'Cancelled' }
    }).sort({ date: 1 }).limit(parseInt(req.query.limit) || 100);
    res.json(meetings.map(toClientMeeting));
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

router.get('/past', async (req, res) => {
  try {
    const meetings = await Meeting.find({
      userId: req.userId,
      date: { $lt: new Date() },
      status: 'Completed'
    }).sort({ date: -1 }).limit(parseInt(req.query.limit) || 100);
    res.json(meetings.map(toClientMeeting));
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch past meetings' });
  }
});

router.get('/', async (req, res) => {
  try {
    let query = { userId: req.userId };
    if (req.query.status) query.status = req.query.status;

    const meetings = await Meeting.find(query)
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 100);
    res.json(meetings.map(toClientMeeting));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

router.post('/', async (req, res) => {
  try {
    const roomId = req.body.roomId || randomUUID();
    const meeting = new Meeting({
      ...req.body,
      roomId,
      joinUrl: buildJoinUrl(roomId),
      hostUserId: req.body.hostUserId || req.userId,
      userId: req.userId,
    });
    await meeting.save();
    res.status(201).json(toClientMeeting(meeting));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updatePayload = { ...req.body };
    if (updatePayload.roomId) {
      updatePayload.joinUrl = buildJoinUrl(updatePayload.roomId);
    }
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updatePayload },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(toClientMeeting(meeting));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Get meeting by roomId (for frontend to fetch meeting info)
router.get('/room/:roomId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const isHost = meeting.hostUserId 
      ? meeting.hostUserId.toString() === req.userId.toString()
      : meeting.userId.toString() === req.userId.toString();
    res.json({ meeting: toClientMeeting(meeting), isHost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// LiveKit Join — generates token, determines host, updates meeting status
router.post('/join/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { displayName } = req.body;

  try {
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) {
      return res.status(500).json({ error: 'LiveKit server credentials are not configured correctly' });
    }

    // Determine if current user is the host
    const hostId = meeting.hostUserId || meeting.userId;
    const isHost = hostId.toString() === req.userId.toString();

    // Identity = userId string for uniqueness
    const identity = req.userId.toString();
    const name = displayName || identity;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      metadata: JSON.stringify({ isHost, meetingId: meeting._id.toString() }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
    });

    // Mark meeting as InProgress when host joins
    if (isHost && meeting.status === 'Scheduled') {
      await Meeting.findByIdAndUpdate(meeting._id, { status: 'InProgress' });
    }

    res.json({
      token: await at.toJwt(),
      roomId,
      joinUrl: meeting.joinUrl || buildJoinUrl(roomId),
      roomUrl: buildRoomUrl(roomId),
      isHost,
      meetingTitle: meeting.title,
      livekitUrl,
    });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// End meeting (host only)
router.post('/end/:roomId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    const hostId = meeting.hostUserId || meeting.userId;
    if (hostId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Only the host can end the meeting' });
    }
    await Meeting.findByIdAndUpdate(meeting._id, { status: 'Completed' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end meeting' });
  }
});

module.exports = router;
