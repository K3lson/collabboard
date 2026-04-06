import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Activity, Plus, ArrowRight, Trash2, Paperclip, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const actionConfig = {
  created_task: { icon: Plus, color: "bg-emerald-100 text-emerald-600", verb: "created" },
  updated_task: { icon: Edit, color: "bg-blue-100 text-blue-600", verb: "updated" },
  deleted_task: { icon: Trash2, color: "bg-red-100 text-red-600", verb: "deleted" },
  moved_task: { icon: ArrowRight, color: "bg-amber-100 text-amber-600", verb: "moved" },
  uploaded_file: { icon: Paperclip, color: "bg-violet-100 text-violet-600", verb: "uploaded a file to" },
};

export default function ActivityStream({ projectId, open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !open) return;
    const load = async () => {
      const items = await base44.entities.ActivityLog.filter(
        { project_id: projectId },
        "-created_date",
        50
      );
      setLogs(items);
      setLoading(false);
    };
    load();
    const unsub = base44.entities.ActivityLog.subscribe(() => load());
    return unsub;
  }, [projectId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Activity</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Stream */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No activity yet</p>
          ) : (
            logs.map((log) => <ActivityItem key={log.id} log={log} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ActivityItem({ log }) {
  const config = actionConfig[log.action] || actionConfig.updated_task;
  const Icon = config.icon;
  const timeAgo = log.created_date
    ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true })
    : "";

  return (
    <div className="flex gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition group">
      <div className={`w-7 h-7 rounded-lg ${config.color} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed">
          <span className="font-semibold text-foreground">{log.user_name || log.user_email || "Someone"}</span>
          {" "}{config.verb}{" "}
          <span className="font-medium text-foreground">{log.task_title || "a task"}</span>
          {log.details && (
            <span className="text-muted-foreground"> — {log.details}</span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}