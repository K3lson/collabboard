import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, FolderKanban, Plus, LogOut, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewProjectDialog from "./NewProjectDialog";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [unreadComments, setUnreadComments] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsub = base44.entities.Project.subscribe(() => loadProjects());
    return unsub;
  }, []);

  useEffect(() => {
    const loadUnread = async () => {
      const comments = await base44.entities.Comment.filter({}, "-created_date", 50);
      const seenTs = parseInt(localStorage.getItem("collab_comments_global_seen") || "0");
      setUnreadComments(comments.filter(c => new Date(c.created_date).getTime() > seenTs).length);
    };
    loadUnread();
    const unsub = base44.entities.Comment.subscribe(() => loadUnread());
    return unsub;
  }, []);

  const loadData = async () => {
    const [u, p] = await Promise.all([
      base44.auth.me(),
      base44.entities.Project.filter({ status: "active" }, "-created_date"),
    ]);
    setUser(u);
    setProjects(p);
  };

  const loadProjects = async () => {
    const p = await base44.entities.Project.filter({ status: "active" }, "-created_date");
    setProjects(p);
  };

  const colorMap = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside className="w-64 h-full flex flex-col bg-card border-r border-border shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">CollabBoard</span>
            </div>
            {unreadComments > 0 && (
              <div className="relative cursor-pointer" onClick={() => { localStorage.setItem("collab_comments_global_seen", Date.now().toString()); setUnreadComments(0); }}>
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadComments > 9 ? "9+" : unreadComments}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <div className="pt-4 pb-1.5 px-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Projects
              </span>
              <button
                onClick={() => setShowNewProject(true)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(`/project/${project.id}`)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${colorMap[project.color] || "bg-indigo-500"}`} />
              <span className="truncate">{project.title}</span>
            </Link>
          ))}

          {projects.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No projects yet. Create one to get started.
            </p>
          )}
        </nav>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted transition text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onCreated={(p) => {
          setShowNewProject(false);
          navigate(`/project/${p.id}`);
        }}
      />
    </>
  );
}