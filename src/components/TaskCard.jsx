import { Calendar, Paperclip, MessageSquare } from "lucide-react";
import TaskTimer from "./TaskTimer";
import { format } from "date-fns";

const priorityConfig = {
  low: { dot: "bg-slate-400", label: "Low" },
  medium: { dot: "bg-blue-500", label: "Medium" },
  high: { dot: "bg-amber-500", label: "High" },
  urgent: { dot: "bg-red-500", label: "Urgent" },
};

const labelColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];

export default function TaskCard({ task, isDragging, onClick, commentCount = 0 }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl p-3.5 border border-border cursor-pointer transition-all hover:shadow-md hover:border-primary/20 group ${
        isDragging ? "shadow-xl rotate-2 border-primary/30" : ""
      }`}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, i) => (
            <span
              key={i}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${labelColors[i % labelColors.length]}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-snug mb-1.5">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            <span className="text-[10px] text-muted-foreground font-medium">{priority.label}</span>
          </div>

          {/* Due date */}
          {task.due_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px]">{format(new Date(task.due_date), "MMM d")}</span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              <span className="text-[10px]">{task.attachments.length}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span className="text-[10px]">{commentCount}</span>
            </div>
          )}
          </div>

          <div className="flex items-center gap-1.5">
          <TaskTimer task={task} />
          {task.assignee_name && (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
              {task.assignee_name.charAt(0).toUpperCase()}
            </div>
          )}
          </div>
          </div>
          </div>
          );
          }