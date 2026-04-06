import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval, subDays, isAfter, parseISO } from "date-fns";

export default function BurndownChart({ tasks }) {
  const data = useMemo(() => {
    if (!tasks.length) return [];
    const now = new Date();
    const start = subDays(now, 13);
    const days = eachDayOfInterval({ start, end: now });

    const totalTasks = tasks.length;
    return days.map((day) => {
      const completedByDay = tasks.filter(
        (t) => t.column === "done" && t.updated_date && !isAfter(parseISO(t.updated_date.split("T")[0]), day)
      ).length;
      const dayStr = format(day, "MMM d");
      const ideal = Math.round(totalTasks - (totalTasks * ((days.indexOf(days.find(d => d.getTime() === day.getTime())) || 0) / (days.length - 1))));
      return {
        date: dayStr,
        remaining: totalTasks - completedByDay,
        ideal,
      };
    });
  }, [tasks]);

  if (!tasks.length) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No tasks yet</div>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="ideal"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            fill="none"
            strokeWidth={1.5}
            name="Ideal"
          />
          <Area
            type="monotone"
            dataKey="remaining"
            stroke="hsl(var(--chart-1))"
            fill="url(#burnGrad)"
            strokeWidth={2}
            name="Remaining"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}