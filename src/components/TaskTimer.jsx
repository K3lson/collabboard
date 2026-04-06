import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Play, Square } from "lucide-react";

const STORAGE_KEY = "collab_active_timer";

export function getActiveTimer() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export default function TaskTimer({ task, onLogged }) {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds

  useEffect(() => {
    const timer = getActiveTimer();
    if (timer?.taskId === task.id) {
      setActive(true);
      setElapsed(Math.floor((Date.now() - timer.startMs) / 1000));
    }
  }, [task.id]);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      const timer = getActiveTimer();
      if (timer?.taskId === task.id) {
        setElapsed(Math.floor((Date.now() - timer.startMs) / 1000));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [active, task.id]);

  const startTimer = useCallback(async (e) => {
    e.stopPropagation();
    // Stop any other running timer first
    const existing = getActiveTimer();
    if (existing) {
      localStorage.removeItem(STORAGE_KEY);
    }
    const startMs = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ taskId: task.id, startMs }));
    setActive(true);
    setElapsed(0);
  }, [task.id]);

  const stopTimer = useCallback(async (e) => {
    e.stopPropagation();
    const timer = getActiveTimer();
    if (!timer) return;
    const endMs = Date.now();
    const durationMinutes = Math.round((endMs - timer.startMs) / 60000);
    localStorage.removeItem(STORAGE_KEY);
    setActive(false);
    setElapsed(0);
    if (durationMinutes < 1) return; // ignore sub-minute sessions
    const user = await base44.auth.me();
    await base44.entities.TimeLog.create({
      task_id: task.id,
      task_title: task.title,
      project_id: task.project_id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      start_time: new Date(timer.startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      duration_minutes: durationMinutes,
    });
    if (onLogged) onLogged();
  }, [task]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <button
      onClick={active ? stopTimer : startTimer}
      className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-all ${
        active
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
      }`}
      title={active ? "Stop timer" : "Start timer"}
    >
      {active ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
      {active ? fmt(elapsed) : "Track"}
    </button>
  );
}