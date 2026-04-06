import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  backlog: "hsl(var(--muted-foreground))",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  review: "#8b5cf6",
  done: "#10b981",
};

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export default function StatusPieChart({ tasks }) {
  const data = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      counts[t.column] = (counts[t.column] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#94a3b8",
    }));
  }, [tasks]);

  if (!tasks.length) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No tasks yet</div>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}