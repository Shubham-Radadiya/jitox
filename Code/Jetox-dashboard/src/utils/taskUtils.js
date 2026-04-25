import dayjs from "dayjs";

export const TASK_STATUS_LABEL = {
  pending: "Pending",
  todo: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export function taskEffectiveStatus(task) {
  if (task?.effectiveStatus) return String(task.effectiveStatus);
  const s = String(task?.status || "pending").toLowerCase();
  if (s === "todo") return "pending";
  return s;
}

export function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold leading-none";
  if (s === "completed")
    return `${base} bg-emerald-100/90 text-emerald-800 shadow-sm shadow-emerald-900/5 dark:bg-emerald-950/60 dark:text-emerald-200`;
  if (s === "in_progress")
    return `${base} bg-blue-100/90 text-blue-800 shadow-sm shadow-blue-900/5 dark:bg-blue-950/50 dark:text-blue-200`;
  if (s === "overdue")
    return `${base} bg-red-100/90 text-red-800 shadow-sm shadow-red-900/5 dark:bg-red-950/50 dark:text-red-200`;
  return `${base} bg-amber-100/90 text-amber-900 shadow-sm shadow-amber-900/5 dark:bg-amber-950/50 dark:text-amber-100`;
}

export function priorityBadgeClass(priority) {
  const p = String(priority || "medium").toLowerCase();
  const base =
    "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold capitalize tracking-wide";
  if (p === "high") return `${base} bg-rose-100/90 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200`;
  if (p === "low") return `${base} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
  return `${base} bg-amber-100/90 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100`;
}

export function formatTaskDue(task) {
  const d = task?.dueDate || task?.setDate;
  if (!d) return "—";
  return dayjs(d).format("DD MMM YYYY");
}

export function taskTitle(task) {
  return task?.title || task?.taskName || "—";
}
