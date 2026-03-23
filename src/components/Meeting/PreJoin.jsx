import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:4000';

const PreJoin = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [displayName, setDisplayName] = useState(user?.fullName || user?.name || '');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const meetingDateLabel = meeting?.date
    ? new Date(meeting.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchMeeting();
  }, [roomId, user]);

  const fetchMeeting = async () => {
    try {
      const token = localStorage.getItem('smis_token');
      const res = await fetch(`${API_BASE}/api/meetings/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('Meeting not found or you do not have access.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMeeting(data.meeting);
      setIsHost(data.isHost);
    } catch (e) {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setJoining(true);
    setError(null);

    try {
      const token = localStorage.getItem('smis_token');
      const res = await fetch(`${API_BASE}/api/meetings/join/${roomId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join.');
        setJoining(false);
        return;
      }

      // Redirect to the actual room, passing the LiveKit token via state
      navigate(`/room/${roomId}`, {
        state: {
          livekitToken: data.token,
          livekitUrl: data.livekitUrl,
          isHost: data.isHost,
          meetingTitle: data.meetingTitle,
          displayName,
        },
      });
    } catch (err) {
      setError('Connection error. Please try again.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faff]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faff] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-sm text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Meeting Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e8f0fe] p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {isHost ? 'You are the Host' : 'Joining as Participant'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{meeting?.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meetingDateLabel}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-blue-50 p-8">
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
                placeholder="How should others see you?"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {isHost && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Host Access</p>
                  <p className="text-xs text-blue-600 mt-0.5">You can mute participants, share screen, and end the meeting.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={joining || !displayName.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {isHost ? 'Start Meeting' : 'Join Meeting'}
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by LiveKit · End-to-end encrypted
        </p>
      </div>
    </div>
  );
};

export default PreJoin;
