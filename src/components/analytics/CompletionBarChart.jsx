import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CompletionBarChart({ tasks }) {
  const data = useMemo(() => {
    const byMember = {};
    tasks.forEach((t) => {
      const name = t.assignee_name || t.assignee || "Unassigned";
      if (!byMember[name]) byMember[name] = { total: 0, done: 0 };
      byMember[name].total++;
      if (t.column === "done") byMember[name].done++;
    });
    return Object.entries(byMember)
      .map(([name, { total, done }]) => ({
        name: name.length > 12 ? name.slice(0, 12) + "…" : name,
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
        done,
        total,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [tasks]);

  if (!data.length) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No tasks yet</div>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(val, name, payload) => [
              `${val}% (${payload.payload.done}/${payload.payload.total})`,
              "Completion",
            ]}
          />
          <Bar dataKey="rate" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}