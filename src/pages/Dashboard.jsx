import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, FolderKanban, Clock, CheckCircle2, ListTodo, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewProjectDialog from "../components/NewProjectDialog";
import { useNavigate } from "react-router-dom";

const colorMap = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  rose: "from-rose-500 to-rose-600",
  amber: "from-amber-500 to-amber-600",
  sky: "from-sky-500 to-sky-600",
  violet: "from-violet-500 to-violet-600",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, p, t] = await Promise.all([
      base44.auth.me(),
      base44.entities.Project.filter({ status: "active" }, "-created_date"),
      base44.entities.Task.list("-created_date", 100),
    ]);
    setUser(u);
    setProjects(p);
    setTasks(t);
    setLoading(false);
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.column === "todo" || t.column === "backlog").length,
    inProgress: tasks.filter((t) => t.column === "in_progress" || t.column === "review").length,
    done: tasks.filter((t) => t.column === "done").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Tasks", value: stats.total, icon: ListTodo, color: "text-primary" },
            { label: "To Do", value: stats.todo, icon: Clock, color: "text-amber-500" },
            { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "text-blue-500" },
            { label: "Completed", value: stats.done, icon: CheckCircle2, color: "text-emerald-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <Button size="sm" onClick={() => setShowNewProject(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first project to get started with CollabBoard.</p>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const done = projectTasks.filter((t) => t.column === "done").length;
              const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[project.color] || colorMap.indigo} flex items-center justify-center`}>
                      <FolderKanban className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition">{project.title}</h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{projectTasks.length} tasks</span>
                    <span>{progress}% done</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onCreated={(p) => {
          setShowNewProject(false);
          navigate(`/project/${p.id}`);
        }}
      />
    </div>
  );
}