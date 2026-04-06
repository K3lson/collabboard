import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, User, ChevronDown, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

function fmtDuration(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

export default function TimeSheetView({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      const data = await base44.entities.TimeLog.filter({ project_id: projectId }, "-created_date", 200);
      setLogs(data);
      setLoading(false);
    };
    load();
    const unsub = base44.entities.TimeLog.subscribe(() => load());
    return unsub;
  }, [projectId]);

  // Group by task
  const byTask = logs.reduce((acc, log) => {
    const key = log.task_id;
    if (!acc[key]) acc[key] = { title: log.task_title || log.task_id, logs: [], total: 0 };
    acc[key].logs.push(log);
    acc[key].total += log.duration_minutes || 0;
    return acc;
  }, {});

  // Group by member for project total
  const byMember = logs.reduce((acc, log) => {
    const key = log.user_email;
    if (!acc[key]) acc[key] = { name: log.user_name || log.user_email, total: 0 };
    acc[key].total += log.duration_minutes || 0;
    return acc;
  }, {});

  const totalMins = logs.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Time</p>
            <p className="text-2xl font-bold text-foreground">{fmtDuration(totalMins)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Sessions</p>
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Tasks Tracked</p>
            <p className="text-2xl font-bold text-foreground">{Object.keys(byTask).length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Contributors</p>
            <p className="text-2xl font-bold text-foreground">{Object.keys(byMember).length}</p>
          </div>
        </div>

        {/* Per-member breakdown */}
        {Object.keys(byMember).length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Time by Member
            </h3>
            <div className="space-y-2">
              {Object.entries(byMember).sort((a, b) => b[1].total - a[1].total).map(([email, data]) => (
                <div key={email} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                    {data.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium">{data.name}</span>
                      <span className="text-xs text-muted-foreground">{fmtDuration(data.total)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (data.total / totalMins) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-task logs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Time Logs by Task</h3>
          </div>
          {Object.keys(byTask).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No time logged yet. Start a timer on any task!</p>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(byTask).sort((a, b) => b[1].total - a[1].total).map(([taskId, data]) => (
                <div key={taskId}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition text-left"
                    onClick={() => setExpanded(e => ({ ...e, [taskId]: !e[taskId] }))}
                  >
                    {expanded[taskId] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="flex-1 text-sm font-medium truncate">{data.title}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">{fmtDuration(data.total)}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{data.logs.length} session{data.logs.length !== 1 ? "s" : ""}</span>
                  </button>
                  {expanded[taskId] && (
                    <div className="bg-muted/20 border-t border-border/50">
                      {data.logs.map(log => (
                        <div key={log.id} className="flex items-center gap-3 px-8 py-2 text-xs text-muted-foreground border-b border-border/30 last:border-0">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {(log.user_name || log.user_email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{log.user_name || log.user_email}</span>
                          <span className="ml-auto">{log.start_time ? format(parseISO(log.start_time), "MMM d, h:mm a") : "—"}</span>
                          <span className="text-primary font-medium">{fmtDuration(log.duration_minutes)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}