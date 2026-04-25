import { ListChecks, Plus } from "lucide-react";
import TaskListItem from "./TaskListItem";

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-[14px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-2/3 rounded-lg bg-slate-200/80" />
          <div className="h-4 w-full max-w-md rounded bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-7 w-24 rounded-full bg-slate-100" />
            <div className="h-7 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 rounded-full bg-slate-100" />
          <div className="h-10 w-28 rounded-[10px] bg-slate-200/60" />
        </div>
      </div>
    </div>
  );
}

export default function TaskList({
  tasks,
  isLoading,
  userMap,
  admin,
  restrictToSelf,
  updatePending,
  onUpdateStatus,
  onDelete,
  onCreateClick,
  canCreate,
  highlightTaskId = "",
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900/50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
          <ListChecks className="text-primary" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">No tasks yet</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {canCreate
            ? "Create a task to assign work to your team, or adjust filters to see existing items."
            : "You have no tasks matching these filters. Try adjusting status, priority, or search."}
        </p>
        {canCreate ? (
          <button
            type="button"
            onClick={onCreateClick}
            className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:opacity-95"
          >
            <Plus size={18} strokeWidth={2} />
            Create task
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {tasks.map((t) => {
        const tid = String(t._id || t.id);
        return (
          <li key={tid}>
            <TaskListItem
              task={t}
              userMap={userMap}
              admin={admin}
              restrictToSelf={restrictToSelf}
              updatePending={updatePending}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              highlighted={Boolean(highlightTaskId && tid === highlightTaskId)}
            />
          </li>
        );
      })}
    </ul>
  );
}
