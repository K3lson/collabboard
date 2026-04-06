import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BurndownChart from "./BurndownChart";
import StatusPieChart from "./StatusPieChart";
import CompletionBarChart from "./CompletionBarChart";
import { TrendingDown, PieChart, BarChart3 } from "lucide-react";

export default function AnalyticsTab({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      const t = await base44.entities.Task.filter({ project_id: projectId });
      setTasks(t);
      setLoading(false);
    };
    load();
    const unsub = base44.entities.Task.subscribe(() => load());
    return unsub;
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const done = tasks.filter((t) => t.column === "done").length;
  const inProgress = tasks.filter((t) => t.column === "in_progress").length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={tasks.length} />
        <StatCard label="Completed" value={done} accent="text-emerald-600" />
        <StatCard label="In Progress" value={inProgress} accent="text-amber-600" />
        <StatCard label="Completion Rate" value={tasks.length ? Math.round((done / tasks.length) * 100) + "%" : "0%"} accent="text-blue-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard icon={TrendingDown} title="Burndown Chart">
          <BurndownChart tasks={tasks} />
        </ChartCard>
        <ChartCard icon={PieChart} title="Tasks by Status">
          <StatusPieChart tasks={tasks} />
        </ChartCard>
      </div>
      <ChartCard icon={BarChart3} title="Completion Rate by Member">
        <CompletionBarChart tasks={tasks} />
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ChartCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}