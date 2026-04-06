import { useState, useEffect, useMemo } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function TaskFilterBar({ tasks, onFiltered }) {
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get("q") || "");
  const [priority, setPriority] = useState(urlParams.get("priority") || "");
  const [label, setLabel] = useState(urlParams.get("label") || "");
  const [assignee, setAssignee] = useState(urlParams.get("assignee") || "");

  // Derive unique values from tasks
  const allLabels = useMemo(() => {
    const s = new Set();
    tasks.forEach((t) => t.labels?.forEach((l) => s.add(l)));
    return [...s].sort();
  }, [tasks]);

  const allAssignees = useMemo(() => {
    const s = new Set();
    tasks.forEach((t) => {
      if (t.assignee_name) s.add(t.assignee_name);
      else if (t.assignee) s.add(t.assignee);
    });
    return [...s].sort();
  }, [tasks]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    search ? params.set("q", search) : params.delete("q");
    priority ? params.set("priority", priority) : params.delete("priority");
    label ? params.set("label", label) : params.delete("label");
    assignee ? params.set("assignee", assignee) : params.delete("assignee");

    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [search, priority, label, assignee]);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }
    if (label) {
      filtered = filtered.filter((t) => t.labels?.includes(label));
    }
    if (assignee) {
      filtered = filtered.filter(
        (t) => t.assignee_name === assignee || t.assignee === assignee
      );
    }
    onFiltered(filtered);
  }, [search, priority, label, assignee, tasks]);

  const activeCount = [priority, label, assignee].filter(Boolean).length;

  const clearAll = () => {
    setSearch("");
    setPriority("");
    setLabel("");
    setAssignee("");
  };

  const hasFilters = search || priority || label || assignee;

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card/30 backdrop-blur shrink-0">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 bg-background/60"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 relative">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-bold">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-3" align="start">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allLabels.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All labels" />
                </SelectTrigger>
                <SelectContent>
                  {allLabels.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {allAssignees.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Assignee</label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  {allAssignees.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="w-full text-xs h-8">
              Clear all filters
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}