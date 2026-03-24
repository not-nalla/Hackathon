import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useChat,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import './meeting-room-premium.css';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:4000';
const DEFAULT_LIVEKIT_URL = import.meta?.env?.VITE_LIVEKIT_URL || 'wss://hackathon-zxouyjdx.livekit.cloud';

const AVATAR_PALETTE = [
  ['#E0ECFF', '#CADBFF'],
  ['#EAF8E7', '#D5F0CF'],
  ['#FFEBD9', '#FFD9BE'],
  ['#F4E9FF', '#E6D8FF'],
  ['#DFF6F6', '#CBECEC'],
  ['#FFE8EC', '#FFD2DB'],
];

const getName = (participant) => participant?.name || participant?.identity || 'Participant';
const getInitials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

const hashNameToGradient = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
};

const formatTime = (dateLike) => {
  const date = dateLike ? new Date(dateLike) : new Date();
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ControlIcon = ({ path, className = 'mrp-icon' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d={path} />
  </svg>
);

const MeetingRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { livekitToken, livekitUrl, isHost, meetingTitle, displayName } = location.state || {};

  useEffect(() => {
    if (!livekitToken) navigate(`/join/${roomId}`);
  }, [livekitToken, roomId, navigate]);

  if (!livekitToken) return null;

  return (
    <div className="mrp-page">
      <LiveKitRoom
        video
        audio
        token={livekitToken}
        serverUrl={livekitUrl || DEFAULT_LIVEKIT_URL}
        onDisconnected={() => navigate('/dashboard')}
        className="mrp-room-shell"
      >
        <RoomContent
          roomId={roomId}
          isHost={Boolean(isHost)}
          meetingTitle={meetingTitle || 'Team Meeting'}
          displayName={displayName}
          onLeave={() => navigate('/dashboard')}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const RoomContent = ({ roomId, isHost, meetingTitle, displayName, onLeave }) => {
  const room = useRoomContext();
  const participants = useParticipants();
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const recognitionRef = useRef(null);
  const mockIntervalRef = useRef(null);

  const cameraTrackMap = useMemo(() => {
    const map = new Map();
    cameraTracks.forEach((trackRef) => {
      map.set(trackRef.participant.identity, trackRef);
    });
    return map;
  }, [cameraTracks]);

  const participantCount = participants.length;

  // Poll for transcript if recording is active
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('smis_token');
          const res = await fetch(`${API_BASE}/api/meetings/room/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.meeting && data.meeting.transcript) {
            setTranscript(data.meeting.transcript);
          }
        } catch (err) {
          console.error('Polling transcript error:', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isRecording, roomId]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {
      // best effort
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    await send(trimmed);
    setMessage('');
  };

  const pushTranscriptEntry = async (entry) => {
    setTranscript((prev) => [...prev, entry]);
    try {
      const token = localStorage.getItem('smis_token');
      await fetch(`${API_BASE}/api/meetings/room/${roomId}/transcript`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.error('Transcript POST error:', err);
    }
  };

  const startMockTranscription = () => {
    if (mockIntervalRef.current) return;
    let counter = 1;
    mockIntervalRef.current = setInterval(() => {
      const speaker = counter % 2 === 0 ? 'LiveKit Screen' : 'LiveKit Audio';
      const text = `${speaker} transcript sample ${counter} at ${new Date().toLocaleTimeString()}`;
      pushTranscriptEntry({ speaker, text, timestamp: new Date() });
      counter += 1;
    }, 3000);
  };

  const stopMockTranscription = () => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  };

  const startSpeechTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      const trimmed = finalText.trim();
      if (trimmed) {
        pushTranscriptEntry({
          speaker: displayName || 'You',
          text: trimmed,
          timestamp: new Date(),
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event);
    };

    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch (err) {
          console.error('SpeechRecognition restart failed:', err);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    return true;
  };

  const stopSpeechTranscription = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // best effort
      }
      recognitionRef.current = null;
    }
  };

  const handleRecord = async () => {
    if (isRecording) return;
    setIsRecording(true);
    const started = startSpeechTranscription();
    if (!started) {
      startMockTranscription();
    }
  };

  const handleLeave = async () => {
    if (isHost) {
      try {
        const token = localStorage.getItem('smis_token');
        await fetch(`${API_BASE}/api/meetings/end/${roomId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // best effort
      }
    }
    stopSpeechTranscription();
    stopMockTranscription();
    setIsRecording(false);
    await room.disconnect();
    onLeave();
  };

  const toggleMic = async () => {
    await localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant?.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    await localParticipant?.setScreenShareEnabled(!isScreenShareEnabled);
  };

  const videoGridClass = useMemo(() => {
    if (participantCount <= 1) return 'mrp-grid-cols-1';
    if (participantCount === 2) return 'mrp-grid-cols-2';
    if (participantCount <= 4) return 'mrp-grid-cols-4';
    if (participantCount <= 6) return 'mrp-grid-cols-6';
    return 'mrp-grid-cols-auto';
  }, [participantCount]);

  return (
    <div className="mrp-layout">
      <motion.header
        className="mrp-topbar"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mrp-topbar-left">
          <h1 className="mrp-meeting-title">{meetingTitle}</h1>
          <span className="mrp-live-pill">
            <span className="mrp-live-dot" />
            LIVE
          </span>
        </div>
        <div className="mrp-topbar-right">
          <button className="mrp-room-pill" onClick={copyRoomId} title="Copy Room ID">
            <span className="mrp-room-id">{roomId?.slice(0, 8)}</span>
            <ControlIcon path="M8 16h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2zM5 19h9a2 2 0 0 0 2-2" />
          </button>
          <span className="mrp-count-pill">{participantCount}</span>
          <button className="mrp-icon-btn" onClick={() => setSettingsOpen((v) => !v)} title="Settings">
            <ControlIcon path="M10.325 4.317a1 1 0 0 1 1.35-.936l.75.3a1 1 0 0 0 .95 0l.75-.3a1 1 0 0 1 1.35.936l.044.808a1 1 0 0 0 .528.844l.706.393a1 1 0 0 1 .362 1.37l-.394.706a1 1 0 0 0 0 .95l.394.706a1 1 0 0 1-.362 1.37l-.706.393a1 1 0 0 0-.528.844l-.044.808a1 1 0 0 1-1.35.936l-.75-.3a1 1 0 0 0-.95 0l-.75.3a1 1 0 0 1-1.35-.936l-.044-.808a1 1 0 0 0-.528-.844l-.706-.393a1 1 0 0 1-.362-1.37l.394-.706a1 1 0 0 0 0-.95l-.394-.706a1 1 0 0 1 .362-1.37l.706-.393a1 1 0 0 0 .528-.844zM12 9.75A2.25 2.25 0 1 0 12 14.25 2.25 2.25 0 0 0 12 9.75z" />
          </button>
        </div>
      </motion.header>

      <div className="mrp-main">
        <aside className={`mrp-sidebar ${participantsOpen ? 'open' : 'closed'}`}>
          <div className="mrp-panel-header">
            <h2>Participants</h2>
            <span>{participantCount}</span>
          </div>
          <div className="mrp-participant-list">
            {participants.map((participant) => {
              const participantName = getName(participant);
              const isParticipantHost =
                participant.identity === localParticipant.identity
                  ? isHost
                  : (() => {
                      try {
                        return JSON.parse(participant.metadata || '{}').isHost === true;
                      } catch {
                        return false;
                      }
                    })();

              return (
                <div key={participant.identity} className="mrp-participant-row">
                  <div
                    className="mrp-small-avatar"
                    style={{ backgroundImage: hashNameToGradient(participantName) }}
                  >
                    {getInitials(participantName)}
                  </div>
                  <div className="mrp-participant-meta">
                    <div className="mrp-participant-name-wrap">
                      <span className="mrp-participant-name">{participantName}</span>
                      {isParticipantHost && <span className="mrp-host-pill">Host</span>}
                    </div>
                    {participant.identity === localParticipant.identity && displayName ? (
                      <span className="mrp-participant-you">{displayName}</span>
                    ) : null}
                  </div>
                  <div className="mrp-participant-status">
                    <span className={participant.isMicrophoneEnabled ? 'ok' : 'muted'}>
                      <ControlIcon path="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3" />
                    </span>
                    <span className={participant.isCameraEnabled ? 'ok' : 'muted'}>
                      <ControlIcon path="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="mrp-video-zone">
          <div className={`mrp-video-grid ${videoGridClass}`}>
            <AnimatePresence>
              {participants.map((participant, index) => {
                const participantName = getName(participant);
                const trackRef = cameraTrackMap.get(participant.identity);
                const hasVideo = Boolean(trackRef && participant.isCameraEnabled);

                return (
                  <motion.article
                    key={participant.identity}
                    className={`mrp-video-tile ${participant.isSpeaking ? 'speaking' : ''}`}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: index * 0.08, ease: 'easeOut' }}
                    layout
                  >
                    {hasVideo ? (
                      <VideoTrack trackRef={trackRef} className="mrp-video-element" />
                    ) : (
                      <div className="mrp-video-placeholder">
                        <div
                          className="mrp-avatar-big"
                          style={{ backgroundImage: hashNameToGradient(participantName) }}
                        >
                          {getInitials(participantName)}
                        </div>
                      </div>
                    )}
                    <div className="mrp-tile-name-pill">{participantName}</div>
                    {!participant.isMicrophoneEnabled && (
                      <div className="mrp-muted-badge">
                        <ControlIcon path="M19 11v1a7 7 0 0 1-11.65 5.18M9 9v2a3 3 0 0 0 5.12 2.12M12 18v3M4 4l16 16" />
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        <aside className={`mrp-chat-panel ${chatOpen ? 'open' : 'closed'}`}>
          <div className="mrp-panel-header">
            <h2>In-Meeting Chat</h2>
          </div>
          <div className="mrp-chat-messages">
            {chatMessages.map((msg) => {
              const mine = msg.from?.identity === localParticipant.identity;
              const senderName = msg.from?.name || msg.from?.identity || 'Participant';
              return (
                <div key={msg.id || `${msg.timestamp}-${msg.message}`} className={`mrp-msg-row ${mine ? 'mine' : 'other'}`}>
                  <div className="mrp-msg-sender">{senderName}</div>
                  <div className="mrp-msg-bubble">{msg.message}</div>
                  <div className="mrp-msg-time">{formatTime(msg.timestamp)}</div>
                </div>
              );
            })}
          </div>
          <div className="mrp-chat-input-wrap">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message"
              className="mrp-chat-input"
            />
            <button onClick={handleSend} className="mrp-send-btn" disabled={isSending || !message.trim()}>
              <ControlIcon path="M5 12h14M13 6l6 6-6 6" />
            </button>
          </div>
        </aside>

        <aside className={`mrp-transcript-panel ${transcriptOpen ? 'open' : 'closed'}`}>
          <div className="mrp-panel-header">
            <h2>Live Transcript</h2>
            <div className={`mrp-rec-indicator ${isRecording ? 'active' : ''}`}>
               <span className="mrp-rec-dot" />
               REC
            </div>
          </div>
          <div className="mrp-transcript-content">
            {transcript.length === 0 ? (
              <p className="mrp-empty-transcript">No transcription yet...</p>
            ) : (
              transcript.map((entry, i) => (
                <div key={i} className="mrp-transcript-entry">
                  <span className="mrp-transcript-speaker">{entry.speaker || 'Unknown'}:</span>
                  <p className="mrp-transcript-text">{entry.text}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <motion.div
        className="mrp-controls"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <button className={`mrp-control-btn ${!isMicrophoneEnabled ? 'off' : ''}`} onClick={toggleMic} title="Mute">
          <ControlIcon path="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3" />
        </button>
        <button className={`mrp-control-btn ${!isCameraEnabled ? 'off' : ''}`} onClick={toggleCamera} title="Camera">
          <ControlIcon path="M15 10l4.553-2.069A1 1 0 0 1 21 8.868v6.264a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
        </button>
        <button className="mrp-control-btn" onClick={toggleScreenShare} title="Screen Share">
          <ControlIcon path="M3 4h18v12H3zM8 20h8M12 16v4" />
        </button>
        <button className={`mrp-control-btn ${participantsOpen ? 'on' : ''}`} onClick={() => setParticipantsOpen((v) => !v)} title="Participants">
          <ControlIcon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </button>
        <button className={`mrp-control-btn ${chatOpen ? 'on' : ''}`} onClick={() => setChatOpen((v) => !v)} title="Chat">
          <ControlIcon path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z" />
        </button>
        <button className={`mrp-control-btn ${transcriptOpen ? 'on' : ''}`} onClick={() => setTranscriptOpen((v) => !v)} title="Transcript">
          <ControlIcon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </button>
        {isHost && (
          <button 
            className={`mrp-control-btn mrp-record-btn ${isRecording ? 'active' : ''}`} 
            onClick={handleRecord} 
            disabled={isRecording}
            title={isRecording ? "Transcribing..." : "Start Transcription"}
          >
            <span className="mrp-record-dot-icon" />
            <span className="mrp-record-label">{isRecording ? "REC" : "Transcribe"}</span>
          </button>
        )}
        <button className="mrp-leave-btn" onClick={handleLeave}>
          <ControlIcon path="M17 16l4-4m0 0-4-4m4 4H7M3 20h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H3" />
          <span>Leave</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            className="mrp-settings-toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            Meeting settings panel coming next.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeetingRoom;
