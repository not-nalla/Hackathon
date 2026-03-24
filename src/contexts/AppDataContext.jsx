/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AppDataContext = createContext(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};

export const AppDataProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    const token = localStorage.getItem("smis_token");
    if (!token) {
      setMeetings([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [meetingsRes, tasksRes] = await Promise.all([
        api.get("/api/meetings", { skipAuthRedirect: true }),
        api.get("/api/tasks", { skipAuthRedirect: true }),
      ]);
      setMeetings(Array.isArray(meetingsRes.data) ? meetingsRes.data : []);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
    } catch (error) {
      if (error?.response?.status === 401) {
        setMeetings([]);
        setTasks([]);
        return;
      }
      console.error("Failed to refresh app data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = useMemo(
    () => ({
      meetings,
      tasks,
      loading,
      refreshData,
      setMeetings,
      setTasks,
    }),
    [loading, meetings, refreshData, tasks]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
