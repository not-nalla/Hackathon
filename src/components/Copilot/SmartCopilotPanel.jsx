/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SendHorizontal } from "lucide-react";
import { useAppData } from "../../contexts/AppDataContext";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

const CHIPS = [
  "When is my next meeting",
  "What tasks are due today",
  "Show my overdue tasks",
  "Give me today's full summary",
  "Show high priority tasks",
  "How many meetings do I have this week",
];

const toDateStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDate = (date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatBubbleTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const parseMeetingDateTime = (meeting) => {
  if (!meeting) return null;
  if (meeting.date) {
    const direct = new Date(meeting.date);
    if (!Number.isNaN(direct.getTime())) return direct;
  }

  const combined = `${meeting.meetingDate || meeting.scheduledDate || ""} ${meeting.time || meeting.meetingTime || ""}`.trim();
  if (!combined) return null;
  const parsed = new Date(combined);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseTaskDate = (task, keyList) => {
  for (const key of keyList) {
    const raw = task?.[key];
    if (!raw) continue;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const taskStatus = (task) => {
  const status = String(task?.status || "").toLowerCase();
  if (status) return status;
  return task?.done ? "completed" : "pending";
};

const meetingStatus = (meeting, now) => {
  const raw = String(meeting?.status || "").toLowerCase();
  if (raw) {
    if (raw.includes("live") || raw.includes("inprogress")) return "live";
    if (raw.includes("complete")) return "completed";
    if (raw.includes("upcoming") || raw.includes("scheduled")) return "upcoming";
  }

  const start = parseMeetingDateTime(meeting);
  if (!start) return "upcoming";
  const durationMinutes = Number(meeting?.duration || meeting?.dur || 60);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  if (now >= start && now <= end) return "live";
  if (now > end) return "completed";
  return "upcoming";
};

const getCurrentWeekRange = (now) => {
  const date = new Date(now);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = toDateStart(new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday));
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { monday, sunday };
};

const tryParseTaskForDate = (messageLower, now) => {
  const marker = "task for";
  const index = messageLower.indexOf(marker);
  if (index === -1) return null;
  const rawTarget = messageLower.slice(index + marker.length).trim();
  if (!rawTarget) return null;

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayIndex = weekdays.findIndex((day) => rawTarget.includes(day));
  if (weekdayIndex !== -1) {
    const current = now.getDay();
    const delta = (weekdayIndex - current + 7) % 7;
    const parsed = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta);
    return toDateStart(parsed);
  }

  const year = now.getFullYear();
  const parsedDate = new Date(`${rawTarget} ${year}`);
  if (!Number.isNaN(parsedDate.getTime())) return toDateStart(parsedDate);

  const parsedFallback = new Date(rawTarget);
  if (!Number.isNaN(parsedFallback.getTime())) return toDateStart(parsedFallback);
  return null;
};

const meetingListLines = (meeting, now) => {
  const start = parseMeetingDateTime(meeting);
  const participants = (meeting?.participants || meeting?.attendees || []).join(", ") || "No participants listed";
  const status = meetingStatus(meeting, now);
  return [
    `${meeting?.title || "Untitled meeting"}`,
    `${start ? `${formatDate(start)} ${formatTime(start)}` : "No schedule set"}`,
    `Room ID: ${meeting?.roomId || "Not available"}`,
    `Status: ${status}`,
    `Participants: ${participants}`,
  ];
};

const taskListLines = (task) => {
  const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
  const priority = String(task?.priority || "medium").toLowerCase();
  return [
    `${task?.name || "Untitled task"}`,
    `Due Date: ${due ? formatDate(due) : "No due date"}`,
    `Priority: ${priority}`,
    `Status: ${taskStatus(task)}`,
  ];
};

export const generateResponse = (userMessage, meetings, tasks, user) => {
  const now = new Date();
  const messageLower = String(userMessage || "").toLowerCase();
  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const requesterName = String(user?.fullName || user?.displayName || user?.email || "there")
    .split("@")[0]
    .split(" ")[0];
  const followUp = `Would you like more details about any of these, ${requesterName}?`;

  const meetingsWithDate = safeMeetings
    .map((meeting) => ({ meeting, date: parseMeetingDateTime(meeting) }))
    .filter((item) => item.date);

  if (messageLower.includes("next meeting")) {
    const upcoming = meetingsWithDate
      .filter((item) => item.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    if (!upcoming) {
      return `You have no upcoming meetings scheduled right now.\n\n${followUp}`;
    }

    const details = meetingListLines(upcoming.meeting, now);
    return `${details.join("\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("today") && messageLower.includes("meeting")) {
    const today = toDateStart(now);
    const todaysMeetings = meetingsWithDate.filter((item) => toDateStart(item.date).getTime() === today.getTime());
    if (!todaysMeetings.length) return `You have no meetings today.\n\n${followUp}`;

    return `${todaysMeetings
      .map((item) => {
        const status = meetingStatus(item.meeting, now);
        return `${item.meeting.title || "Untitled meeting"}\n${formatDate(item.date)} ${formatTime(item.date)}\nRoom ID: ${item.meeting.roomId || "Not available"}\nStatus: ${status}`;
      })
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("tomorrow") && messageLower.includes("meeting")) {
    const tomorrow = toDateStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const tomorrowMeetings = meetingsWithDate.filter((item) => toDateStart(item.date).getTime() === tomorrow.getTime());
    if (!tomorrowMeetings.length) return `You have no meetings tomorrow.\n\n${followUp}`;

    return `${tomorrowMeetings
      .map((item) => `${item.meeting.title || "Untitled meeting"}\n${formatDate(item.date)} ${formatTime(item.date)}\nRoom ID: ${item.meeting.roomId || "Not available"}\nStatus: ${meetingStatus(item.meeting, now)}`)
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("all meetings") || messageLower.includes("meetings this week")) {
    const { monday, sunday } = getCurrentWeekRange(now);
    const weekly = meetingsWithDate.filter((item) => toDateStart(item.date) >= monday && toDateStart(item.date) <= sunday);
    if (!weekly.length) return `You have no meetings this week.\n\n${followUp}`;

    return `${weekly
      .map((item) => `${item.meeting.title || "Untitled meeting"}\n${formatDate(item.date)} ${formatTime(item.date)}\nRoom ID: ${item.meeting.roomId || "Not available"}\nStatus: ${meetingStatus(item.meeting, now)}`)
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("pending tasks") || messageLower.includes("remaining tasks")) {
    const pending = safeTasks.filter((task) => ["pending", "in progress", "inprogress"].includes(taskStatus(task)));
    if (!pending.length) return `All tasks are completed right now.\n\n${followUp}`;
    return `${pending.map((task) => taskListLines(task).join("\n")).join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("overdue")) {
    const todayStart = toDateStart(now);
    const overdue = safeTasks.filter((task) => {
      const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
      return due && toDateStart(due) < todayStart && taskStatus(task) !== "completed";
    });
    if (!overdue.length) return `You have no overdue tasks.\n\n${followUp}`;

    return `${overdue
      .map((task) => {
        const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
        const daysOverdue = due ? Math.max(1, Math.floor((todayStart.getTime() - toDateStart(due).getTime()) / 86400000)) : 0;
        return `${task.name || "Untitled task"}\nDue Date: ${due ? formatDate(due) : "No due date"}\nPriority: ${task.priority || "medium"}\nStatus: ${taskStatus(task)}\nOverdue by: ${daysOverdue} day(s)`;
      })
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("today") && messageLower.includes("task")) {
    const today = toDateStart(now);
    const todayTasks = safeTasks.filter((task) => {
      const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
      return due && toDateStart(due).getTime() === today.getTime();
    });
    if (!todayTasks.length) return `You have no tasks due today.\n\n${followUp}`;
    return `${todayTasks.map((task) => taskListLines(task).join("\n")).join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("completed tasks")) {
    const completed = safeTasks.filter((task) => taskStatus(task) === "completed");
    if (!completed.length) return `You have no completed tasks yet.\n\n${followUp}`;
    return `Total completed tasks: ${completed.length}\n\n${completed
      .map((task) => {
        const completedDate = parseTaskDate(task, ["completedDate", "updatedAt", "dueDate", "deadline"]);
        return `${task.name || "Untitled task"}\nCompleted On: ${completedDate ? formatDate(completedDate) : "Date not available"}`;
      })
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("high priority")) {
    const highPriority = safeTasks.filter((task) => String(task.priority || "").toLowerCase() === "high" && taskStatus(task) !== "completed");
    if (!highPriority.length) return `You have no high priority pending tasks.\n\n${followUp}`;
    return `${highPriority.map((task) => taskListLines(task).join("\n")).join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("productivity")) {
    const total = safeTasks.length;
    const completedCount = safeTasks.filter((task) => taskStatus(task) === "completed").length;
    const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    if (percent === 100 && total > 0) {
      return `Your productivity is ${percent} percent. You have completed ${completedCount} out of ${total} tasks. All tasks are completed, great work.\n\n${followUp}`;
    }
    return `Your productivity is ${percent} percent. You have completed ${completedCount} out of ${total} tasks.\n\n${followUp}`;
  }

  if (messageLower.includes("task for")) {
    const parsedTarget = tryParseTaskForDate(messageLower, now);
    if (!parsedTarget) return `I could not parse that date. Please ask like "task for monday" or "task for 25 march".\n\n${followUp}`;
    const targetTasks = safeTasks.filter((task) => {
      const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
      return due && toDateStart(due).getTime() === parsedTarget.getTime();
    });
    if (!targetTasks.length) return `You have no tasks for ${formatDate(parsedTarget)}.\n\n${followUp}`;
    return `${targetTasks.map((task) => taskListLines(task).join("\n")).join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("how many meetings")) {
    const totals = safeMeetings.reduce(
      (acc, meeting) => {
        const status = meetingStatus(meeting, now);
        acc.total += 1;
        if (status === "upcoming") acc.upcoming += 1;
        if (status === "completed") acc.completed += 1;
        if (status === "live") acc.live += 1;
        return acc;
      },
      { total: 0, upcoming: 0, completed: 0, live: 0 }
    );
    return `Total meetings: ${totals.total}\nUpcoming meetings: ${totals.upcoming}\nCompleted meetings: ${totals.completed}\nLive meetings: ${totals.live}\n\n${followUp}`;
  }

  if (messageLower.includes("live") || messageLower.includes("ongoing")) {
    const liveMeetings = safeMeetings.filter((meeting) => meetingStatus(meeting, now) === "live");
    if (!liveMeetings.length) return `You have no live meetings right now.\n\n${followUp}`;
    return `${liveMeetings
      .map((meeting) => `${meeting.title || "Untitled meeting"}\n${formatDate(parseMeetingDateTime(meeting) || now)} ${formatTime(parseMeetingDateTime(meeting) || now)}\nRoom ID: ${meeting.roomId || "Not available"}\nStatus: live`)
      .join("\n\n")}\n\n${followUp}`;
  }

  if (messageLower.includes("summary") || messageLower.includes("today summary")) {
    const today = toDateStart(now);
    const todayMeetings = meetingsWithDate.filter((item) => toDateStart(item.date).getTime() === today.getTime()).length;
    const todayTasks = safeTasks.filter((task) => {
      const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
      return due && toDateStart(due).getTime() === today.getTime();
    }).length;
    const pendingCount = safeTasks.filter((task) => ["pending", "in progress", "inprogress"].includes(taskStatus(task))).length;
    const overdueCount = safeTasks.filter((task) => {
      const due = parseTaskDate(task, ["dueDate", "deadline", "due"]);
      return due && toDateStart(due) < today && taskStatus(task) !== "completed";
    }).length;
    const nextMeeting = meetingsWithDate
      .filter((item) => item.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const nextLine = nextMeeting
      ? `${nextMeeting.meeting.title || "Untitled meeting"} at ${formatTime(nextMeeting.date)}`
      : "No upcoming meeting";

    return `Today's meetings: ${todayMeetings}\nToday's tasks: ${todayTasks}\nPending tasks: ${pendingCount}\nOverdue tasks: ${overdueCount}\nNext upcoming meeting: ${nextLine}\n\n${followUp}`;
  }

  const matchedMeeting = safeMeetings.find((meeting) => {
    const title = String(meeting?.title || "").toLowerCase();
    return title && (messageLower.includes(title) || title.includes(messageLower));
  });
  if (matchedMeeting) {
    const start = parseMeetingDateTime(matchedMeeting);
    const status = meetingStatus(matchedMeeting, now);
    const participants = (matchedMeeting.participants || matchedMeeting.attendees || []).join(", ") || "No participants listed";
    const duration = matchedMeeting.duration || matchedMeeting.dur || "Not specified";
    const completedLine = status === "completed" && start ? `Completed On: ${formatDate(start)}` : "";
    return `${matchedMeeting.title || "Untitled meeting"}\nDate: ${start ? formatDate(start) : "Not available"}\nTime: ${start ? formatTime(start) : "Not available"}\nRoom ID: ${matchedMeeting.roomId || "Not available"}\nParticipants: ${participants}\nDuration: ${duration}\nStatus: ${status}${completedLine ? `\n${completedLine}` : ""}\n\n${followUp}`;
  }

  if (!safeMeetings.length && !safeTasks.length) {
    return `I currently see no meetings scheduled and no tasks assigned in your workspace.\n\n${followUp}`;
  }
  if (!safeMeetings.length) {
    return `I currently see no meetings scheduled in your workspace.\n\n${followUp}`;
  }
  if (!safeTasks.length) {
    return `I currently see no tasks assigned in your workspace.\n\n${followUp}`;
  }

  return `I can help with meetings, tasks, schedule, deadlines, productivity, and specific meeting details. Try asking "When is my next meeting", "What tasks are due today", or "Show my overdue tasks".\n\n${followUp}`;
};

export default function SmartCopilotPanel({ open, onClose, user }) {
  const { meetings, tasks } = useAppData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("workspace");
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const bottomRef = useRef(null);

  const hasUserMessage = useMemo(() => messages.some((msg) => msg.role === "user"), [messages]);
  const selectedMeeting = useMemo(
    () => (Array.isArray(meetings) ? meetings.find((meeting) => meeting._id === selectedMeetingId || meeting.roomId === selectedMeetingId) : null),
    [meetings, selectedMeetingId]
  );

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const appendMessage = (role, text) => {
    const timestamp = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: `${role}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`, role, text, timestamp },
    ]);
  };

  const callMeetingSummary = async () => {
    if (!selectedMeetingId) {
      appendMessage("assistant", "Please choose a meeting first.");
      return;
    }
    setIsBusy(true);
    appendMessage("assistant", "Summarizing the meeting transcript...");
    try {
      const token = localStorage.getItem("smis_token");
      const res = await fetch(`${API_BASE}/api/meetings/${selectedMeetingId}/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to summarize meeting");
      appendMessage("assistant", data.summary || "No summary generated.");
    } catch (err) {
      appendMessage("assistant", err.message || "Summary failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const callMeetingQA = async (question) => {
    if (!selectedMeetingId) {
      appendMessage("assistant", "Please choose a meeting first.");
      return;
    }
    setIsBusy(true);
    try {
      const token = localStorage.getItem("smis_token");
      const res = await fetch(`${API_BASE}/api/meetings/${selectedMeetingId}/qa`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to answer question");
      appendMessage("assistant", data.answer || "No answer generated.");
    } catch (err) {
      appendMessage("assistant", err.message || "Q&A failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const sendMessage = (rawText) => {
    const text = String(rawText || "").trim();
    if (!text) return;

    const sentAt = new Date();
    setMessages((prev) => [
      ...prev,
      { id: `u-${sentAt.getTime()}`, role: "user", text, timestamp: sentAt.toISOString() },
    ]);
    setInput("");

    if (mode === "meeting") {
      callMeetingQA(text);
      return;
    }

    const botReply = generateResponse(text, meetings, tasks, user);
    appendMessage("assistant", botReply);
  };

  const onChipClick = (chip) => {
    setInput(chip);
    sendMessage(chip);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-30"
            onClick={onClose}
          />
          <div
            className="fixed top-0 left-60 h-full w-[380px] z-40 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-text)]">Meeting Copilot</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-[var(--color-text-secondary)]">AI Online</span>
                </div>
              </div>
              <button onClick={onClose} className="btn btn-ghost w-7 h-7 rounded-lg text-[var(--color-text-secondary)]">
                x
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[var(--color-border)] space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode("meeting")}
                  className={`btn btn-pill text-[11px] ${mode === "meeting" ? "btn-primary" : ""}`}
                >
                  Meeting Mode
                </button>
                <button
                  onClick={() => setMode("workspace")}
                  className={`btn btn-pill text-[11px] ${mode === "workspace" ? "btn-primary" : ""}`}
                >
                  Workspace Mode
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMeetingId}
                  onChange={(event) => setSelectedMeetingId(event.target.value)}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-[12px] text-[var(--color-text)]"
                >
                  <option value="">Select a meeting</option>
                  {(Array.isArray(meetings) ? meetings : []).map((meeting) => (
                    <option key={meeting._id || meeting.roomId} value={meeting._id || meeting.roomId}>
                      {meeting.title || "Untitled meeting"} · {meeting.roomId || meeting._id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={callMeetingSummary}
                  className="btn btn-pill text-[11px]"
                  disabled={!selectedMeetingId || isBusy}
                >
                  Summarize
                </button>
              </div>
              {selectedMeeting ? (
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Active meeting: {selectedMeeting.title || "Untitled meeting"}
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#3B5BDB] text-white rounded-[16px_16px_4px_16px]"
                          : "bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[16px_16px_16px_4px]"
                      }`}
                    >
                      {msg.text.split("\n").map((line, index) => (
                        <React.Fragment key={`${msg.id}-${index}`}>
                          {line}
                          {index < msg.text.split("\n").length - 1 ? <br /> : null}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="text-[11px] mt-1 text-[var(--color-text-muted)]">{formatBubbleTime(new Date(msg.timestamp))}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {!hasUserMessage && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => onChipClick(chip)}
                    className="btn btn-pill text-[11px]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 bg-[var(--color-surface-alt)] focus-within:border-[#3B5BDB] focus-within:ring-2 focus-within:ring-[#3B5BDB33]">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && !isBusy && sendMessage(input)}
                  className="flex-1 bg-transparent outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  placeholder={mode === "meeting" ? "Ask about the selected meeting" : "Ask about your meetings and tasks"}
                />
                <button
                  onClick={() => sendMessage(input)}
                  className="btn btn-icon-circle btn-primary w-9 h-9 inline-flex items-center justify-center disabled:opacity-50"
                  disabled={!input.trim() || isBusy}
                >
                  <SendHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
