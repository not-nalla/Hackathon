import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useLocalParticipant,
  RoomAudioRenderer,
  Chat,
  useRoomContext,
} from '@livekit/components-react';
import './livekit-styles.css';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:4000';

const MeetingRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { livekitToken, livekitUrl, isHost, meetingTitle, displayName } = location.state || {};

  // If no token (direct URL access), redirect to pre-join
  useEffect(() => {
    if (!livekitToken) {
      navigate(`/join/${roomId}`);
    }
  }, [livekitToken, roomId, navigate]);

  if (!livekitToken) return null;

  const handleDisconnected = () => navigate('/dashboard');

  return (
    <div className="h-screen bg-gray-950 overflow-hidden flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">{meetingTitle || 'Meeting'}</h1>
            <p className="text-gray-400 text-xs">Room: {roomId?.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <span className="flex items-center gap-1.5 bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
              HOST
            </span>
          )}
          <span className="text-gray-400 text-xs hidden sm:block">{displayName}</span>
        </div>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        video={true}
        audio={true}
        token={livekitToken}
        serverUrl={livekitUrl || 'wss://hackathon-zxouyjdx.livekit.cloud'}
        onDisconnected={handleDisconnected}
        className="flex-1 flex overflow-hidden"
        data-lk-theme="default"
      >
        <RoomContent isHost={isHost} roomId={roomId} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const RoomContent = ({ isHost, roomId }) => {
  const participants = useParticipants();
  const [chatOpen, setChatOpen] = useState(true);
  const navigate = useNavigate();

  // Host presence check: is any participant metadata.isHost = true?
  const hostPresent = participants.some(p => {
    try { return JSON.parse(p.metadata || '{}').isHost; }
    catch { return false; }
  });

  const endMeeting = useCallback(async () => {
    if (!window.confirm('End meeting for everyone?')) return;
    try {
      const token = localStorage.getItem('smis_token');
      await fetch(`${API_BASE}/api/meetings/end/${roomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { /* best effort */ }
    navigate('/dashboard');
  }, [roomId, navigate]);

  // Waiting for host screen (only for non-hosts when no host is present)
  if (!isHost && !hostPresent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-white text-center px-6">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          The meeting will start automatically once the host joins. Please keep this tab open.
        </p>
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="mt-10 px-5 py-2.5 text-sm text-gray-400 border border-gray-700 rounded-xl hover:border-gray-500 hover:text-gray-200 transition-all">
          Leave & Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Video area */}
      <div className="flex-1 flex flex-col relative bg-gray-950 overflow-hidden">
        {/* Host Controls Overlay */}
        {isHost && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-white text-xs font-bold tracking-wide">LIVE · HOST</span>
            </div>
            <button
              onClick={endMeeting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-red-500/30 transition-all active:scale-95 shadow-lg shadow-red-900/30"
            >
              End for All
            </button>
          </div>
        )}

        <VideoConference />
      </div>

      {/* Chat Sidebar */}
      <div className={`${chatOpen ? 'w-80' : 'w-0'} flex flex-col bg-gray-900 border-l border-gray-800 transition-all overflow-hidden shrink-0`}>
        {chatOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
              <span className="text-sm font-semibold text-gray-300">In-Meeting Chat</span>
              <button onClick={() => setChatOpen(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat />
            </div>
          </>
        )}
      </div>

      {/* Chat toggle button (when closed) */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-24 right-4 z-30 p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-all shadow-xl"
          title="Open Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MeetingRoom;
