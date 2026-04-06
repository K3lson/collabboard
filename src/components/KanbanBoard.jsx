import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import { toast } from "sonner";

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-slate-400" },
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
  { id: "review", title: "Review", color: "bg-violet-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export default function KanbanBoard({ projectId, filteredTasks }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    loadTasks();
    const unsub = base44.entities.Task.subscribe(() => loadTasks());
    return unsub;
  }, [projectId]);

  const loadTasks = async () => {
    const t = await base44.entities.Task.filter({ project_id: projectId }, "position");
    setTasks(t);
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const newColumn = destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    // Dependency check: block moving to in_progress if deps not done
    if (newColumn === "in_progress" && task?.depends_on?.length) {
      const unmetDeps = task.depends_on.filter(depId => {
        const dep = tasks.find(t => t.id === depId);
        return dep && dep.column !== "done";
      });
      if (unmetDeps.length > 0) {
        const depTitles = unmetDeps.map(depId => tasks.find(t => t.id === depId)?.title || depId).join(", ");
        toast.error(`Cannot start: unfinished dependencies — ${depTitles}`);
        return;
      }
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, column: newColumn, position: destination.index } : t
      )
    );

    await base44.entities.Task.update(taskId, {
      column: newColumn,
      position: destination.index,
    });
  };

  const displayTasks = filteredTasks || tasks;
  const getColumnTasks = (columnId) =>
    displayTasks.filter((t) => t.column === columnId).sort((a, b) => (a.position || 0) - (b.position || 0));

  const handleAddTask = (columnId) => {
    setNewTaskColumn(columnId);
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setNewTaskColumn(null);
    setShowModal(true);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto p-6 pb-4">
          {COLUMNS.map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <KanbanColumn
                  column={col}
                  tasks={getColumnTasks(col.id)}
                  provided={provided}
                  isDragOver={snapshot.isDraggingOver}
                  onAddTask={() => handleAddTask(col.id)}
                  onEditTask={handleEditTask}
                />
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        open={showModal}
        onOpenChange={setShowModal}
        task={selectedTask}
        projectId={projectId}
        defaultColumn={newTaskColumn}
        allTasks={tasks}
        onSaved={() => {
          setShowModal(false);
          loadTasks();
        }}
        onDeleted={() => {
          setShowModal(false);
          loadTasks();
        }}
      />
    </>
  );
}