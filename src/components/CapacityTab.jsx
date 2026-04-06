import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { addDays, startOfWeek, format, parseISO, isWithinInterval, isValid } from "date-fns";
import { AlertTriangle, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const WEEKS = 6;
const OVERLOAD_THRESHOLD = 5; // tasks/week = overloaded

function getWeekStarts() {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: WEEKS }, (_, i) => addDays(now, i * 7));
}

export default function CapacityTab({ tasks, onTaskUpdated }) {
  const [dragging, setDragging] = useState(null); // { taskId, fromMember }
  const [dragOver, setDragOver] = useState(null);

  const weekStarts = useMemo(() => getWeekStarts(), []);

  // Gather all members from tasks
  const members = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.assignee) {
        map[t.assignee] = t.assignee_name || t.assignee;
      }
    });
    const unassigned = tasks.some(t => !t.assignee);
    if (unassigned) map["__unassigned__"] = "Unassigned";
    return map;
  }, [tasks]);

  // Build grid: member -> week -> tasks[]
  const grid = useMemo(() => {
    const g = {};
    Object.keys(members).forEach(email => { g[email] = Array.from({ length: WEEKS }, () => []); });
    tasks.forEach(task => {
      const member = task.assignee || "__unassigned__";
      const dateStr = task.due_date || task.start_date;
      if (!dateStr || !isValid(parseISO(dateStr))) {
        // No date — put in first week bucket
        if (g[member]) g[member][0].push(task);
        return;
      }
      const d = parseISO(dateStr);
      weekStarts.forEach((ws, i) => {
        const we = addDays(ws, 6);
        if (isWithinInterval(d, { start: ws, end: we })) {
          if (g[member]) g[member][i].push(task);
        }
      });
    });
    return g;
  }, [tasks, members, weekStarts]);

  const handleDragStart = (task, fromMember) => {
    setDragging({ taskId: task.id, fromMember });
  };

  const handleDrop = async (toMember) => {
    if (!dragging || dragging.fromMember === toMember) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const task = tasks.find(t => t.id === dragging.taskId);
    if (!task) return;
    const newAssignee = toMember === "__unassigned__" ? "" : toMember;
    const newName = toMember === "__unassigned__" ? "" : (members[toMember] || toMember);
    await base44.entities.Task.update(task.id, { assignee: newAssignee, assignee_name: newName });
    toast.success(`Task moved to ${newName || "Unassigned"}`);
    setDragging(null);
    setDragOver(null);
    if (onTaskUpdated) onTaskUpdated();
  };

  const maxTasks = Math.max(1, ...Object.values(grid).flatMap(weeks => weeks.map(w => w.length)));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Team Capacity</h2>
          <span className="text-xs text-muted-foreground ml-1">Drag tasks between members to rebalance</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" /> ≥{OVERLOAD_THRESHOLD} tasks/week = overloaded
          </div>
        </div>

        {Object.keys(members).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No assigned tasks yet.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header: weeks */}
            <div className="grid border-b border-border bg-muted/50" style={{ gridTemplateColumns: `180px repeat(${WEEKS}, 1fr)` }}>
              <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Member</div>
              {weekStarts.map((ws, i) => (
                <div key={i} className="px-2 py-2.5 text-xs font-semibold text-muted-foreground text-center border-l border-border/60">
                  {format(ws, "MMM d")}
                </div>
              ))}
            </div>

            {/* Rows: one per member */}
            {Object.entries(members).map(([email, name]) => (
              <div
                key={email}
                className={`grid border-b border-border/50 last:border-0 transition ${dragOver === email ? "bg-primary/5" : ""}`}
                style={{ gridTemplateColumns: `180px repeat(${WEEKS}, 1fr)` }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(email); }}
                onDrop={() => handleDrop(email)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Member name */}
                <div className="px-4 py-3 flex items-center gap-2 border-r border-border/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium truncate">{name}</span>
                </div>

                {/* Week cells */}
                {weekStarts.map((_, wi) => {
                  const cellTasks = grid[email]?.[wi] || [];
                  const isOver = cellTasks.length >= OVERLOAD_THRESHOLD;
                  const barH = Math.round((cellTasks.length / maxTasks) * 60);
                  return (
                    <div key={wi} className="px-2 py-2 border-l border-border/40 flex flex-col items-center justify-end gap-1 min-h-[80px]">
                      {/* Bar */}
                      <div
                        className={`w-8 rounded-t transition-all ${isOver ? "bg-amber-400" : "bg-primary/70"}`}
                        style={{ height: Math.max(4, barH) }}
                        title={`${cellTasks.length} tasks`}
                      />
                      <span className={`text-[10px] font-semibold ${isOver ? "text-amber-600" : "text-muted-foreground"}`}>
                        {cellTasks.length > 0 ? cellTasks.length : ""}
                        {isOver && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5" />}
                      </span>
                      {/* Draggable task chips */}
                      <div className="w-full space-y-0.5 mt-1">
                        {cellTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task, email)}
                            className="text-[9px] truncate bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing hover:bg-primary/20 transition"
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {cellTasks.length > 3 && (
                          <div className="text-[9px] text-muted-foreground px-1.5">+{cellTasks.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}