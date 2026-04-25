import { Dropdown } from "antd";
import {
  MoreHorizontal,
  CheckCircle2,
  Play,
  Trash2,
  ChevronDown,
  Calendar,
} from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";
import { formatTaskDue, taskTitle, taskEffectiveStatus } from "../../utils/taskUtils";

function AssigneeStack({ ids, userMap }) {
  if (!ids?.length) {
    return <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>;
  }
  return (
    <div className="flex -space-x-2">
      {ids.slice(0, 4).map((id) => (
        <span
          key={id}
          title={userMap[id] || id}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:ring-slate-600"
        >
          {(userMap[id] || "?").charAt(0).toUpperCase()}
        </span>
      ))}
      {ids.length > 4 ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-600">
          +{ids.length - 4}
        </span>
      ) : null}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export default function TaskListItem({
  task,
  userMap,
  admin,
  restrictToSelf,
  updatePending,
  onUpdateStatus,
  onDelete,
  highlighted = false,
}) {
  const id = String(task._id || task.id);
  const eff = taskEffectiveStatus(task);
  const overdueRow = eff === "overdue";
  const rawStatus = String(task.status || "pending").toLowerCase();
  const normalized =
    rawStatus === "todo" || rawStatus === "pending"
      ? "pending"
      : rawStatus === "in_progress"
        ? "in_progress"
        : rawStatus === "completed"
          ? "completed"
          : "pending";

  const statusMenu = {
    items: STATUS_OPTIONS.map((o) => ({
      key: o.value,
      label: o.label,
      disabled: updatePending,
      onClick: () => onUpdateStatus(id, o.value),
    })),
  };

  const moreItems = [
    {
      key: "start",
      icon: <Play size={14} className="text-blue-600" />,
      label: "Mark in progress",
      disabled: updatePending,
      onClick: () => onUpdateStatus(id, "in_progress"),
    },
    {
      key: "done",
      icon: <CheckCircle2 size={14} className="text-emerald-600" />,
      label: "Mark complete",
      disabled: updatePending || normalized === "completed",
      onClick: () => onUpdateStatus(id, "completed"),
    },
  ];
  if (admin && !restrictToSelf) {
    moreItems.push({ type: "divider", key: "div-actions" });
    moreItems.push({
      key: "del",
      danger: true,
      icon: <Trash2 size={14} />,
      label: "Delete task",
      onClick: () => onDelete(id),
    });
  }

  const surfaceRing = highlighted
    ? "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-950 border-slate-200/80 dark:border-slate-700"
    : overdueRow
      ? "border-red-200/80 ring-1 ring-red-100/60 dark:border-red-900/50 dark:ring-red-950/40"
      : "border-slate-200/80 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:hover:border-slate-600";

  return (
    <article
      id={`task-card-${id}`}
      className={[
        "group rounded-[14px] border bg-white p-4 shadow-sm transition-all duration-200 sm:p-5 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]",
        surfaceRing,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {taskTitle(task)}
            </h3>
            {task.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {task.description}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">No description</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown menu={statusMenu} trigger={["click"]} placement="bottomLeft">
              <button
                type="button"
                title="Change status"
                className="inline-flex items-center gap-1 rounded-lg border border-transparent bg-slate-50/80 px-1 py-0.5 text-left transition hover:border-slate-200 hover:bg-white dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                <TaskStatusBadge task={task} />
                <ChevronDown
                  size={14}
                  className="text-slate-400 opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
              </button>
            </Dropdown>
            <TaskPriorityBadge priority={task.priority} />
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Calendar size={14} className="text-slate-400" aria-hidden />
              <span className="tabular-nums">{formatTaskDue(task)}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:border-t-0 sm:pt-0 lg:flex-col lg:items-end lg:gap-3 xl:flex-row xl:items-center dark:border-slate-700">
          <AssigneeStack ids={task._ids} userMap={userMap} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {normalized !== "completed" ? (
              <button
                type="button"
                title="Mark complete"
                disabled={updatePending}
                onClick={() => onUpdateStatus(id, "completed")}
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:opacity-95 disabled:opacity-50"
              >
                <CheckCircle2 size={16} strokeWidth={2} />
                Mark complete
              </button>
            ) : null}
            <Dropdown menu={{ items: moreItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                title="More actions"
                aria-label="More actions"
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-200/90 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              >
                <MoreHorizontal size={18} strokeWidth={1.75} />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </article>
  );
}
