import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Layers, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  { name: "indigo", class: "bg-indigo-500" },
  { name: "emerald", class: "bg-emerald-500" },
  { name: "rose", class: "bg-rose-500" },
  { name: "amber", class: "bg-amber-500" },
  { name: "sky", class: "bg-sky-500" },
  { name: "violet", class: "bg-violet-500" },
];

const PRIORITY_COLORS = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const EMPTY_TASK = { title: "", column: "todo", priority: "medium", labels: [], description: "" };

export default function TemplateDialog({ open, onOpenChange, projectId, onApplied }) {
  const [view, setView] = useState("list"); // "list" | "create"
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("indigo");
  const [exampleTasks, setExampleTasks] = useState([{ ...EMPTY_TASK }]);

  useEffect(() => {
    if (open) loadTemplates();
  }, [open]);

  const loadTemplates = async () => {
    const t = await base44.entities.ProjectTemplate.list("-created_date", 50);
    setTemplates(t);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await base44.entities.ProjectTemplate.create({
      name: name.trim(),
      description: description.trim(),
      color,
      example_tasks: exampleTasks.filter(t => t.title.trim()),
    });
    toast.success("Template created!");
    setName(""); setDescription(""); setColor("indigo"); setExampleTasks([{ ...EMPTY_TASK }]);
    setLoading(false);
    setView("list");
    loadTemplates();
  };

  const handleApply = async (template) => {
    if (!projectId) return;
    setLoading(true);
    const tasksToCreate = (template.example_tasks || []).filter(t => t.title?.trim());
    for (let i = 0; i < tasksToCreate.length; i++) {
      await base44.entities.Task.create({
        ...tasksToCreate[i],
        project_id: projectId,
        position: i * 100,
      });
    }
    toast.success(`Applied "${template.name}" — ${tasksToCreate.length} tasks created`);
    setLoading(false);
    onOpenChange(false);
    if (onApplied) onApplied();
  };

  const handleDeleteTemplate = async (id) => {
    await base44.entities.ProjectTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (i, field, value) => {
    setExampleTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const addTask = () => setExampleTasks(prev => [...prev, { ...EMPTY_TASK }]);
  const removeTask = (i) => setExampleTasks(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view === "create" && (
              <button onClick={() => setView("list")} className="text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {view === "list" ? "Project Templates" : "Create Template"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {view === "list" && (
          <>
            <div className="space-y-2 py-2">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No templates yet. Create one to speed up project setup!</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition">
                    <div className={`w-8 h-8 rounded-lg ${COLORS.find(c => c.name === t.color)?.class || "bg-indigo-500"} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.example_tasks?.length || 0} tasks
                        {t.description && ` · ${t.description}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {projectId && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleApply(t)} disabled={loading}>
                          Apply
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTemplate(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setView("create")} className="w-full gap-1.5">
                <Plus className="w-4 h-4" /> Create New Template
              </Button>
            </DialogFooter>
          </>
        )}

        {view === "create" && (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label>Template Name</Label>
                <Input placeholder="e.g. Product Launch" value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="What is this template for?" value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5" rows={2} />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1.5">
                  {COLORS.map(c => (
                    <button key={c.name} onClick={() => setColor(c.name)}
                      className={`w-7 h-7 rounded-full ${c.class} transition-all ${color === c.name ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Example Tasks</Label>
                <div className="space-y-2">
                  {exampleTasks.map((task, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Task title"
                          value={task.title}
                          onChange={e => updateTask(i, "title", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <select
                            value={task.column}
                            onChange={e => updateTask(i, "column", e.target.value)}
                            className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                          <select
                            value={task.priority}
                            onChange={e => updateTask(i, "priority", e.target.value)}
                            className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeTask(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTask} className="w-full gap-1 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || loading}>
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}