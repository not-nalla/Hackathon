import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";

const parseTaskDueDate = (task) => {
  if (!task) return null;
  const raw = task.deadline || task.dueDate || task.due || task.date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const { tasks } = useAppData();

  const task = useMemo(
    () => (tasks || []).find((item) => String(item?._id || item?.id) === String(id)),
    [id, tasks]
  );

  if (!task) {
    return (
      <div className="dashboard-theme dashboard-detail-page">
        <div className="dashboard-detail-card">
          <h1>Task not found</h1>
          <p>The selected task does not exist or is not available.</p>
          <Link to="/dashboard?tab=tasks" className="dashboard-detail-link">Back to Tasks</Link>
        </div>
      </div>
    );
  }

  const dueDate = parseTaskDueDate(task);
  const members = task.members || task.assignedMembers || (task.assignee ? [task.assignee] : []);
  const status = task.status || (task.done ? "Completed" : "Pending");

  return (
    <div className="dashboard-theme dashboard-detail-page">
      <div className="dashboard-detail-card">
        <h1>{task.name || "Untitled task"}</h1>
        <p className="dashboard-detail-sub">Task Details</p>

        <div className="dashboard-detail-grid">
          <div>
            <span>Task Name</span>
            <p>{task.name || "Untitled task"}</p>
          </div>
          <div>
            <span>Status</span>
            <p>{status}</p>
          </div>
          <div>
            <span>Due Date</span>
            <p>{dueDate ? dueDate.toLocaleDateString([], { dateStyle: "full" }) : "No due date"}</p>
          </div>
          <div>
            <span>Assigned Members</span>
            <p>{members.length ? members.join(", ") : "No assigned members"}</p>
          </div>
          <div>
            <span>Description</span>
            <p>{task.description || "No description available"}</p>
          </div>
        </div>

        <div className="dashboard-detail-actions">
          <Link to="/dashboard?tab=tasks" className="dashboard-detail-link">Back to Tasks</Link>
        </div>
      </div>
    </div>
  );
}

