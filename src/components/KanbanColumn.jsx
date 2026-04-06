import { Plus } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, tasks, provided, isDragOver, onAddTask, onEditTask }) {
  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
          <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`flex-1 space-y-2.5 rounded-xl p-2 min-h-[200px] transition-colors ${
          isDragOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-transparent"
        }`}
      >
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id} index={index}>
            {(prov, snap) => (
              <div
                ref={prov.innerRef}
                {...prov.draggableProps}
                {...prov.dragHandleProps}
              >
                <TaskCard task={task} isDragging={snap.isDragging} onClick={() => onEditTask(task)} />
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    </div>
  );
}