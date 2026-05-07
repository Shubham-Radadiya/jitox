import { ListChecks, Plus } from "lucide-react";
import TaskListItem from "./TaskListItem";

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:gap-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-4/5 rounded bg-slate-200/90 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="flex gap-2 pt-1">
            <div className="h-7 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 md:w-52 md:flex-col md:items-end md:border-l md:border-l-slate-200 md:border-t-0 md:pl-4 md:pt-0 dark:border-slate-800 dark:md:border-l-slate-700">
          <div className="flex gap-1">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-8 w-36 rounded-md border border-slate-200/80 bg-primary/80 dark:border-emerald-900/50 dark:bg-primary/70" />
            <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200/80 dark:bg-slate-800/70 dark:ring-slate-600">
          <ListChecks className="text-primary" size={24} strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          No tasks found
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {canCreate
            ? "Create a task to assign work to your team, or adjust filters to see existing items."
            : "You have no tasks matching these filters. Try adjusting status, priority, or search."}
        </p>
        {canCreate ? (
          <button
            type="button"
            onClick={onCreateClick}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <Plus size={16} strokeWidth={2.25} />
            Create task
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
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
