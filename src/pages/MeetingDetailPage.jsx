import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

const parseMeetingDateTime = (meeting) => {
  if (!meeting) return null;
  if (meeting.date) {
    const direct = new Date(meeting.date);
    if (!Number.isNaN(direct.getTime())) return direct;
  }
  const datePart = meeting.meetingDate || meeting.scheduledDate;
  const timePart = meeting.time || meeting.meetingTime;
  if (datePart || timePart) {
    const composed = new Date(`${datePart || ""} ${timePart || ""}`.trim());
    if (!Number.isNaN(composed.getTime())) return composed;
  }
  return null;
};

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { meetings } = useAppData();
  const [summary, setSummary] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("");

  const meeting = useMemo(
    () =>
      (meetings || []).find((item) => String(item?._id || item?.id || item?.roomId) === String(id)),
    [id, meetings]
  );

  if (!meeting) {
    return (
      <div className="dashboard-theme dashboard-detail-page">
        <div className="dashboard-detail-card">
          <h1>Meeting not found</h1>
          <p>The selected meeting does not exist or is not available.</p>
          <Link to="/dashboard?tab=meetings" className="dashboard-detail-link">Back to Meetings</Link>
        </div>
      </div>
    );
  }

  const date = parseMeetingDateTime(meeting);
  const participants = meeting.participants || meeting.attendees || [];

  const handleSummarize = async () => {
    setSummaryStatus("Summarizing...");
    try {
      const token = localStorage.getItem("smis_token");
      const res = await fetch(`${API_BASE}/api/meetings/${meeting._id || meeting.roomId}/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to summarize meeting");
      setSummary(data.summary || "No summary generated.");
      setSummaryStatus("");
    } catch (err) {
      setSummaryStatus(err.message || "Summary failed.");
    }
  };

  return (
    <div className="dashboard-theme dashboard-detail-page">
      <div className="dashboard-detail-card">
        <h1>{meeting.title || "Untitled meeting"}</h1>
        <p className="dashboard-detail-sub">Meeting Details</p>

        <div className="dashboard-detail-grid">
          <div>
            <span>Title</span>
            <p>{meeting.title || "Untitled meeting"}</p>
          </div>
          <div>
            <span>Status</span>
            <p>{meeting.status || "Scheduled"}</p>
          </div>
          <div>
            <span>Date</span>
            <p>{date ? date.toLocaleDateString([], { dateStyle: "full" }) : "No date"}</p>
          </div>
          <div>
            <span>Time</span>
            <p>{date ? date.toLocaleTimeString([], { timeStyle: "short" }) : "No time"}</p>
          </div>
          <div>
            <span>Room ID</span>
            <p>{meeting.roomId || "Not available"}</p>
          </div>
          <div>
            <span>Participants</span>
            <p>{participants.length ? participants.join(", ") : "No participants listed"}</p>
          </div>
          <div>
            <span>Description</span>
            <p>{meeting.description || meeting.desc || "No description available"}</p>
          </div>
        </div>

        {meeting.transcript && meeting.transcript.length > 0 && (
          <div className="dashboard-detail-transcript-section">
            <h3>Meeting Transcript</h3>
            <div className="dashboard-detail-transcript-list">
              {meeting.transcript.map((entry, idx) => (
                <div key={idx} className="dashboard-detail-transcript-item">
                  <span className="speaker">{entry.speaker || 'Unknown'}:</span>
                  <p>{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-detail-transcript-section">
          <div className="dashboard-detail-actions" style={{ marginBottom: 12 }}>
            <button className="btn btn-pill" onClick={handleSummarize}>
              View Summary
            </button>
            {summaryStatus ? <span className="dashboard-detail-sub">{summaryStatus}</span> : null}
          </div>
          {summary || meeting.summary ? (
            <>
              <h3>Meeting Summary</h3>
              <div className="dashboard-detail-transcript-list">
                {(summary || meeting.summary).split("\n").map((line, idx) => (
                  <div key={idx} className="dashboard-detail-transcript-item">
                    <p>{line}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="dashboard-detail-actions">
          <Link to="/dashboard?tab=meetings" className="dashboard-detail-link">Back to Meetings</Link>
        </div>
      </div>
    </div>
  );
}
