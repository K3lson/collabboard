import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PresenceBar({ projectId }) {
  const [presences, setPresences] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const heartbeat = async () => {
      const user = await base44.auth.me();
      const existing = await base44.entities.Presence.filter({
        user_email: user.email,
        project_id: projectId,
      });
      const now = new Date().toISOString();
      if (existing.length > 0) {
        await base44.entities.Presence.update(existing[0].id, {
          last_seen: now,
          status: "online",
        });
      } else {
        await base44.entities.Presence.create({
          user_email: user.email,
          user_name: user.full_name || user.email,
          project_id: projectId,
          last_seen: now,
          status: "online",
        });
      }
    };

    const loadPresences = async () => {
      const all = await base44.entities.Presence.filter({ project_id: projectId });
      const now = Date.now();
      const active = all.filter(
        (p) => now - new Date(p.last_seen).getTime() < 120000
      );
      setPresences(active);
    };

    heartbeat();
    loadPresences();
    intervalRef.current = setInterval(() => {
      heartbeat();
      loadPresences();
    }, 30000);

    const unsub = base44.entities.Presence.subscribe(() => loadPresences());

    return () => {
      clearInterval(intervalRef.current);
      unsub();
    };
  }, [projectId]);

  if (presences.length === 0) return null;

  const colors = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-violet-500",
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground mr-2.5 font-medium">Online</span>
        <div className="flex -space-x-2">
          {presences.slice(0, 8).map((p, i) => (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <div
                  className={`w-7 h-7 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-white text-xs font-semibold ring-2 ring-background relative`}
                >
                  {p.user_name?.charAt(0)?.toUpperCase() || "?"}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{p.user_name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {presences.length > 8 && (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-2 ring-background">
              +{presences.length - 8}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}