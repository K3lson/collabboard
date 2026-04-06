import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Settings, Archive, ArrowLeft, BarChart3, Kanban, Activity, GanttChartSquare, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import KanbanBoard from "../components/KanbanBoard";
import PresenceBar from "../components/PresenceBar";
import AnalyticsTab from "../components/analytics/AnalyticsTab";
import TaskFilterBar from "../components/TaskFilterBar";
import ActivityStream from "../components/ActivityStream";
import GanttView from "../components/GanttView";
import TemplateDialog from "../components/TemplateDialog";

const colorMap = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  rose: "from-rose-500 to-rose-600",
  amber: "from-amber-500 to-amber-600",
  sky: "from-sky-500 to-sky-600",
  violet: "from-violet-500 to-violet-600",
};

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("board");
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadProject();
    loadTasks();
    const unsub1 = base44.entities.Project.subscribe(() => loadProject());
    const unsub2 = base44.entities.Task.subscribe(() => loadTasks());
    return () => { unsub1(); unsub2(); };
  }, [id]);

  const loadTasks = async () => {
    const t = await base44.entities.Task.filter({ project_id: id }, "position");
    setTasks(t);
  };

  const loadProject = async () => {
    const projects = await base44.entities.Project.filter({ id });
    if (projects.length > 0) {
      setProject(projects[0]);
    }
    setLoading(false);
  };

  const archiveProject = async () => {
    await base44.entities.Project.update(id, { status: "archived" });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorMap[project.color] || colorMap.indigo} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{project.title?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.title}</h1>
            {project.description && (
              <p className="text-xs text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PresenceBar projectId={id} />

          {/* Tab switcher */}
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab("board")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "board" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="w-3.5 h-3.5 inline-block mr-1" />
              Board
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "analytics" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 inline-block mr-1" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("gantt")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "gantt" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GanttChartSquare className="w-3.5 h-3.5 inline-block mr-1" />
              Gantt
            </button>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" title="Activity" onClick={() => setShowActivity(!showActivity)}>
            <Activity className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Templates" onClick={() => setShowTemplates(true)}>
            <Layers className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={archiveProject} className="text-destructive">
                <Archive className="w-4 h-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {activeTab === "board" && (
        <>
          <TaskFilterBar tasks={tasks} onFiltered={setFilteredTasks} />
          <div className="flex-1 overflow-hidden">
            <KanbanBoard projectId={id} filteredTasks={filteredTasks} />
          </div>
        </>
      )}
      {activeTab === "analytics" && (
        <div className="flex-1 overflow-hidden">
          <AnalyticsTab projectId={id} />
        </div>
      )}
      {activeTab === "gantt" && (
        <div className="flex-1 overflow-hidden relative">
          <GanttView projectId={id} tasks={tasks} onTaskUpdated={loadTasks} />
        </div>
      )}

      {/* Activity Stream */}
      <ActivityStream projectId={id} open={showActivity} onClose={() => setShowActivity(false)} />
      <TemplateDialog open={showTemplates} onOpenChange={setShowTemplates} projectId={id} onApplied={loadTasks} />
    </div>
  );
}