import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { addDays, differenceInDays, format, parseISO, startOfDay, isValid } from "date-fns";
import { CalendarDays, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DAY_WIDTH = 36;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 60;
const LEFT_W = 220;

const PRIORITY_COLORS = {
  low: "#94a3b8",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

const COL_LABELS = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
  review: "Review", done: "Done",
};

export default function GanttView({ projectId, tasks, onTaskUpdated }) {
  const today = startOfDay(new Date());
  const windowStart = addDays(today, -14);
  const TOTAL_DAYS = 84; // 12 weeks

  const [dragState, setDragState] = useState(null);
  const [liveOffsets, setLiveOffsets] = useState({}); // taskId -> { dxDays, dwDays }
  const scrollRef = useRef(null);

  const tasksWithDates = tasks.filter(t => t.start_date && t.due_date &&
    isValid(parseISO(t.start_date)) && isValid(parseISO(t.due_date)));
  const tasksWithoutDates = tasks.filter(t => !t.start_date || !t.due_date);
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));

  const dateToX = (dateStr) => differenceInDays(parseISO(dateStr), windowStart) * DAY_WIDTH;

  const onMouseDown = useCallback((e, task, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ task, type, startClientX: e.clientX });
    setLiveOffsets(prev => ({ ...prev, [task.id]: { dxDays: 0, dwDays: 0 } }));
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startClientX;
    const daysDiff = Math.round(dx / DAY_WIDTH);
    setLiveOffsets(prev => ({
      ...prev,
      [dragState.task.id]: dragState.type === "move"
        ? { dxDays: daysDiff, dwDays: 0 }
        : { dxDays: 0, dwDays: daysDiff },
    }));
  }, [dragState]);

  const onMouseUp = useCallback(async (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startClientX;
    const daysDiff = Math.round(dx / DAY_WIDTH);
    const task = dragState.task;
    const origStart = parseISO(task.start_date);
    const origEnd = parseISO(task.due_date);

    let newStart = origStart;
    let newEnd = origEnd;

    if (dragState.type === "move") {
      newStart = addDays(origStart, daysDiff);
      newEnd = addDays(origEnd, daysDiff);
    } else {
      newEnd = addDays(origEnd, daysDiff);
      if (differenceInDays(newEnd, newStart) < 1) newEnd = addDays(newStart, 1);
    }

    setDragState(null);
    setLiveOffsets({});

    await base44.entities.Task.update(task.id, {
      start_date: format(newStart, "yyyy-MM-dd"),
      due_date: format(newEnd, "yyyy-MM-dd"),
    });
    if (onTaskUpdated) onTaskUpdated();
  }, [dragState, onTaskUpdated]);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 14 * DAY_WIDTH - 80;
    }
  }, []);

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(windowStart, i));
  const totalW = TOTAL_DAYS * DAY_WIDTH;

  // Group days into weeks for header
  const weeks = [];
  for (let i = 0; i < TOTAL_DAYS; i += 7) {
    weeks.push({ start: i, label: format(addDays(windowStart, i), "MMM d") });
  }

  const todayX = differenceInDays(today, windowStart) * DAY_WIDTH;

  return (
    <div
      className="flex flex-col h-full overflow-hidden select-none"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { if (dragState) { setDragState(null); setLiveOffsets({}); } }}
    >
      <div className="flex h-full overflow-hidden">
        {/* Left panel */}
        <div className="shrink-0 border-r border-border bg-card z-10" style={{ width: LEFT_W }}>
          {/* Header spacer */}
          <div className="border-b border-border bg-muted/50 px-4 flex items-end pb-2" style={{ height: HEADER_HEIGHT }}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</span>
          </div>
          {/* Rows */}
          {tasksWithDates.map((task, i) => (
            <div
              key={task.id}
              className="flex items-center px-4 border-b border-border/50 gap-2"
              style={{ height: ROW_HEIGHT }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: PRIORITY_COLORS[task.priority] || "#94a3b8" }}
              />
              <span className="text-xs font-medium text-foreground truncate flex-1">{task.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {COL_LABELS[task.column] || task.column}
              </span>
            </div>
          ))}
          {tasksWithoutDates.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> No dates set
              </p>
            </div>
          )}
          {tasksWithoutDates.map((task) => (
            <div
              key={task.id}
              className="flex items-center px-4 border-b border-border/50 gap-2 opacity-50"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Timeline panel */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={scrollRef}>
          <div style={{ width: totalW, minHeight: "100%", position: "relative" }}>
            {/* Week header */}
            <div
              className="sticky top-0 z-10 bg-card border-b border-border flex"
              style={{ height: HEADER_HEIGHT }}
            >
              {weeks.map((w, i) => (
                <div
                  key={i}
                  className="border-r border-border/50 px-2 flex items-end pb-2"
                  style={{ width: 7 * DAY_WIDTH }}
                >
                  <span className="text-xs font-semibold text-muted-foreground">{w.label}</span>
                </div>
              ))}
            </div>

            {/* Day grid + rows */}
            <div style={{ position: "relative" }}>
              {/* Vertical day lines */}
              {days.map((d, i) => {
                const isToday = differenceInDays(d, today) === 0;
                const isMon = d.getDay() === 1;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: i * DAY_WIDTH,
                      top: 0,
                      width: DAY_WIDTH,
                      height: (tasksWithDates.length + tasksWithoutDates.length) * ROW_HEIGHT + 40,
                      background: isToday ? "hsl(var(--primary)/0.06)" : isMon ? "hsl(var(--muted)/0.4)" : "transparent",
                      borderRight: isToday ? "2px solid hsl(var(--primary)/0.5)" : isMon ? "1px solid hsl(var(--border))" : "1px solid hsl(var(--border)/0.3)",
                    }}
                  />
                );
              })}

              {/* Task bars + SVG dep lines */}
              <svg
                style={{ position: "absolute", top: 0, left: 0, width: totalW, height: tasksWithDates.length * ROW_HEIGHT, pointerEvents: "none" }}
              >
                {/* Dependency arrows */}
                {tasksWithDates.map((task, rowIndex) => {
                  if (!task.depends_on?.length) return null;
                  return task.depends_on.map((depId) => {
                    const depTask = taskMap[depId];
                    if (!depTask?.start_date || !depTask?.due_date) return null;
                    const depRow = tasksWithDates.findIndex(t => t.id === depId);
                    if (depRow < 0) return null;

                    const offset = liveOffsets[task.id] || { dxDays: 0, dwDays: 0 };
                    const depOffset = liveOffsets[depId] || { dxDays: 0, dwDays: 0 };

                    const x1 = dateToX(depTask.due_date) + (depOffset.dxDays + depOffset.dwDays) * DAY_WIDTH + DAY_WIDTH / 2;
                    const y1 = depRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const x2 = dateToX(task.start_date) + offset.dxDays * DAY_WIDTH;
                    const y2 = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

                    const midX = (x1 + x2) / 2;
                    return (
                      <g key={`${task.id}-${depId}`}>
                        <path
                          d={`M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`}
                          fill="none"
                          stroke="hsl(var(--primary)/0.5)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        <polygon
                          points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
                          fill="hsl(var(--primary)/0.5)"
                        />
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Task bars */}
              {tasksWithDates.map((task, rowIndex) => {
                const offset = liveOffsets[task.id] || { dxDays: 0, dwDays: 0 };
                const startX = dateToX(task.start_date) + offset.dxDays * DAY_WIDTH;
                const endX = dateToX(task.due_date) + (offset.dxDays + offset.dwDays) * DAY_WIDTH + DAY_WIDTH;
                const barW = Math.max(endX - startX, DAY_WIDTH);
                const isDone = task.column === "done";

                return (
                  <div
                    key={task.id}
                    style={{
                      position: "absolute",
                      top: rowIndex * ROW_HEIGHT + 8,
                      left: startX,
                      width: barW,
                      height: ROW_HEIGHT - 16,
                      cursor: dragState?.task.id === task.id ? "grabbing" : "grab",
                      zIndex: dragState?.task.id === task.id ? 20 : 10,
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => onMouseDown(e, task, "move")}
                  >
                    <div
                      className="relative h-full rounded-md flex items-center px-2.5 overflow-hidden shadow-sm"
                      style={{
                        background: PRIORITY_COLORS[task.priority] || "#3b82f6",
                        opacity: isDone ? 0.55 : 1,
                        transition: dragState?.task.id === task.id ? "none" : "opacity 0.15s",
                      }}
                    >
                      <span className="text-white text-xs font-medium truncate flex-1">{task.title}</span>
                      {isDone && <span className="text-white/80 text-[10px] ml-1 shrink-0">✓</span>}
                      {/* Resize handle */}
                      <div
                        className="absolute right-0 top-0 h-full w-3 cursor-col-resize flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.15)", borderRadius: "0 6px 6px 0" }}
                        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, task, "resize"); }}
                      >
                        <div className="w-0.5 h-3/5 bg-white/60 rounded-full" />
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-0 bg-popover border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none shadow-md">
                      {task.start_date} → {task.due_date}
                    </div>
                  </div>
                );
              })}

              {/* Today line label */}
              <div
                style={{ position: "absolute", top: 2, left: todayX + 2, zIndex: 5 }}
                className="text-[10px] text-primary font-bold"
              >
                Today
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No tasks state */}
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <CalendarDays className="w-10 h-10 opacity-30" />
          <p className="text-sm">No tasks yet. Add tasks with start &amp; due dates to see them here.</p>
        </div>
      )}
    </div>
  );
}