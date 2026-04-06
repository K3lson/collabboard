import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Link2 } from "lucide-react";
import FileUploader from "./FileUploader";

export default function TaskModal({ open, onOpenChange, task, projectId, defaultColumn, onSaved, onDeleted, allTasks = [] }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    column: "todo",
    priority: "medium",
    assignee: "",
    assignee_name: "",
    labels: [],
    due_date: "",
    start_date: "",
    depends_on: [],
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        column: task.column || "todo",
        priority: task.priority || "medium",
        assignee: task.assignee || "",
        assignee_name: task.assignee_name || "",
        labels: task.labels || [],
        due_date: task.due_date || "",
        start_date: task.start_date || "",
        depends_on: task.depends_on || [],
        attachments: task.attachments || [],
      });
    } else {
      setForm({
        title: "",
        description: "",
        column: defaultColumn || "todo",
        priority: "medium",
        assignee: "",
        assignee_name: "",
        labels: [],
        due_date: "",
        start_date: "",
        depends_on: [],
        attachments: [],
      });
    }
  }, [task, defaultColumn, open]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    if (task) {
      await base44.entities.Task.update(task.id, form);
    } else {
      await base44.entities.Task.create({ ...form, project_id: projectId, position: Date.now() });
    }
    setLoading(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!task) return;
    await base44.entities.Task.delete(task.id);
    onDeleted();
  };

  const addLabel = () => {
    if (labelInput.trim() && !form.labels.includes(labelInput.trim())) {
      setForm((f) => ({ ...f, labels: [...f.labels, labelInput.trim()] }));
      setLabelInput("");
    }
  };

  const removeLabel = (label) => {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Add details..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Column</Label>
              <Select value={form.column} onValueChange={(v) => setForm((f) => ({ ...f, column: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Assignee</Label>
            <Input
              placeholder="Email of assignee"
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Labels</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="Add label"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addLabel}>
                Add
              </Button>
            </div>
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.labels.map((label) => (
                  <span
                    key={label}
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full cursor-pointer hover:bg-destructive/10 hover:text-destructive transition"
                    onClick={() => removeLabel(label)}
                  >
                    {label} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {allTasks.filter(t => t.id !== task?.id).length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Link2 className="w-3.5 h-3.5" /> Dependencies
              </Label>
              <p className="text-xs text-muted-foreground mb-2">This task cannot move to In Progress until all dependencies are Done.</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {allTasks.filter(t => t.id !== task?.id).map(t => (
                  <label key={t.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.depends_on.includes(t.id)}
                      onChange={(e) => {
                        setForm(f => ({
                          ...f,
                          depends_on: e.target.checked
                            ? [...f.depends_on, t.id]
                            : f.depends_on.filter(id => id !== t.id)
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="text-xs truncate">{t.title}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{t.column}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Attachments</Label>
            <FileUploader
              files={form.attachments}
              onFilesChange={(files) => setForm((f) => ({ ...f, attachments: files }))}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {task && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || loading}>
              {loading ? "Saving..." : task ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}