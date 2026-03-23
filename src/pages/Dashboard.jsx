import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ─── Google Sans Font Injection (done in index.html ideally, but keeping here as requested) ───
if (typeof document !== 'undefined') {
  if (!document.getElementById('google-sans')) {
    const fontLink = document.createElement("link");
    fontLink.id = "google-sans";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&family=Google+Sans+Display:wght@400;500;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      *, *::before, *::after { font-family: 'Google Sans', sans-serif !important; box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #f8fafc; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    `;
    document.head.appendChild(styleTag);
  }
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const INIT_STATS = [
  { label: "Total Meetings",   value: 128,   delta: "+12 this month",      icon: "📅", grad: "from-blue-500 to-indigo-600",    light: "bg-blue-50",   txt: "text-blue-600"   },
  { label: "Pending Tasks",    value: 14,    delta: "3 overdue",           icon: "⏳", grad: "from-amber-400 to-orange-500",   light: "bg-amber-50",  txt: "text-amber-600"  },
  { label: "Completed Tasks",  value: 87,    delta: "+9 this week",        icon: "✅", grad: "from-emerald-400 to-teal-600",   light: "bg-emerald-50",txt: "text-emerald-600"},
  { label: "Productivity",     value: "91%", delta: "↑ 4pts vs last week", icon: "📈", grad: "from-violet-500 to-purple-600",  light: "bg-violet-50", txt: "text-violet-600" },
];

const INIT_MEETINGS = [
  { id: 1, title: "Q3 Product Roadmap Review",    date: "Mar 20, 2026 · 10:00 AM", desc: "Reviewed upcoming feature releases and aligned on sprint priorities for Q3.", attendees: ["AK","SM","PR"], tag: "Product" },
  { id: 2, title: "Design System Sync",           date: "Mar 19, 2026 · 2:30 PM",  desc: "Finalized component guidelines for the v2 design system rollout across teams.", attendees: ["LN","AK"],    tag: "Design"  },
  { id: 3, title: "Client Onboarding — Vertex",   date: "Mar 18, 2026 · 11:00 AM", desc: "Initial walkthrough of platform capabilities and integration options for Vertex.", attendees: ["SM","RC","TW"],tag: "Client" },
  { id: 4, title: "Engineering Stand-Up",         date: "Mar 18, 2026 · 9:00 AM",  desc: "Sprint 14 blockers resolved; deployment pipeline scheduled for Friday EOD.", attendees: ["PR","TW"],    tag: "Eng"    },
];

const INIT_TASKS = [
  { id: 1, name: "Prepare Q3 executive brief",         assignee: "Aryan K.", deadline: "Mar 23", done: false },
  { id: 2, name: "Review onboarding deck for Vertex",  assignee: "Sara M.",  deadline: "Mar 22", done: true  },
  { id: 3, name: "Update API documentation",           assignee: "Priya R.", deadline: "Mar 25", done: false },
  { id: 4, name: "Send meeting summaries to stakeholders", assignee: "Aryan K.", deadline: "Mar 21", done: true  },
  { id: 5, name: "Audit task automation workflow",     assignee: "Leo N.",   deadline: "Mar 28", done: false },
];

const NOTIFICATIONS = [
  { id: 1, icon: "📅", bg: "bg-blue-50",    msg: "Q3 Roadmap meeting starts in 30 minutes",    time: "Just now",    unread: true  },
  { id: 2, icon: "⏰", bg: "bg-amber-50",   msg: "Task 'Prepare Q3 brief' is due tomorrow",    time: "2 hours ago", unread: true  },
  { id: 3, icon: "✅", bg: "bg-emerald-50", msg: "Sara M. completed 'Review onboarding deck'", time: "4 hours ago", unread: true  },
  { id: 4, icon: "📝", bg: "bg-violet-50",  msg: "Design System Sync summary is ready",        time: "Yesterday",   unread: false },
  { id: 5, icon: "🔴", bg: "bg-red-50",     msg: "3 tasks are overdue — review needed",        time: "Yesterday",   unread: false },
];

const INIT_UPCOMING = [
  { title: "Q3 Roadmap Review",  time: "Today · 10:00 AM",  color: "bg-blue-500"    },
  { title: "Design System Sync", time: "Mar 23 · 2:30 PM",  color: "bg-emerald-500" },
  { title: "Client Onboarding",  time: "Mar 25 · 11:00 AM", color: "bg-amber-500"   },
];

const EVENT_DAYS = [5, 10, 14, 18, 19, 20, 21, 23, 25, 28];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "meetings",  label: "Meetings",  icon: "▶" },
  { id: "tasks",     label: "Tasks",     icon: "✓" },
  { id: "profile",   label: "Profile",   icon: "◎" },
  { id: "reports",   label: "Reports",   icon: "R" },
  { id: "settings",  label: "Settings",  icon: "⚙" },
];

const TAG_COLORS = {
  Product: "bg-blue-100 text-blue-700",
  Design:  "bg-violet-100 text-violet-700",
  Client:  "bg-amber-100 text-amber-700",
  Eng:     "bg-emerald-100 text-emerald-700",
};

const AVATAR_COLORS = [
  "bg-blue-200 text-blue-800",
  "bg-violet-200 text-violet-800",
  "bg-amber-200 text-amber-800",
  "bg-emerald-200 text-emerald-800",
  "bg-rose-200 text-rose-800",
];

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeIn  = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.35 } } };
const slideUp = (d = 0) => ({
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, delay: d, ease: [0.25, 0.1, 0.25, 1] } },
});
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Sidebar NavItem ───────────────────────────────────────────────────────────
function NavItem({ item, active, onNav }) {
  const isActive = active === item.id;
  return (
    <motion.button
      onClick={() => onNav(item.id)}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-200 ${
        isActive
          ? "text-blue-700 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
      style={isActive ? { background: "linear-gradient(135deg, #eff6ff, #eef2ff)" } : {}}
    >
      <span className="w-4 text-center text-sm">{item.icon}</span>
      {item.label}
      {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.6)]" />}
    </motion.button>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ onNotif, unreadCount, userName, setActiveNav }) {
  const shortName = userName?.split(' ')[0] || "User";
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <motion.header
      variants={fadeIn} initial="hidden" animate="visible"
      className="flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-sm border-b border-slate-100/80 sticky top-0 z-10 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
    >
      <div>
        <p className="text-[11px] text-slate-400 font-normal tracking-wide">{dateStr}</p>
        <h1 className="text-[20px] font-semibold text-slate-800 mt-0.5 leading-tight">
          Good morning, {shortName} 👋
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search meetings or tasks..."
            className="pl-8 pr-4 py-2 text-[12px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 w-56 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #f8faff, #f1f5f9)" }}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onNotif}
          className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
        >
          <span className="text-base">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 text-white text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
        >
          <span className="text-base font-light">+</span> Start Meeting
        </motion.button>
      </div>
    </motion.header>
  );
}

// ─── Stats Card ────────────────────────────────────────────────────────────────
function StatsCard({ stat, delay }) {
  return (
    <motion.div
      variants={slideUp(delay)}
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
      whileHover={{ scale: 1.025, y: -4, boxShadow: "0 15px 30px -5px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.22, type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm hover:shadow-lg cursor-default relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -mr-8 -mt-8 bg-gradient-to-br ${stat.grad}`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl ${stat.light} flex items-center justify-center text-lg shadow-sm`}>
          {stat.icon}
        </div>
        <span className={`text-[11px] font-medium ${stat.txt} ${stat.light} px-2 py-0.5 rounded-full`}>
          {stat.delta}
        </span>
      </div>
      <p className="text-[32px] font-bold text-slate-800 leading-none tracking-tight">{stat.value}</p>
      <p className="text-[12px] text-slate-500 mt-1.5 font-medium">{stat.label}</p>
    </motion.div>
  );
}

// ─── Meeting Card ──────────────────────────────────────────────────────────────
function MeetingCard({ meeting, delay }) {
  return (
    <motion.div
      variants={slideUp(delay)}
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: "0 15px 30px -5px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.22, type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm hover:shadow-lg transition-all cursor-default"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[14px] font-semibold text-slate-800 leading-snug">{meeting.title}</h3>
        <div className="flex gap-1.5 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[meeting.tag] || "bg-slate-100 text-slate-600"}`}>
            {meeting.tag}
          </span>
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            ● Recorded
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-2.5 font-medium">📅 {meeting.date}</p>
      <p className="text-[12px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{meeting.desc}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {meeting.attendees.map((a, i) => (
              <div key={i}
                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center font-bold shadow-sm ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                style={{ fontSize: "9px" }}>
                {a}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">{meeting.attendees.length} attendees</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="text-[12px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-colors duration-150 border border-blue-100"
        >
          View Summary →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function MeetingBarChart() {
  const data = {
    labels: ["Feb 3","Feb 10","Feb 17","Feb 24","Mar 3","Mar 10","Mar 17"],
    datasets: [{
      label: "Meetings",
      data: [12, 18, 15, 22, 19, 24, 18],
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        if (!chart.chartArea) return "#3b82f6";
        const gradient = chart.ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#818cf8");
        return gradient;
      },
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { family: "'Google Sans', sans-serif", size: 11 },
      bodyFont: { family: "'Google Sans', sans-serif", size: 11 },
      cornerRadius: 8,
      padding: 8,
    }},
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10, family: "'Google Sans', sans-serif" } }, border: { display: false } },
      y: { grid: { color: "#f1f5f9" }, ticks: { color: "#94a3b8", font: { size: 10, family: "'Google Sans', sans-serif" } }, beginAtZero: true, border: { display: false } },
    },
  };
  return (
    <div className="bg-white border border-slate-100/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-slate-800">Meeting Activity</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Last 7 weeks</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] text-slate-500">Meetings held</span>
        </div>
      </div>
      <div className="p-5" style={{ height: 180 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function TaskDonutChart() {
  const data = {
    datasets: [{
      data: [87, 14, 3],
      backgroundColor: ["#3b82f6","#f59e0b","#ef4444"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };
  const options = {
    cutout: "70%",
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { family: "'Google Sans', sans-serif", size: 11 },
      bodyFont: { family: "'Google Sans', sans-serif", size: 11 },
      cornerRadius: 8,
      padding: 8,
    }},
    responsive: false,
  };
  return (
    <div className="bg-white border border-slate-100/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100/80">
        <p className="text-[14px] font-semibold text-slate-800">Task Breakdown</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Current sprint</p>
      </div>
      <div className="p-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <Doughnut data={data} options={options} width={110} height={110} />
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-[18px] font-bold text-slate-800 leading-none">87%</span>
            <span className="text-[9px] text-slate-400 mt-0.5">done</span>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {[
            ["bg-blue-500","Completed",87,"text-blue-600","bg-blue-50"],
            ["bg-amber-400","Pending",14,"text-amber-600","bg-amber-50"],
            ["bg-red-400","Overdue",3,"text-red-600","bg-red-50"],
          ].map(([color, label, val, tc, bc]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
              <span className="text-[12px] text-slate-500 flex-1">{label}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tc} ${bc}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar ──────────────────────────────────────────────────────────────────
function CalendarCard({ upcoming }) {
  const today = new Date();
  const [cal, setCal] = useState(new Date());
  const firstDay  = new Date(cal.getFullYear(), cal.getMonth(), 1).getDay();
  const totalDays = new Date(cal.getFullYear(), cal.getMonth() + 1, 0).getDate();
  const prevTotal = new Date(cal.getFullYear(), cal.getMonth(), 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevTotal - firstDay + i + 1, type: "prev" });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, type: "cur" });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.1 }}
      whileHover={{ boxShadow: "0 15px 30px -5px rgba(0,0,0,0.06)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white border border-slate-100/80 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col"
    >
      <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-slate-800">Schedule</p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCal(new Date(cal.getFullYear(), cal.getMonth() - 1, 1))}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">‹</button>
          <span className="text-[12px] font-semibold text-slate-600 w-28 text-center">
            {MONTHS[cal.getMonth()]} {cal.getFullYear()}
          </span>
          <button onClick={() => setCal(new Date(cal.getFullYear(), cal.getMonth() + 1, 1))}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">›</button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 mb-1.5">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((c, i) => {
            const isToday = c.type==="cur" && c.day===today.getDate() && cal.getMonth()===today.getMonth() && cal.getFullYear()===today.getFullYear();
            const hasEvent = c.type==="cur" && EVENT_DAYS.includes(c.day);
            return (
              <div key={i} className="flex items-center justify-center">
                <div className={`relative w-7 h-7 flex items-center justify-center text-[11px] rounded-full cursor-pointer transition-all duration-150 font-medium ${
                  isToday         ? "text-white font-bold shadow-md" :
                  c.type==="prev" ? "text-slate-300" :
                  hasEvent        ? "text-slate-700 hover:bg-blue-50" :
                  "text-slate-600 hover:bg-slate-100"
                }`}
                  style={isToday ? { background: "linear-gradient(135deg, #2563eb, #4f46e5)" } : {}}>
                  {c.day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-100/80">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-2.5">Upcoming</p>
          <div className="space-y-2">
            {upcoming.map((item, i) => (
              <motion.div key={i} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.color} shadow-sm`} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-700 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Task List ─────────────────────────────────────────────────────────────────
function TaskListCard({ tasks, setTasks, setActiveNav }) {
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.1 }}
      whileHover={{ boxShadow: "0 15px 30px -5px rgba(0,0,0,0.06)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
      className="bg-white border border-slate-100/80 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col"
    >
      <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-slate-800">My Tasks</p>
          <motion.button onClick={() => setActiveNav && setActiveNav('tasks')} className="text-[11px] text-blue-600 font-semibold hover:text-blue-800 transition">View all →</motion.button>
      </div>
      <div className="divide-y divide-slate-50">
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, type: "spring" }}
            onClick={() => toggle(t.id)}
            whileHover={{ scale: 1.01, x: 4, backgroundColor: "#f8faff" }}
            className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-100"
          >
            <motion.div
              animate={{ scale: t.done ? [1, 1.2, 1] : 1 }}
              className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                t.done ? "border-emerald-500 bg-emerald-500 shadow-sm" : "border-slate-300 hover:border-blue-400"
              }`}>
              {t.done && <span className="text-white font-bold" style={{ fontSize: "10px" }}>✓</span>}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium truncate transition-colors duration-200 ${t.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                {t.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t.assignee} · {t.deadline}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors duration-200 ${
              t.done ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}>
              {t.done ? "Done" : "Pending"}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Notification Panel ────────────────────────────────────────────────────────
function NotificationPanel({ open, onClose }) {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unread  = notifs.filter(n => n.unread).length;
  const markAll = () => setNotifs(ns => ns.map(n => ({ ...n, unread: false })));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
            transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-100/80 z-40 flex flex-col shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #fafbff, #f8faff)" }}>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-slate-800">Notifications</p>
                {unread > 0 && (
                  <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                    {unread}
                  </span>
                )}
              </div>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifs.map(n => (
                <motion.div key={n.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                  className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    n.unread
                      ? "border-l-2 border-blue-500 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                  style={n.unread ? { background: "linear-gradient(135deg, #eff6ff80, #eef2ff80)" } : {}}>
                  <div className={`w-9 h-9 rounded-full ${n.bg} flex items-center justify-center text-sm shrink-0 shadow-sm`}>
                    {n.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-slate-700 leading-relaxed">{n.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100/80">
              <button onClick={markAll}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import api from '../api/axios';

// ─── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-6 relative overflow-hidden h-32 animate-pulse">
      <div className="w-16 h-10 bg-slate-200 rounded-lg mb-4" />
      <div className="w-24 h-4 bg-slate-200 rounded" />
    </div>
  );
}

function MeetingSkeleton() {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-40 animate-pulse">
      <div>
        <div className="w-3/4 h-5 bg-slate-200 rounded mb-3" />
        <div className="w-1/2 h-3 bg-slate-200 rounded mb-4" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>
        <div className="w-24 h-8 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Dashboard Content ─────────────────────────────────────────────────────────
function DashboardContent({ setActiveNav, setCopilotOpen }) {
  const [stats, setStats] = useState({ totalMeetings: 0, pendingTasks: 0, completedTasks: 0, productivityScore: 0 });
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetingMetrics, setMeetingMetrics] = useState({ weeklyCounts: [0,0,0,0,0,0,0,0] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, tasksRes, todayRes, msRes] = await Promise.all([
        api.get("/api/user/stats"),
        api.get("/api/tasks?limit=4"),
        api.get("/api/meetings/today"),
        api.get("/api/meetings/stats")
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setMeetings(todayRes.data);
      setMeetingMetrics(msRes.data);
    } catch(err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTask = async (id) => {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    try {
      const newStatus = task.status === 'Done' ? 'Pending' : 'Done';
      // Optimistic URL
      setTasks(ts => ts.map(t => t._id === id ? { ...t, status: newStatus } : t));
      await api.patch(`/api/tasks/${id}`, { status: newStatus });
      fetchData(); // refresh global stats silently
    } catch(err) { console.error(err); fetchData(); }
  };

  const barData = {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "Current"],
    datasets: [{
      label: "Meetings",
      data: meetingMetrics.weeklyCounts,
      backgroundColor: (ctx) => ctx.dataIndex === 7 ? "#3b82f6" : "#cbd5e1",
      borderRadius: 6,
    }],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: "#f1f5f9" }, border: { display: false } } }
  };

  const donutData = {
    datasets: [{ data: [stats.completedTasks || 0, stats.pendingTasks || 1], backgroundColor: ["#3b82f6", "#e2e8f0"], borderWidth: 0, hoverOffset: 4 }]
  };
  const donutOptions = { cutout: "75%", plugins: { tooltip: { enabled: false } }, responsive: false };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[1100px] mx-auto space-y-8 pb-12">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <p className="text-[13px] font-bold">⚠ {error}</p>
          <button onClick={fetchData} className="text-[12px] font-bold bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Retry</button>
        </div>
      )}

      {/* Top Stat Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {loading ? (
            <>
              <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
            </>
          ) : (
            <>
              <motion.div variants={slideUp(0)} whileHover={{ scale: 1.02, y: -2 }} className="bg-blue-50/50 rounded-2xl border-t-4 border-t-blue-500 border border-x-slate-100 border-b-slate-100 p-6 shadow-sm hover:shadow-md transition-all relative">
                <span className="absolute top-6 right-6 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">+this month</span>
                <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">{stats.totalMeetings || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2.5 uppercase tracking-widest">Total Meetings</p>
              </motion.div>
              <motion.div variants={slideUp(0.05)} whileHover={{ scale: 1.02, y: -2 }} className="bg-amber-50/50 rounded-2xl border-t-4 border-t-amber-400 border border-x-slate-100 border-b-slate-100 p-6 shadow-sm hover:shadow-md transition-all relative">
                <span className="absolute top-6 right-6 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">active</span>
                <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">{stats.pendingTasks || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2.5 uppercase tracking-widest">Pending Tasks</p>
              </motion.div>
              <motion.div variants={slideUp(0.1)} whileHover={{ scale: 1.02, y: -2 }} className="bg-emerald-50/50 rounded-2xl border-t-4 border-t-emerald-500 border border-x-slate-100 border-b-slate-100 p-6 shadow-sm hover:shadow-md transition-all relative">
                <span className="absolute top-6 right-6 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">total</span>
                <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">{stats.completedTasks || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2.5 uppercase tracking-widest">Completed Tasks</p>
              </motion.div>
              <motion.div variants={slideUp(0.15)} whileHover={{ scale: 1.02, y: -2 }} className="bg-violet-50/50 rounded-2xl border-t-4 border-t-violet-500 border border-x-slate-100 border-b-slate-100 p-6 shadow-sm hover:shadow-md transition-all relative">
                <span className="absolute top-6 right-6 text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">dynamic</span>
                <p className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">{stats.productivityScore || 0}<span className="text-[20px]">%</span></p>
                <p className="text-[11px] font-bold text-slate-500 mt-2.5 uppercase tracking-widest">Productivity</p>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Today at a Glance Banner */}
      <motion.section variants={slideUp(0.2)}>
        <div className="rounded-2xl p-8 shadow-sm border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "linear-gradient(135deg, #eff6ff, #eef2ff)" }}>
          <div>
            <h2 className="text-[26px] font-bold text-slate-800 tracking-tight">Today at a glance 👋</h2>
            <p className="text-[15px] text-slate-600 mt-1 font-medium">You have <span className="font-bold text-blue-600">{meetings.length} meetings</span> today and <span className="font-bold text-amber-600">{stats.pendingTasks} pending tasks</span>.</p>
          </div>
          <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-white/50 flex flex-col items-end shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Next Meeting</span>
              {meetings.length > 0 && (
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
              )}
            </div>
            {meetings.length > 0 ? (
              <>
                <p className="text-[15px] font-bold text-slate-800">{meetings[0].title}</p>
                <p className="text-[13px] font-bold text-emerald-600 mt-0.5">{new Date(meetings[0].date).toLocaleTimeString([], {timeStyle: 'short'})}</p>
              </>
            ) : (
                <p className="text-[13px] font-bold text-slate-400 mt-0.5">Nothing scheduled</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Quick Actions Row */}
      <motion.section variants={slideUp(0.3)}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.button whileHover={{ scale: 1.03, y: -2 }} onClick={() => setCopilotOpen?.(true)} className="flex items-center justify-center gap-3 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-transparent text-white" style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex flex-col items-center justify-center font-bold text-[14px] leading-none shrink-0 border border-white/10">AI</div>
            <span className="text-[14px] font-bold">Ask Copilot</span>
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.03, y: -2 }} onClick={() => setActiveNav?.('meetings')} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all text-slate-700">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[14px] shrink-0 text-slate-600">J</div>
            <span className="text-[14px] font-bold">Join Meeting</span>
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.03, y: -2 }} onClick={() => setActiveNav?.('tasks')} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm hover:shadow-md transition-all text-emerald-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center font-bold text-[14px] shrink-0 text-emerald-900 border border-emerald-300/50">+</div>
            <span className="text-[14px] font-bold">New Task</span>
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.03, y: -2 }} onClick={() => setActiveNav?.('reports')} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-100 shadow-sm hover:shadow-md transition-all text-violet-800">
            <div className="w-8 h-8 rounded-lg bg-violet-200 flex items-center justify-center font-bold text-[14px] shrink-0 text-violet-900 border border-violet-300/50">R</div>
            <span className="text-[14px] font-bold">View Reports</span>
          </motion.button>
        </div>
      </motion.section>

      {/* Analytics Row */}
      <motion.section variants={slideUp(0.4)}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Analytics & Tasks</p>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <h3 className="text-[14px] font-bold text-slate-800 mb-6">Meeting Activity</h3>
            <div className="flex-1 w-full min-h-[180px]">
              {loading ? <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" /> : <Bar data={barData} options={barOptions} />}
            </div>
          </div>
          
          {/* Donut Chart */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center relative">
            <h3 className="text-[14px] font-bold text-slate-800 self-start mb-8">Task Breakdown</h3>
            <div className="relative">
              {loading ? <div className="w-32 h-32 rounded-full border-8 border-slate-100 animate-pulse mx-auto" /> : <Doughnut data={donutData} options={donutOptions} width={130} height={130} />}
              {!loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[24px] font-bold text-slate-800 leading-none">{stats.productivityScore || 0}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Done</span>
                  </div>
              )}
            </div>
          </div>

          {/* My Tasks Preview */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[14px] font-bold text-slate-800">My Tasks</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="p-3 space-y-3">
                  <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-[32px] mb-2">📋</div>
                    <p className="text-[13px] font-bold text-slate-600 text-center">No tasks yet.</p>
                    <p className="text-[11px] text-slate-400 text-center mt-1">Add your first task.</p>
                  </div>
              ) : tasks.map(t => (
                <div key={t._id} onClick={() => toggleTask(t._id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className={`w-5 h-5 rounded-[6px] border-[2px] flex items-center justify-center shrink-0 transition-colors ${t.status === 'Done' ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300 group-hover:border-emerald-400"}`}>
                     {t.status === 'Done' && <span className="text-white text-[10px] font-bold inline-block leading-none pb-[1px]">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-bold truncate transition-all ${t.status === 'Done' ? "line-through text-slate-400" : "text-slate-700"}`}>{t.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.assignee || 'Unassigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* AI Copilot Suggestion Card */}
      <motion.section variants={slideUp(0.5)}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Intelligence</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ background: "linear-gradient(180deg, #7c3aed, #3b82f6)" }} />
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shadow-md border border-white/20" style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
              AI
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800">Copilot Insights</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Your personalized assistant</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {["Q3 brief is due tomorrow, want to draft it?", "You have pending tasks", "Generate meeting summary"].map((s, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setCopilotOpen?.(true)} className="px-5 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-[12px] font-bold text-slate-700 hover:bg-white hover:shadow-sm hover:border-violet-200 transition-all text-left">
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Recent Meetings Section */}
      <motion.section variants={slideUp(0.6)}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Today's Meetings</p>
          <button onClick={() => setActiveNav?.('meetings')} className="text-[11px] font-bold text-blue-600 hover:text-blue-800">View All →</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {loading ? (
             <><MeetingSkeleton /><MeetingSkeleton /></>
          ) : meetings.length === 0 ? (
             <div className="col-span-2 bg-slate-50 border border-slate-100 rounded-2xl py-12 flex flex-col items-center">
                 <div className="text-[40px] mb-3">☕</div>
                 <p className="text-[14px] font-bold text-slate-600">No meetings today.</p>
                 <p className="text-[12px] text-slate-400 mt-1">Enjoy the quiet time or schedule a new sync.</p>
             </div>
          ) : meetings.map((m, i) => (
            <motion.div key={m._id || i} whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)" }} className={`bg-white rounded-2xl border border-slate-100 border-l-[6px] border-l-blue-500 p-6 shadow-sm transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[16px] font-bold text-slate-800">{m.title}</h3>
                  <div className="flex gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{m.type || "Meeting"}</span>
                    {m.isRecorded && <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">Recorded</span>}
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mb-3">{m.date ? new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Recently"}</p>
                <p className="text-[13px] font-medium text-slate-600 mb-6 truncate">{m.description || "No description provided."}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {(m.participants || ["M"]).slice(0, 3).map((a, j) => (
                    <div key={j} className="w-8 h-8 rounded-full border-[2px] border-white flex items-center justify-center font-bold text-[10px] bg-slate-200 text-slate-700 shadow-sm">
                      {a.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
                <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  View Summary
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

    </motion.div>
  );
}

// ─── Placeholder Pages ─────────────────────────────────────────────────────────
function PlaceholderPage({ label, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center h-72 text-center"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md"
        style={{ background: "linear-gradient(135deg, #eff6ff, #eef2ff)" }}>
        {icon}
      </div>
      <h2 className="text-[16px] font-semibold text-slate-700 mb-1">{label}</h2>
      <p className="text-[13px] text-slate-400">This section is coming soon.</p>
    </motion.div>
  );
}

// ─── Copilot SVG Icon ─────────────────────────────────────────────────────────
function CopilotIcon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="url(#cg1)" />
      <path d="M8 10.5c0-.828.448-1.5 1-1.5h2c.552 0 1 .672 1 1.5S11.552 12 11 12H9c-.552 0-1-.672-1-1.5z" fill="white" fillOpacity="0.9"/>
      <path d="M13 10.5c0-.828.448-1.5 1-1.5h1c.552 0 1 .672 1 1.5S15.552 12 15 12h-1c-.552 0-1-.672-1-1.5z" fill="white" fillOpacity="0.9"/>
      <path d="M7 14.5C7 13.672 9.239 13 12 13s5 .672 5 1.5S14.761 16 12 16s-5-.672-5-1.5z" fill="white" fillOpacity="0.7"/>
      <defs>
        <linearGradient id="cg1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed"/>
          <stop offset="0.5" stopColor="#2563eb"/>
          <stop offset="1" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Copilot Chat Panel ────────────────────────────────────────────────────────
const COPILOT_SUGGESTIONS = [
  "Summarize today's meetings",
  "What tasks are overdue?",
  "Draft follow-up for Vertex onboarding",
  "Show my productivity trend",
];

const COPILOT_RESPONSES = {
  "Summarize today's meetings": "You have **1 meeting today**: *Q3 Roadmap Review* at 10:00 AM. It focuses on feature releases and sprint priorities for Q3. Attendees: Aryan K., Sara M., Priya R.",
  "What tasks are overdue?": "You have **3 overdue tasks**:\n• Prepare Q3 executive brief (Mar 23)\n• Update API documentation (Mar 25)\n• Audit task automation workflow (Mar 28)\n\nWant me to draft a quick status update for your team?",
  "Draft follow-up for Vertex onboarding": "Here's a draft follow-up email for Vertex Corp:\n\n*Subject: Next Steps — Vertex Onboarding*\n\nHi team, thank you for joining today's onboarding session. As a next step, we'll share the integration documentation by EOD Friday. Please feel free to reach out with any questions!",
  "Show my productivity trend": "Your productivity score is **91%** this week — up 4 points from last week 📈. You've completed 87 tasks and have 14 pending. You're on track for your best month yet!",
};

function CopilotPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! 👋 I'm your AI Meeting Copilot. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = { current: null };

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = COPILOT_RESPONSES[text] ||
        "I'm still learning! Try asking me to summarize meetings, check overdue tasks, or draft a follow-up email.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
      setTyping(false);
    }, 1100);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -380, opacity: 0 }}
            transition={{ type: "tween", duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 left-60 h-full w-[360px] z-40 flex flex-col shadow-2xl"
            style={{ background: "linear-gradient(180deg, #faf7ff 0%, #f0f4ff 100%)" }}
          >
            <div className="px-5 py-4 border-b border-violet-100/80 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #f5f3ff, #eff6ff)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)" }}>
                  <CopilotIcon size={20} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-800 leading-tight">Meeting Copilot</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">AI · Online</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center shadow-sm mt-0.5"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                      <CopilotIcon size={14} />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-white text-slate-700 rounded-tl-sm border border-violet-100/60"
                  }`}
                    style={msg.role === "user" ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)" } : {}}>
                    {msg.text.split("\n").map((line, j) => (
                      <React.Fragment key={j}>
                        {line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}
                        {j < msg.text.split("\n").length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {typing && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex gap-2.5 items-center">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                      <CopilotIcon size={14} />
                    </div>
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-sm border border-violet-100/60 shadow-sm flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={el => bottomRef.current = el} />
            </div>

            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {COPILOT_SUGGESTIONS.map((s, i) => (
                <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => send(s)}
                  className="text-[10px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-full transition-colors duration-150">
                  {s}
                </motion.button>
              ))}
            </div>

            <div className="px-4 pb-4 pt-2">
              <div className="flex gap-2 items-center bg-white rounded-xl border border-violet-200 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-300 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send(input)}
                  placeholder="Ask your Copilot..."
                  className="flex-1 text-[12px] text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  onClick={() => send(input)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-opacity"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", opacity: input.trim() ? 1 : 0.5 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div className="flex items-center px-6 py-4 animate-pulse">
      <div className="w-12 flex justify-center"><div className="w-5 h-5 rounded-md bg-slate-200" /></div>
      <div className="flex-1 px-4"><div className="w-1/2 h-4 bg-slate-200 rounded" /></div>
      <div className="w-32 px-1"><div className="w-20 h-4 bg-slate-200 rounded" /></div>
      <div className="w-28 px-1 text-right"><div className="w-16 h-4 bg-slate-200 rounded ml-auto" /></div>
      <div className="w-24 flex gap-2 justify-center"><div className="w-8 h-6 bg-slate-200 rounded" /><div className="w-8 h-6 bg-slate-200 rounded" /></div>
    </div>
  );
}

// ─── Tasks Page (Full Management) ────────────────────────────────────────────────
function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", assignee: "", deadline: "" });
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/tasks");
      setTasks(res.data);
    } catch(err) { console.error("Error loading tasks", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const resetForm = () => {
    setFormData({ name: "", assignee: "", deadline: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingId) {
        const res = await api.put(`/api/tasks/${editingId}`, formData);
        setTasks(tasks.map(t => (t._id || t.id) === editingId ? res.data : t));
      } else {
        const res = await api.post(`/api/tasks`, formData);
        setTasks([res.data, ...tasks]);
      }
      resetForm();
    } catch(err) { console.error("Error saving task", err); }
  };

  const handleEdit = (task) => {
    setFormData({ name: task.name, assignee: task.assignee || "", deadline: task.deadline || "" });
    setEditingId(task._id || task.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter(t => (t._id || t.id) !== id));
    } catch(err) { console.error("Error deleting task", err); }
  };

  const toggleStatus = async (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;
    try {
      const newStatus = task.status === 'Done' ? 'Pending' : 'Done';
      setTasks(tasks.map(t => (t._id || t.id) === id ? { ...t, status: newStatus } : t));
      await api.patch(`/api/tasks/${id}`, { status: newStatus });
    } catch (err) { console.error("Error updating status", err); fetchTasks(); }
  };

  const pendingCount = tasks.filter(t => t.status !== 'Done').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const upcomingCount = tasks.filter(t => t.status !== 'Done' && t.deadline).length;

  const displayedTasks = tasks.filter(t => {
    if (filter === "Pending") return t.status !== 'Done';
    if (filter === "Upcoming") return t.status !== 'Done' && t.deadline;
    if (filter === "Done") return t.status === 'Done';
    return true;
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight">Task Management</h2>
          <p className="text-[12px] text-slate-500 mt-1">You have {pendingCount} upcoming tasks to be done.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center gap-2 text-white text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <span className="text-base font-light">+</span> Create Task
        </motion.button>
      </div>

      {/* Task Components (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={slideUp(0)} whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm flex items-center justify-between group">
          <div><p className="text-[12px] text-slate-500 font-medium">Pending Tasks</p><p className="text-[24px] font-bold text-slate-800">{loading ? '-' : pendingCount}</p></div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg group-hover:bg-amber-100 transition">⏳</div>
        </motion.div>
        <motion.div variants={slideUp(0.1)} whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm flex items-center justify-between group">
          <div><p className="text-[12px] text-slate-500 font-medium">Upcoming Tasks</p><p className="text-[24px] font-bold text-slate-800">{loading ? '-' : upcomingCount}</p></div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-lg group-hover:bg-blue-100 transition">📅</div>
        </motion.div>
        <motion.div variants={slideUp(0.2)} whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm flex items-center justify-between group">
          <div><p className="text-[12px] text-slate-500 font-medium">Done Tasks</p><p className="text-[24px] font-bold text-slate-800">{loading ? '-' : doneCount}</p></div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg group-hover:bg-emerald-100 transition">✅</div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 overflow-hidden"
          >
            <h3 className="text-[14px] font-semibold text-slate-800 mb-4">{editingId ? "Edit Task" : "New Upcoming Task"}</h3>
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <input
                type="text"
                placeholder="Task description..."
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Assignee (e.g. You)"
                  value={formData.assignee}
                  onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-36 px-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                />
                <input
                  type="text"
                  placeholder="Deadline (e.g. Tomorrow)"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-40 px-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={resetForm} className="px-4 py-2 text-[12px] font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-5 py-2 text-[12px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm">
                {editingId ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {["All", "Pending", "Upcoming", "Done"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${filter === f ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-50/50 flex text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="w-12 text-center">Status</div>
          <div className="flex-1 px-4">Task Details</div>
          <div className="w-32">Assignee</div>
          <div className="w-28 text-right">Deadline</div>
          <div className="w-24 text-center">Actions</div>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
             <><TaskSkeleton /><TaskSkeleton /><TaskSkeleton /></>
          ) : displayedTasks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
                <div className="text-[40px] mb-3">📋</div>
                <div className="text-[14px] font-bold text-slate-600">No tasks found!</div>
                <div className="text-[12px] text-slate-400 mt-1">Enjoy the quiet time or add a new task.</div>
            </div>
          ) : (
            displayedTasks.map((t, i) => (
              <motion.div
                key={t._id || t.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center px-6 py-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="w-12 flex justify-center">
                  <motion.div
                    onClick={() => toggleStatus(t._id || t.id)}
                    animate={{ scale: t.status === 'Done' ? [1, 1.2, 1] : 1 }}
                    className={`cursor-pointer w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                      t.status === 'Done' ? "border-emerald-500 bg-emerald-500 shadow-sm" : "border-slate-300 hover:border-emerald-400 bg-white"
                    }`}>
                    {t.status === 'Done' && <span className="text-white font-bold" style={{ fontSize: "10px" }}>✓</span>}
                  </motion.div>
                </div>
                <div className="flex-1 px-4 min-w-0">
                  <p className={`text-[13px] font-medium truncate transition-colors duration-200 ${t.status === 'Done' ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {t.name}
                  </p>
                </div>
                <div className="w-32 px-1">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{t.assignee || "Unassigned"}</span>
                </div>
                <div className="w-28 px-1 text-right">
                  <span className={`text-[11px] font-semibold ${t.status === 'Done' ? "text-slate-400" : "text-amber-600"}`}>{t.deadline || "No date"}</span>
                </div>
                <div className="w-24 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(t)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => handleDelete(t._id || t.id)} className="text-[11px] font-semibold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1.5 rounded-lg transition-colors">Delete</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Meetings Page ───────────────────────────────────────────────────────────────
const MEETINGS_DATA = [
  { id: 1, title: "Q3 Product Roadmap", date: "Mar 25", time: "10:00 AM", dur: 60, type: "Team", status: "Upcoming", attendees: ["VN", "SM", "PR"] },
  { id: 2, title: "Client Sync: Vertex", date: "Mar 26", time: "2:00 PM", dur: 45, type: "Client", status: "Upcoming", attendees: ["VN", "RC"] },
  { id: 3, title: "Design System Sync", date: "Mar 19", time: "11:00 AM", dur: 45, type: "Team", status: "Past", attendees: ["VN", "SM", "TW"] },
  { id: 4, title: "1:1 with Leo", date: "Mar 18", time: "4:00 PM", dur: 30, type: "One on One", status: "Past", attendees: ["VN", "LN"] },
  { id: 5, title: "Engineering Standup", date: "Mar 18", time: "10:00 AM", dur: 15, type: "Standup", status: "Past", attendees: ["VN", "PR", "TW"] },
  { id: 6, title: "Sprint Planning", date: "Mar 17", time: "1:00 PM", dur: 60, type: "Team", status: "Cancelled", attendees: ["VN", "SM", "PR", "TW"] },
];

const TYPE_STYLES = {
  "Team": { border: "border-l-blue-500", badge: "bg-blue-50 text-blue-600 border border-blue-100" },
  "Client": { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-600 border border-amber-100" },
  "One on One": { border: "border-l-violet-500", badge: "bg-violet-50 text-violet-600 border border-violet-100" },
  "Standup": { border: "border-l-emerald-500", badge: "bg-emerald-50 text-emerald-600 border border-emerald-100" }
};

const AVATAR_BG = [
  "bg-rose-100 text-rose-700 border-white", 
  "bg-emerald-100 text-emerald-700 border-white", 
  "bg-blue-100 text-blue-700 border-white", 
  "bg-violet-100 text-violet-700 border-white", 
  "bg-amber-100 text-amber-700 border-white"
];

// ─── Meetings Skeletons ────────────────────────────────────────────────────────
function MeetingPageSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-pulse border-l-[6px] border-l-slate-200">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-48 h-5 bg-slate-200 rounded" />
          <div className="w-16 h-5 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-4 bg-slate-200 rounded" />
          <div className="w-24 h-4 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="flex -space-x-3">
          {[1, 2].map(i => <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-[3px] border-white" />)}
        </div>
        <div className="shrink-0 w-32 flex justify-end">
          <div className="w-20 h-9 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("All");
  const [isScheduling, setIsScheduling] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [form, setForm] = useState({
    title: "", date: "", duration: 30, type: "Team", recurring: false, autoRecord: true, participants: []
  });
  const [pInput, setPInput] = useState("");

  const tabs = ["All", "Upcoming", "Past", "Cancelled"];
  
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/meetings");
      setMeetings(res.data);
    } catch(err) { console.error("Error fetching meetings", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const filteredMeetings = (meetings || []).filter(m => {
    if (filterTab === "All") return true;
    return (m.status || "Scheduled") === filterTab || (m.status === "Completed" && filterTab === "Past") || (m.status === "Cancelled" && filterTab === "Cancelled") || (["Scheduled", "InProgress"].includes(m.status) && filterTab === "Upcoming");
  });

  const handleSchedule = async () => {
    if (!form.title.trim()) return;
    
    const parsedDate = form.date ? new Date(form.date) : new Date();
    const meetingDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const mTime = meetingDate.toLocaleTimeString([], { timeStyle: 'short' });

    const newMeeting = {
      title: form.title.trim(),
      date: meetingDate,
      description: `Duration: ${form.duration}m, Time: ${mTime}`,
      type: form.type === "Standup" ? "Standup" : (form.type === "Client" ? "Client" : (form.type === "One on One" ? "OneOnOne" : "Team")),
      isRecorded: form.autoRecord,
      attendees: form.participants.length > 0 ? form.participants.map(p => p.slice(0, 2).toUpperCase()) : ["VN", "TM"]
    };

    try {
      const res = await api.post(`/api/meetings`, newMeeting);
      setMeetings([res.data, ...meetings]);
      setForm({ title: "", date: "", duration: 30, type: "Team", recurring: false, autoRecord: true, participants: [] });
      setIsScheduling(false);
    } catch(err) { console.error("Error scheduling meeting", err); }
  };

  const handleAddParticipant = () => {
    if(pInput.trim() && !form.participants.includes(pInput.trim())){
      setForm({...form, participants: [...form.participants, pInput.trim()]});
      setPInput("");
    }
  };

  const removeParticipant = (p) => {
    setForm({...form, participants: form.participants.filter(x => x !== p)});
  };

  const extractRoomId = (value) => {
    const raw = value.trim();
    if (!raw) return null;

    // Support full join links like https://app.com/join/<roomId>
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const parsed = new URL(raw);
        const segments = parsed.pathname.split("/").filter(Boolean);
        return segments[segments.length - 1] || null;
      } catch (_) {
        return null;
      }
    }

    // Support "/join/<roomId>" or direct room id
    const parts = raw.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  };

  const goToJoinRoom = (meeting) => {
    const roomId = meeting?.roomId || extractRoomId(meeting?.joinUrl || "");
    if (!roomId) return;
    navigate(`/join/${roomId}`);
  };

  const handleQuickJoin = () => {
    const roomId = extractRoomId(joinInput);
    if (!roomId) return;
    navigate(`/join/${roomId}`);
  };

  const copyJoinLink = async (meeting) => {
    const roomId = meeting?.roomId || extractRoomId(meeting?.joinUrl || "");
    if (!roomId) return;
    const link = meeting?.joinUrl || `${window.location.origin}/join/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (_) {
      // best effort only
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[960px] mx-auto space-y-10 pb-12">
      
      {/* Top Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div variants={slideUp(0)} className="bg-blue-50 rounded-2xl p-5 border border-blue-100/50 shadow-sm hover:shadow-md transition-all">
          <p className="text-[32px] font-bold text-blue-700 leading-none">{loading ? "-" : meetings.length}</p>
          <p className="text-[12px] font-semibold text-blue-600 mt-2">Meetings Scheduled</p>
        </motion.div>
        <motion.div variants={slideUp(0.1)} className="bg-violet-50 rounded-2xl p-5 border border-violet-100/50 shadow-sm hover:shadow-md transition-all">
          <p className="text-[32px] font-bold text-violet-700 leading-none">{loading ? "-" : (meetings.length * 0.75).toFixed(1)} <span className="text-[16px]">hrs</span></p>
          <p className="text-[12px] font-semibold text-violet-600 mt-2">Total Hours in Meetings</p>
        </motion.div>
        <motion.div variants={slideUp(0.2)} className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-5 right-5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <p className="text-[32px] font-bold text-emerald-700 leading-none">Soon</p>
          <p className="text-[12px] font-semibold text-emerald-600 mt-2">Next Meeting In</p>
        </motion.div>
      </div>

      {/* Quick Join Bar */}
      <motion.div variants={slideUp(0.3)} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm text-lg border border-blue-100">#</div>
          <input
            type="text"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickJoin()}
            placeholder="Join by Meeting ID or Link"
            className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-slate-700 placeholder:text-slate-400 font-semibold"
          />
        </div>
        <button
          onClick={handleQuickJoin}
          className="whitespace-nowrap px-6 py-3 rounded-xl text-white font-bold text-[13px] shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
          style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
        >
          Join Now
        </button>
      </motion.div>

      {/* Schedule a New Meeting */}
      <motion.div variants={slideUp(0.4)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsScheduling(!isScheduling)}>
          <div>
            <h2 className="text-[16px] font-bold text-slate-800">Schedule a New Meeting</h2>
            <p className="text-[12px] font-medium text-slate-500 mt-1">Set up time with your team or clients</p>
          </div>
          <div className="w-20 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-[11px] transition-colors hover:bg-slate-200">
             {isScheduling ? "Close" : "Expand"}
          </div>
        </div>
        
        <AnimatePresence>
          {isScheduling && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-8 bg-slate-50/50 space-y-6">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Meeting Title</label>
                  <input type="text" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="e.g. Q4 Planning Sync" className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white shadow-sm" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Date and Time</label>
                    <input type="text" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} placeholder="Tomorrow, 10:00 AM" className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Duration</label>
                    <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      {[15, 30, 45, 60].map(d => (
                        <button key={d} onClick={()=>setForm({...form, duration: d})} className={`flex-1 py-3.5 text-[13px] font-bold border-r border-slate-100 last:border-0 transition-colors ${form.duration === d ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Meeting Type</label>
                   <div className="flex flex-wrap gap-2.5">
                     {["One on One", "Team", "Client", "Standup"].map(t => (
                        <button key={t} onClick={()=>setForm({...form, type: t})} className={`px-5 py-2.5 rounded-full text-[12px] font-bold transition-all border ${form.type === t ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          {t}
                        </button>
                     ))}
                   </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Add Participants</label>
                  <div className="flex gap-2 mb-3 shadow-sm rounded-xl">
                    <input type="text" value={pInput} onChange={e=>setPInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddParticipant()} placeholder="Name or email address..." className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:border-blue-400 bg-white" />
                    <button onClick={handleAddParticipant} className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 border border-slate-200 text-[13px] transition-colors">Add</button>
                  </div>
                  {form.participants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.participants.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[12px] font-bold text-slate-700 shadow-sm">
                          {p}
                          <button onClick={()=>removeParticipant(p)} className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px] ml-1">X</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-8 pt-3 pb-2">
                  <div className="flex items-center gap-3">
                    <div onClick={() => setForm({...form, recurring: !form.recurring})} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${form.recurring ? "bg-blue-600" : "bg-slate-300"}`}>
                      <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-sm" animate={{ x: form.recurring ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">Recurring Meeting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div onClick={() => setForm({...form, autoRecord: !form.autoRecord})} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${form.autoRecord ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-sm" animate={{ x: form.autoRecord ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">Auto Record</span>
                  </div>
                </div>

              </div>

              <div className="pt-6 mt-6 border-t border-slate-200">
                <button onClick={handleSchedule} className="w-full py-4 rounded-xl text-white font-bold text-[14px] shadow-sm hover:shadow-md transition-all tracking-wide" style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
                  Schedule Meeting
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={slideUp(0.5)} className="border-b border-slate-200 flex gap-2 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setFilterTab(tab)}
            className={`px-6 py-4 text-[13px] whitespace-nowrap transition-colors relative tracking-wide ${filterTab === tab ? 'text-blue-600 font-bold' : 'text-slate-500 font-bold hover:text-slate-800'}`}
          >
            {tab}
            {filterTab === tab && (
              <motion.div layoutId="activeTabBadge" className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-blue-600" />
            )}
          </button>
        ))}
      </motion.div>

      {/* Meetings List */}
      <motion.div variants={slideUp(0.6)} className="space-y-4 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <><MeetingPageSkeleton /><MeetingPageSkeleton /><MeetingPageSkeleton /></>
          ) : filteredMeetings.map((m, idx) => {
            const displayType = m.type === "OneOnOne" ? "One on One" : (m.tag || m.type || "Team");
            const style = TYPE_STYLES[displayType] || TYPE_STYLES["Team"];
            const isPast = m.status === "Completed";
            const isCancelled = m.status === "Cancelled";
            const isUpcoming = ["Scheduled", "InProgress"].includes(m.status);
            
            return (
            <motion.div 
              key={m._id || m.id || idx}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-l-[6px] ${style.border}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2.5">
                  <h3 className="text-[16px] font-bold text-slate-800">{m.title}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                    {displayType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-slate-500">
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {m.date ? new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Recently"}</span>
                  <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {m.description || m.desc || "Default"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto mt-2 sm:mt-0">
                {/* Avatar List */}
                <div className="flex -space-x-3">
                  {(m.attendees || []).map((att, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center text-[11px] font-bold shadow-sm ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                      {att}
                    </div>
                  ))}
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 w-40 flex justify-end gap-2">
                  {isUpcoming && (
                    <>
                      <button
                        onClick={() => copyJoinLink(m)}
                        className="px-3 py-2.5 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => goToJoinRoom(m)}
                        className="px-4 py-2.5 text-[12px] font-bold text-white shadow-sm hover:shadow-md rounded-xl transition-all"
                        style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
                      >
                        Join
                      </button>
                    </>
                  )}
                  {isPast && (
                    <button className="px-5 py-2.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
                      View Summary
                    </button>
                  )}
                  {isCancelled && (
                    <span className="px-5 py-2 text-[11px] font-bold text-red-500/80 border border-red-100/50 rounded-xl bg-red-50/50">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {!loading && filteredMeetings.length === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="py-16 text-center text-slate-500 text-[13px] font-bold">
              No meetings found for this filter.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </motion.div>
  );
}

// ─── Profile Page ────────────────────────────────────────────────────────────────
const TEAMMATES = [
  { name: "Sara M", role: "Designer", mtgs: 14, color: "bg-rose-50 text-rose-600" },
  { name: "Priya R", role: "Engineer", mtgs: 11, color: "bg-blue-50 text-blue-600" },
  { name: "Leo N", role: "Analyst", mtgs: 9, color: "bg-emerald-50 text-emerald-600" },
  { name: "RC", role: "Client Lead", mtgs: 7, color: "bg-amber-50 text-amber-600" },
  { name: "TW", role: "Developer", mtgs: 6, color: "bg-violet-50 text-violet-600" }
];

const ACTIVITY = [
  { title: "Q3 Product Roadmap Review", date: "Mar 20", dur: "60 min", border: "border-l-blue-500" },
  { title: "Design System Sync", date: "Mar 19", dur: "45 min", border: "border-l-violet-500" },
  { title: "Client Onboarding Vertex", date: "Mar 18", dur: "30 min", border: "border-l-amber-500" },
  { title: "Engineering Stand Up", date: "Mar 18", dur: "15 min", border: "border-l-emerald-500" },
  { title: "Sprint Planning", date: "Mar 17", dur: "60 min", border: "border-l-blue-500" },
];

const INTEGRATIONS = [
  { name: "Google Calendar", state: "Connected", let: "G", col: "bg-red-50 text-red-600" },
  { name: "Slack", state: "Connected", let: "S", col: "bg-purple-50 text-purple-600" },
  { name: "Zoom", state: "Not Connected", let: "Z", col: "bg-blue-50 text-blue-600" },
  { name: "Jira", state: "Connected", let: "J", col: "bg-blue-50 text-blue-600" },
  { name: "Notion", state: "Not Connected", let: "N", col: "bg-slate-100 text-slate-600" },
  { name: "Outlook", state: "Not Connected", let: "O", col: "bg-sky-50 text-sky-600" }
];

function ProfilePage({ user, updateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || "");
  const [editLoading, setEditLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      const [profRes, statRes] = await Promise.all([
        api.get("/api/user/profile"),
        api.get("/api/user/stats")
      ]);
      setProfile(profRes.data);
      setStats(statRes.data);
      setEditName(profRes.data.fullName || user?.displayName || "");
    } catch(err) { console.error("Error fetching profile", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfileAndStats(); }, []);

  const handleTogglePref = async (key) => {
    if(!profile || !profile.preferences) return;
    const currentVal = profile.preferences[key];
    const newPrefs = { ...profile.preferences, [key]: !currentVal };
    // Optimistic update
    setProfile({ ...profile, preferences: newPrefs });
    try {
      await api.patch("/api/user/profile", { preferences: newPrefs });
    } catch (err) {
      console.error("Failed to update preference", err);
      setProfile({ ...profile, preferences: { ...profile.preferences, [key]: currentVal }});
    }
  };

  const PREF_MAP = [
    { key: "emailReminders", title: "Email Notifications", desc: "Receive immediate emails for task deadlines meetings.", default: true },
    { key: "transcriptionEnabled", title: "Meeting Transcriptions", desc: "Enable AI transcription for all meetings.", default: false },
    { key: "sendSummaries", title: "AI Daily Summary", desc: "Let Copilot send you an automatic summary every evening.", default: false },
    { key: "recurringDefault", title: "Recurring Default", desc: "Set new meetings as recurring by default.", default: false },
    { key: "autoRecord", title: "Auto Record Meetings", desc: "Automatically record all scheduled meetings.", default: true },
  ];

  const nameToDisplay = profile?.fullName || user?.displayName || "User";
  const initials = profile?.avatarInitials || nameToDisplay.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || "U";

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const res = await api.patch("/api/user/profile", { fullName: editName });
      setProfile(res.data);
      if(updateProfile) await updateProfile(editName);
    } catch(err) { console.error(err); }
    setEditLoading(false);
    setIsEditing(false);
  };

  if (loading) return (
     <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" /></div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[900px] mx-auto space-y-8 pb-10">
      
      {/* Hero Card */}
      <motion.div variants={slideUp(0)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMiIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')]"></div>
        </div>
        <div className="px-8 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-blue-700"
               style={{ background: "linear-gradient(135deg, #dbeafe, #c7d2fe)" }}>
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">{nameToDisplay}</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm border border-white"></span>
            </div>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              {profile?.jobTitle || "Product Manager"} - {profile?.department || "Engineering"} - {profile?.company || "Company"}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">
              {profile?.phone || "No phone added"} - {profile?.timezone || "UTC"}
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <motion.button onClick={() => setIsEditing(!isEditing)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-2 text-[12px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {isEditing ? "Cancel Edit" : "Edit Details"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }} className="px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:shadow-md rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
              Share Profile
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="text-[13px] font-bold text-slate-800 mb-3">Update Identity</h3>
              <div className="flex items-center gap-3">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" className="px-4 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 min-w-[250px]" />
                <button onClick={handleSaveProfile} disabled={editLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl shadow-sm disabled:opacity-50">
                  {editLoading ? "Saving" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Productivity Stats Grid */}
      <section>
        <motion.p variants={slideUp(0.05)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mx-2 mb-3">Productivity Stats</motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={slideUp(0.1)} whileHover={{ scale: 1.02, y: -2 }} className="bg-blue-50 rounded-2xl p-4 border border-blue-100/50 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[28px] font-bold text-blue-700 leading-none">{stats?.totalMeetings || 0}</p>
            <p className="text-[11px] font-semibold text-blue-600 mt-2">Total Meetings Handled</p>
          </motion.div>
          <motion.div variants={slideUp(0.15)} whileHover={{ scale: 1.02, y: -2 }} className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 shadow-sm hover:shadow-md transition-shadow">
             <p className="text-[28px] font-bold text-amber-700 leading-none">{(stats?.totalMeetings ? (stats.totalMeetings * 45) / 60 : 0).toFixed(1)} hrs</p>
             <p className="text-[11px] font-semibold text-amber-600 mt-2">Est. Meeting Hours</p>
          </motion.div>
          <motion.div variants={slideUp(0.25)} whileHover={{ scale: 1.02, y: -2 }} className="bg-violet-50 rounded-2xl p-4 border border-violet-100/50 shadow-sm hover:shadow-md transition-shadow">
             <p className="text-[28px] font-bold text-violet-700 leading-none">{stats?.completedTasks || 0}/{((stats?.pendingTasks||0)+(stats?.completedTasks||0))}</p>
             <p className="text-[11px] font-semibold text-violet-600 mt-2">Tasks Completed</p>
          </motion.div>
          <motion.div variants={slideUp(0.3)} whileHover={{ scale: 1.02, y: -2 }} className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 shadow-sm hover:shadow-md transition-shadow">
             <p className="text-[24px] font-bold text-emerald-700 leading-none">{stats?.productivityScore || 85}%</p>
             <p className="text-[11px] font-semibold text-emerald-600 mt-2">Productivity Score</p>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Work Style */}
          <motion.div variants={slideUp(0.35)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Work Style</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[14px]">HF</div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Highly Focused</p>
                  <p className="text-[11px] text-slate-500">Completes tasks on time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[14px]">AC</div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Active Communicator</p>
                  <p className="text-[11px] text-slate-500">Attends most team syncs</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-[14px]">ST</div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Strategic Thinker</p>
                  <p className="text-[11px] text-slate-500">Plans 3 meetings per week</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
               <span className="text-[10px] font-semibold tracking-wide bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full">Product</span>
               <span className="text-[10px] font-semibold tracking-wide bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full">Engineering</span>
               <span className="text-[10px] font-semibold tracking-wide bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full">+3 tags</span>
            </div>
          </motion.div>

          {/* Recent Meeting Activity */}
          <motion.div variants={slideUp(0.4)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Meeting Activity</h3>
             </div>
             <div className="divide-y divide-slate-50">
               {ACTIVITY.map((m, i) => (
                 <div key={i} className={`px-5 py-4 border-l-4 ${m.border} hover:bg-slate-50 transition-colors flex items-center justify-between`}>
                   <div className="min-w-0 pr-3">
                     <p className="text-[12px] font-semibold text-slate-800 truncate">{m.title}</p>
                     <p className="text-[10px] font-medium text-slate-500 mt-0.5">{m.date} - {m.dur}</p>
                   </div>
                   <button className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                     View Summary
                   </button>
                 </div>
               ))}
             </div>
          </motion.div>
        </div>

        <div className="md:col-span-2 space-y-6">
           {/* Top Teammates */}
           <motion.div variants={slideUp(0.45)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Top Teammates</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                {TEAMMATES.map((tm, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05 }} className="min-w-[124px] snap-center bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold ${tm.color} mb-3 shadow-sm border-2 border-white`}>
                      {tm.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <p className="text-[12px] font-bold text-slate-800">{tm.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mb-2 mt-0.5">{tm.role}</p>
                    <span className="text-[10px] font-bold bg-white text-slate-600 border border-slate-200 px-3 py-1 rounded-full">{tm.mtgs} Meetings</span>
                  </motion.div>
                ))}
              </div>
           </motion.div>

           {/* Account Preferences */}
           <motion.div variants={slideUp(0.5)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Preferences</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {PREF_MAP.map((setting) => {
                  const isActive = profile?.preferences?.[setting.key] ?? setting.default;
                  return (
                  <div key={setting.key} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">{setting.title}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{setting.desc}</p>
                    </div>
                    <div onClick={() => handleTogglePref(setting.key)} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isActive ? "bg-blue-600" : "bg-slate-300"}`}>
                      <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-sm" animate={{ x: isActive ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </div>
                  </div>
                )})}
              </div>
           </motion.div>



           {/* Account & Security */}
           <motion.div variants={slideUp(0.6)} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account and Security</h3>
              </div>
              <div className="divide-y divide-slate-50">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Change Password</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Last changed 3 months ago</p>
                  </div>
                  <button className="text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl transition-colors">Update</button>
                </div>
                <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Two Factor Authentication</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Secure your account</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-100">Enabled</div>
                </div>
                <div className="px-6 py-5">
                  <p className="text-[12px] font-bold text-slate-800 mb-3">Active Sessions</p>
                  <div className="space-y-3">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">Chrome on MacBook</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Current Session</p>
                        </div>
                        <button className="text-[11px] font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">Revoke</button>
                     </div>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">Mobile App on iPhone 14</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Last active 2 hrs ago</p>
                        </div>
                        <button className="text-[11px] font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">Revoke</button>
                     </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4">
                <button className="flex-1 text-[13px] font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-4 py-3 rounded-xl transition-colors text-center shadow-sm">Export My Data</button>
                <button className="flex-1 text-[13px] font-bold bg-red-600 text-white hover:bg-red-700 shadow-md px-4 py-3 rounded-xl transition-colors text-center">Delete Account</button>
              </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Reports Page ──────────────────────────────────────────────────────────────
function ReportsPage() {
  const [filter, setFilter] = useState("This Week");
  const tabs = ["This Week", "This Month", "Last 3 Months", "All Time"];

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const slideUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } } };

  const factor = filter === "This Week" ? 1 : filter === "This Month" ? 4 : filter === "Last 3 Months" ? 12 : 24;

  const barData = {
    labels: ["Week 1", "Week 2", "Week 3", "Current"],
    datasets: [{
      data: [6 * factor, 8 * factor, 5 * factor, 12 * factor],
      backgroundColor: (ctx) => ctx.dataIndex === 3 ? "#3b82f6" : "#cbd5e1",
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } },
    scales: { x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: "'Google Sans', sans-serif" } } }, y: { display: false, grid: { display: false } } },
    animation: { duration: 1500, easing: "easeOutQuart" }
  };

  const donutData = {
    labels: ["Completed", "Pending", "Overdue"],
    datasets: [{
      data: [87, 10, 3],
      backgroundColor: ["#3b82f6", "#f59e0b", "#ef4444"],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };
  const donutOptions = { cutout: "75%", plugins: { legend: { display: false }, tooltip: { cornerRadius: 8 } }, animation: { animateScale: true, animateRotate: true, duration: 1500 } };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayData = [40, 60, 100, 45, 80, 20, 10];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-[960px] mx-auto space-y-8 pb-12">
      
      {/* Filter Bar */}
      <motion.div variants={slideUp} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm ${filter === t ? 'text-white border-transparent' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`} style={filter === t ? { background: "linear-gradient(135deg, #2563eb, #4f46e5)" } : {}}>
            {t}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={filter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
          
          {/* Health Score Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Meeting Health Score</p>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <motion.circle cx="70" cy="70" r="60" fill="none" stroke="url(#healthGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 60} initial={{ strokeDashoffset: 2 * Math.PI * 60 }} animate={{ strokeDashoffset: (2 * Math.PI * 60) * (1 - 0.87) }} transition={{ duration: 2, ease: "easeOut" }} />
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[36px] font-bold text-slate-800 leading-none tracking-tight">87</span>
                  <span className="text-[12px] font-bold text-slate-400 mt-1">out of 100</span>
                </div>
                <div className="absolute top-0 -right-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
                  Excellent
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-bold text-slate-700">Focus Score</span>
                    <span className="text-[13px] font-bold text-blue-600">78 Percent</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-bold text-slate-700">Outcome Score</span>
                    <span className="text-[13px] font-bold text-emerald-600">91 Percent</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "91%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-bold text-slate-700">Attendance Score</span>
                    <span className="text-[13px] font-bold text-violet-600">94 Percent</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }} className="h-full bg-violet-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col aspect-square max-h-[380px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Meeting Activity</p>
              <div className="flex-1 w-full relative">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center relative aspect-square max-h-[380px]">
              <div className="absolute top-6 left-6 right-6 flex justify-between">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Task Performance</p>
              </div>
              <div className="relative mt-8">
                <Doughnut data={donutData} options={donutOptions} width={200} height={200} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[28px] font-bold text-slate-800 leading-none tracking-tight">87 Percent</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-1">Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Reclaimed & Digest Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Time Reclaimed This Month</p>
              <div className="flex items-end gap-4">
                <span className="text-[48px] font-bold text-blue-600 leading-none tracking-tight flex items-end">
                  4.5 <span className="text-[24px] ml-1 mb-1">hrs</span>
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-2 border border-emerald-100">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  2.1 hrs saved
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-5">Weekly Digest</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-[13px] font-bold text-slate-700">Attended twelve meetings</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-[13px] font-bold text-slate-700">Completed twenty four tasks</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <p className="text-[13px] font-bold text-slate-700">Spent nine hours in meetings</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                  <p className="text-[13px] font-bold text-slate-700">Top collaborator was Sara M.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Most Productive Day */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-8">
            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Your Most Productive Day</h2>
              <p className="text-[14px] font-bold text-slate-500 mt-1">Historically, you perform best on <span className="text-blue-600">Wednesday</span></p>
            </div>
            <div className="flex items-end justify-between gap-2 h-48 px-2">
              {days.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-4 flex-1">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${dayData[i]}%` }} transition={{ duration: 1, delay: i * 0.1, type: "spring", damping: 20 }}
                    className={`w-full max-w-[48px] rounded-t-xl ${dayData[i] === 100 ? 'shadow-sm' : 'opacity-40'}`} 
                    style={dayData[i] === 100 ? { background: "linear-gradient(180deg, #3b82f6, #4f46e5)" } : { background: "#cbd5e1" }}
                  />
                  <span className={`text-[12px] font-bold ${dayData[i] === 100 ? 'text-blue-600' : 'text-slate-400'}`}>{d}</span>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
const SETTINGS_TABS = ["General", "Notifications", "Meeting Defaults", "Privacy and Security", "Appearance"];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General State
  const [lang, setLang] = useState("English");
  const [timezone, setTimezone] = useState("IST");
  const [dateFormat, setDateFormat] = useState("DD MM YYYY");
  const [currentTime, setCurrentTime] = useState("");

  // Notifications State
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifMtgReminders, setNotifMtgReminders] = useState(true);
  const [notifTaskDeadline, setNotifTaskDeadline] = useState(true);
  const [notifAISummary, setNotifAISummary] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);
  const [notifBrowserPush, setNotifBrowserPush] = useState(false);

  // Meeting Defaults State
  const [defMtgDur, setDefMtgDur] = useState(30);
  const [defMtgType, setDefMtgType] = useState("Team");
  const [autoRecordMtg, setAutoRecordMtg] = useState(false);
  const [prefMtgTime, setPrefMtgTime] = useState("Morning");

  // Privacy & Security State
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, name: "Chrome on MacBook" },
    { id: 2, name: "Mobile App on iPhone 14" }
  ]);

  // Appearance State
  const [theme, setTheme] = useState("Light");
  const [accentColor, setAccentColor] = useState("blue");
  const [fontSize, setFontSize] = useState("Medium");

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meetflow_settings"));
      if (saved) {
        if (saved.lang) setLang(saved.lang);
        if (saved.timezone) setTimezone(saved.timezone);
        if (saved.dateFormat) setDateFormat(saved.dateFormat);
        if (saved.notifEmail !== undefined) setNotifEmail(saved.notifEmail);
        if (saved.notifMtgReminders !== undefined) setNotifMtgReminders(saved.notifMtgReminders);
        if (saved.notifTaskDeadline !== undefined) setNotifTaskDeadline(saved.notifTaskDeadline);
        if (saved.notifAISummary !== undefined) setNotifAISummary(saved.notifAISummary);
        if (saved.notifWeeklyDigest !== undefined) setNotifWeeklyDigest(saved.notifWeeklyDigest);
        if (saved.notifBrowserPush !== undefined) setNotifBrowserPush(saved.notifBrowserPush);
        if (saved.defMtgDur) setDefMtgDur(saved.defMtgDur);
        if (saved.defMtgType) setDefMtgType(saved.defMtgType);
        if (saved.autoRecordMtg !== undefined) setAutoRecordMtg(saved.autoRecordMtg);
        if (saved.prefMtgTime) setPrefMtgTime(saved.prefMtgTime);
        if (saved.twoFactorAuth !== undefined) setTwoFactorAuth(saved.twoFactorAuth);
        if (saved.activeSessions) setActiveSessions(saved.activeSessions);
        if (saved.theme) setTheme(saved.theme);
        if (saved.accentColor) setAccentColor(saved.accentColor);
        if (saved.fontSize) setFontSize(saved.fontSize);
      }
    } catch (e) {
      console.warn("Could not read settings from localStorage", e);
    }
  }, []);

  // Update Clock
  useEffect(() => {
    const tzMap = {
      "IST": "Asia/Kolkata",
      "UTC": "UTC",
      "EST": "America/New_York",
      "PST": "America/Los_Angeles"
    };
    const updateTime = () => {
      try {
        const timeString = new Date().toLocaleTimeString("en-US", { timeZone: tzMap[timezone], hour: '2-digit', minute:'2-digit', second:'2-digit' });
        setCurrentTime(timeString);
      } catch(e) { setCurrentTime(new Date().toLocaleTimeString()); }
    };
    updateTime();
    const intv = setInterval(updateTime, 1000);
    return () => clearInterval(intv);
  }, [timezone]);

  // Track changes to enable Save button (simplistic approach: any change sets hasChanges)
  const markChanged = () => { setHasChanges(true); };

  const handleSaveAll = () => {
    if(!hasChanges) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      const stateToSave = {
        lang, timezone, dateFormat,
        notifEmail, notifMtgReminders, notifTaskDeadline, notifAISummary, notifWeeklyDigest, notifBrowserPush,
        defMtgDur, defMtgType, autoRecordMtg, prefMtgTime,
        twoFactorAuth, activeSessions,
        theme, accentColor, fontSize
      };
      localStorage.setItem("meetflow_settings", JSON.stringify(stateToSave));
      setIsSaving(false);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 700);
  };

  const handlePasswordSave = () => {
    setPassError("");
    setPassSuccess("");
    if(!curPass || !newPass || !confPass) {
       setPassError("All password fields are required.");
       return;
    }
    if(newPass !== confPass) {
       setPassError("Passwords do not match");
       return;
    }
    setPassSuccess("Password updated successfully.");
    setCurPass(""); setNewPass(""); setConfPass("");
  };

  const revokeSession = (id) => {
    setActiveSessions(activeSessions.filter(s => s.id !== id));
    markChanged();
  };

  const themeClasses = theme === "Dark" ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800";
  const borderClasses = theme === "Dark" ? "border-slate-800" : "border-slate-100";
  const inputTheme = theme === "Dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800";
  const textMuted = theme === "Dark" ? "text-slate-400" : "text-slate-500";
  
  const ACCENT_MAP = {
    blue: { bg: "bg-blue-500", lightText: "text-blue-600", lightBg: "bg-blue-50", hex: "#3b82f6" },
    violet: { bg: "bg-violet-500", lightText: "text-violet-600", lightBg: "bg-violet-50", hex: "#8b5cf6" },
    emerald: { bg: "bg-emerald-500", lightText: "text-emerald-600", lightBg: "bg-emerald-50", hex: "#10b981" },
    slate: { bg: "bg-slate-600", lightText: "text-slate-700", lightBg: "bg-slate-100", hex: "#475569" },
  };

  const currentAccent = ACCENT_MAP[accentColor] || ACCENT_MAP.blue;
  const fontClass = fontSize === "Small" ? "text-[12px]" : (fontSize === "Large" ? "text-[16px]" : "text-[14px]");
  
  if (theme === "Dark") {
    // Dynamic tailwind class injecting via a side effect (a bit hacky but fulfills requirement)
    if(typeof document !== 'undefined') document.documentElement.classList.add('dark');
  } else {
    if(typeof document !== 'undefined') document.documentElement.classList.remove('dark');
  }

  const ToggleSwitch = ({ checked, onChange, label, sub }) => (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className={`font-bold ${theme === "Dark" ? "text-slate-200" : "text-slate-800"}`}>{label}</div>
        <div className={`text-[12px] mt-0.5 ${textMuted}`}>{sub}</div>
      </div>
      <div onClick={() => { onChange(!checked); markChanged(); }} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${checked ? currentAccent.bg : (theme==='Dark'?'bg-slate-700':'bg-slate-200')}`}>
        <motion.div layout className={`w-5 h-5 rounded-full shadow-sm bg-white`} animate={{ x: checked ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </div>
    </div>
  );

  return (
    <div className={`max-w-[860px] mx-auto min-h-[70vh] rounded-2xl ${themeClasses} border ${borderClasses} shadow-sm overflow-hidden flex relative`}>
      
      {/* Sidebar Tabs */}
      <div className={`w-64 border-r ${borderClasses} flex flex-col pt-6 ${theme === "Dark" ? "bg-slate-900/50" : "bg-slate-50/50"}`}>
        <div className={`px-6 pb-4 text-[11px] font-bold uppercase tracking-widest ${textMuted}`}>Settings</div>
        <div className="flex-1 overflow-y-auto">
          {SETTINGS_TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-6 py-3.5 text-[13px] font-bold transition-colors relative ${isActive ? currentAccent.lightText : textMuted + " hover:text-slate-800"}`}
                style={isActive ? { backgroundColor: theme === "Dark" ? currentAccent.hex+"1a" : currentAccent.lightBg } : {}}
              >
                {isActive && <motion.div layoutId="activeTabMarker" className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: currentAccent.hex }} />}
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Panel */}
      <div className={`flex-1 p-8 overflow-y-auto relative ${fontClass}`}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6 pb-20">
            <h2 className="text-[20px] font-bold tracking-tight mb-8">{activeTab}</h2>

            {/* TAB: General */}
            {activeTab === "General" && (
              <div className="space-y-8 max-w-md">
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Language</label>
                  <select value={lang} onChange={(e) => { setLang(e.target.value); markChanged(); }} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputTheme}`}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                  <p className={`mt-2 text-[12px] ${textMuted}`}>Current Language: <span className="font-bold">{lang}</span></p>
                </div>
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Timezone</label>
                  <select value={timezone} onChange={(e) => { setTimezone(e.target.value); markChanged(); }} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputTheme}`}>
                    <option value="IST">IST (GMT +5:30)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="EST">EST (GMT -5:00)</option>
                    <option value="PST">PST (GMT -8:00)</option>
                  </select>
                  <p className={`mt-2 text-[12px] ${textMuted}`}>Live Time: <span className="font-bold font-mono">{currentTime}</span></p>
                </div>
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Date Format</label>
                  <div className="flex gap-3">
                    {["DD MM YYYY", "MM DD YYYY"].map(df => (
                      <button key={df} onClick={() => { setDateFormat(df); markChanged(); }} className={`px-5 py-2.5 rounded-xl font-bold text-[13px] border transition-colors ${dateFormat === df ? currentAccent.bg + ' border-transparent text-white shadow-sm' : inputTheme + ' hover:border-slate-300'}`}>
                        {df}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Notifications */}
            {activeTab === "Notifications" && (
              <div className={`divide-y ${theme === "Dark" ? "divide-slate-800" : "divide-slate-100"}`}>
                <ToggleSwitch checked={notifEmail} onChange={setNotifEmail} label="Email Notifications" sub="Receive updates and alerts via email" />
                <ToggleSwitch checked={notifMtgReminders} onChange={setNotifMtgReminders} label="Meeting Reminders" sub="15 minutes before" />
                <ToggleSwitch checked={notifTaskDeadline} onChange={setNotifTaskDeadline} label="Task Deadline Alerts" sub="Notification when task is due soon" />
                <ToggleSwitch checked={notifAISummary} onChange={setNotifAISummary} label="AI Summary" sub="After each meeting" />
                <ToggleSwitch checked={notifWeeklyDigest} onChange={setNotifWeeklyDigest} label="Weekly Digest" sub="Every Monday morning" />
                <ToggleSwitch checked={notifBrowserPush} onChange={setNotifBrowserPush} label="Browser Push Notifications" sub="Receive native browser alerts" />
              </div>
            )}

            {/* TAB: Meeting Defaults */}
            {activeTab === "Meeting Defaults" && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Default Meeting Duration</label>
                  <select value={defMtgDur} onChange={(e) => { setDefMtgDur(Number(e.target.value)); markChanged(); }} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputTheme}`}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Default Meeting Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Team", "Client", "One on One", "Standup"].map(type => (
                      <button key={type} onClick={() => { setDefMtgType(type); markChanged(); }} className={`px-5 py-2.5 rounded-full font-bold text-[13px] border transition-colors ${defMtgType === type ? currentAccent.bg + ' border-transparent text-white shadow-sm' : inputTheme + ' hover:border-slate-300'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`pt-4 border-t ${borderClasses}`}>
                  <ToggleSwitch checked={autoRecordMtg} onChange={setAutoRecordMtg} label="Auto Record Meetings" sub="Record meetings automatically by default" />
                </div>
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Preferred Meeting Time</label>
                  <div className="flex flex-wrap gap-2">
                    {["Morning", "Afternoon", "Evening"].map(time => (
                      <button key={time} onClick={() => { setPrefMtgTime(time); markChanged(); }} className={`px-5 py-2.5 rounded-full font-bold text-[13px] border transition-colors ${prefMtgTime === time ? currentAccent.bg + ' border-transparent text-white shadow-sm' : inputTheme + ' hover:border-slate-300'}`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Privacy and Security */}
            {activeTab === "Privacy and Security" && (
              <div className="space-y-10 max-w-lg">
                {/* Change Password */}
                <div>
                  <h3 className={`text-[12px] font-bold uppercase tracking-widest mb-5 ${textMuted}`}>Change Password</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <input type={showCurPass?"text":"password"} placeholder="Current Password" value={curPass} onChange={e=>setCurPass(e.target.value)} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputTheme}`} />
                      <button onClick={()=>setShowCurPass(!showCurPass)} className={`absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold ${textMuted}`}>
                        {showCurPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showNewPass?"text":"password"} placeholder="New Password" value={newPass} onChange={e=>setNewPass(e.target.value)} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputTheme}`} />
                      <button onClick={()=>setShowNewPass(!showNewPass)} className={`absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold ${textMuted}`}>
                        {showNewPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showConfPass?"text":"password"} placeholder="Confirm New Password" value={confPass} onChange={e=>setConfPass(e.target.value)} className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 flex flex-col ${inputTheme}`} />
                      <button onClick={()=>setShowConfPass(!showConfPass)} className={`absolute right-4 top-[1.3rem] -translate-y-1/2 text-[12px] font-bold ${textMuted}`}>
                        {showConfPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    {passError && <p className="text-red-500 text-[12px] font-bold">{passError}</p>}
                    {passSuccess && <p className="text-emerald-500 text-[12px] font-bold">{passSuccess}</p>}
                    <button onClick={handlePasswordSave} className={`px-6 py-3 rounded-xl font-bold text-[13px] text-white transition-shadow shadow-sm hover:shadow-md ${currentAccent.bg}`}>
                      Save Password
                    </button>
                  </div>
                </div>

                {/* 2FA */}
                <div className={`pt-6 border-t ${borderClasses}`}>
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-bold">Two Factor Authentication</div>
                       <div className={`text-[12px] mt-0.5 ${textMuted}`}>Add an extra layer of security</div>
                     </div>
                     <div className="flex items-center gap-4">
                       {twoFactorAuth ? <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold px-3 py-1 rounded-full">Enabled</span> : <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full">Disabled</span>}
                       <div onClick={() => { setTwoFactorAuth(!twoFactorAuth); markChanged(); }} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${twoFactorAuth ? currentAccent.bg : (theme==='Dark'?'bg-slate-700':'bg-slate-200')}`}>
                         <motion.div layout className={`w-5 h-5 rounded-full shadow-sm bg-white`} animate={{ x: twoFactorAuth ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                       </div>
                     </div>
                   </div>
                </div>

                {/* Active Sessions */}
                <div className={`pt-6 border-t ${borderClasses}`}>
                  <h3 className={`text-[12px] font-bold uppercase tracking-widest mb-4 ${textMuted}`}>Active Sessions</h3>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {activeSessions.map(sess => (
                        <motion.div key={sess.id} initial={{ height: 'auto', opacity: 1, marginBottom: 12 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }} className={`flex justify-between items-center p-4 rounded-xl border ${inputTheme}`}>
                          <div className="font-bold text-[13px]">{sess.name}</div>
                          <button onClick={() => revokeSession(sess.id)} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border hover:bg-slate-100 transition-colors ${theme === 'Dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>Revoke</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {activeSessions.length === 0 && <p className={`text-[12px] ${textMuted}`}>No active sessions.</p>}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className={`pt-6 border-t ${borderClasses} flex gap-4`}>
                  <button onClick={() => alert("Export started")} className="flex-1 py-3 px-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-[13px] hover:bg-red-100 transition-colors">Export My Data</button>
                  <button onClick={() => confirm("Are you sure you want to delete your account?") && alert("Account deletion requested")} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-[13px] hover:bg-red-700 shadow-sm transition-colors">Delete Account</button>
                </div>
              </div>
            )}

            {/* TAB: Appearance */}
            {activeTab === "Appearance" && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>Theme</label>
                  <div className="flex gap-3">
                    {["Light", "Dark"].map(t => (
                      <button key={t} onClick={() => { setTheme(t); markChanged(); }} className={`px-5 py-2.5 rounded-xl font-bold text-[13px] border transition-colors ${theme === t ? currentAccent.bg + ' border-transparent text-white shadow-sm' : inputTheme + ' hover:border-slate-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-[12px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>Sidebar Accent Color</label>
                  <div className="flex gap-4">
                    {Object.keys(ACCENT_MAP).map(col => (
                      <button key={col} onClick={() => { setAccentColor(col); markChanged(); }} className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform ${accentColor === col ? 'scale-125 ring-2 ring-offset-2 ring-slate-300' : 'hover:scale-110'}`} style={{ backgroundColor: ACCENT_MAP[col].hex }}>
                         {accentColor === col && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                   <label className={`block text-[12px] font-bold uppercase tracking-widest mb-3 ${textMuted}`}>Font Size</label>
                   <div className="flex gap-3">
                    {["Small", "Medium", "Large"].map(fs => (
                      <button key={fs} onClick={() => { setFontSize(fs); markChanged(); }} className={`px-5 py-2.5 rounded-xl font-bold text-[13px] border transition-colors ${fontSize === fs ? currentAccent.bg + ' border-transparent text-white shadow-sm' : inputTheme + ' hover:border-slate-300'}`}>
                        {fs}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Global Save Button Fixed Container */}
        <div className={`absolute bottom-0 right-0 left-0 p-6 flex justify-end ${theme === "Dark" ? "bg-gradient-to-t from-slate-900 via-slate-900 to-transparent" : "bg-gradient-to-t from-white via-white to-transparent"} pointer-events-none`}>
          <button 
            disabled={!hasChanges && !isSaving && !saveSuccess}
            onClick={handleSaveAll}
            className={`pointer-events-auto px-6 py-3 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center min-w-[140px] shadow-sm ${!hasChanges && !isSaving && !saveSuccess ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'text-white'}`}
            style={hasChanges ? { background: "linear-gradient(135deg, #2563eb, #4f46e5)" } : (saveSuccess ? { background: "#10b981" } : {})}
          >
            {isSaving ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
               <div className="flex items-center gap-2">✓ Saved successfully</div>
            ) : (
               "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, handleSignOut }) {

  const { updateProfile } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  const renderPage = () => {
    switch (activeNav) {
      case "dashboard": return <DashboardContent setActiveNav={setActiveNav} setCopilotOpen={setCopilotOpen} />;
      case "tasks": return <TasksPage />;
      case "meetings": return <MeetingsPage />;
      case "profile": return <ProfilePage user={user} updateProfile={updateProfile} />;
      case "reports": return <ReportsPage />;
      case "settings": return <SettingsPage />;
      default:
        const item = NAV.find(n => n.id === activeNav);
        return <PlaceholderPage label={item?.label ?? activeNav} icon={item?.icon ?? "📄"} />;
    }
  };

  const shortName = user?.displayName ? user.displayName.split(' ')[0] : "User";
  const initials = user?.displayName ? user.displayName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : "U";

  return (
    <div className="min-h-screen text-slate-800" style={{ background: "linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f0fff4 100%)", fontFamily: "'Google Sans', sans-serif" }}>
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)" }}
        className="fixed top-0 left-0 h-full w-60 border-r border-slate-100/80 flex flex-col z-20 shadow-[1px_0_20px_rgba(0,0,0,0.04)]"
      >
        <div className="px-5 py-5 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-800 leading-tight">Smart Meeting</div>
              <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">Intelligence System</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-2 mb-2">Main</p>
          {NAV.slice(0, 4).map(item => <NavItem key={item.id} item={item} active={activeNav} onNav={setActiveNav} />)}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-2 mt-5 mb-2">Analytics</p>
          {NAV.slice(4).map(item => <NavItem key={item.id} item={item} active={activeNav} onNav={setActiveNav} />)}

          <div className="mt-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] px-2 mb-2">AI Assistant</p>
            <motion.button
              onClick={() => setCopilotOpen(true)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative overflow-hidden ${
                copilotOpen ? "text-violet-700 shadow-sm" : "text-slate-600 hover:text-violet-700"
              }`}
              style={copilotOpen
                ? { background: "linear-gradient(135deg, #f5f3ff, #eff6ff)" }
                : { background: "linear-gradient(135deg, #faf5ff, #f0f4ff)" }}
            >
              <motion.div
                className="absolute inset-0 opacity-0 hover:opacity-100"
                style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.05), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
              <CopilotIcon size={16} className="shrink-0" />
              <span>Copilot</span>
              <span className="ml-auto text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                AI
              </span>
            </motion.button>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-slate-100/80 bg-white/60">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer relative group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-blue-700 shrink-0"
              style={{ background: "linear-gradient(135deg, #dbeafe, #c7d2fe)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-slate-800 leading-tight">{user?.displayName || "User"}</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{user?.email || "Product Manager"}</div>
            </div>
            <button 
              onClick={handleSignOut}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 text-slate-600 p-1.5 rounded text-[10px] font-bold hover:bg-red-100 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="ml-60 flex flex-col min-h-screen">
        <Header onNotif={() => setNotifOpen(true)} unreadCount={unreadCount} userName={shortName} setActiveNav={setActiveNav} />
        <main className="flex-1 px-8 py-7 max-w-6xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
