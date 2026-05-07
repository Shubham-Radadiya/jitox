import { Dropdown } from "antd";
import { MoreHorizontal, CheckCircle2, Play, Trash2, ChevronDown, Calendar } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";
import { formatTaskDue, taskTitle, taskEffectiveStatus } from "../../utils/taskUtils";

function AssigneeStack({ ids, userMap }) {
  if (!ids?.length) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  }
  return (
    <div className="flex -space-x-2">
      {ids.slice(0, 4).map((id) => (
        <span
          key={id}
          title={userMap[id] || id}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-primary/18 to-primary/5 text-xs font-semibold text-primary ring-1 ring-slate-100 dark:border-slate-900 dark:ring-slate-700"
        >
          {(userMap[id] || "?").charAt(0).toUpperCase()}
        </span>
      ))}
      {ids.length > 4 ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-600 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300">
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

  const shell = [
    "group relative h-full rounded-md border bg-white transition-colors dark:bg-slate-900",
    overdueRow
      ? "border-red-200/90 bg-red-50/40 dark:border-red-900/55 dark:bg-red-950/25"
      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
    highlighted
      ? "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article id={`task-card-${id}`} className={shell}>
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between md:gap-5">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
            <span className="line-clamp-2">{taskTitle(task)}</span>
          </h3>
          {task.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">No description</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Dropdown menu={statusMenu} trigger={["click"]} placement="bottomLeft">
              <button
                type="button"
                title="Change status"
                className="inline-flex items-center gap-0.5 rounded-md border border-transparent bg-white px-0.5 py-0.5 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:bg-transparent dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
              >
                <TaskStatusBadge task={task} />
                <ChevronDown size={14} className="text-slate-400 opacity-70" aria-hidden />
              </button>
            </Dropdown>
            <TaskPriorityBadge priority={task.priority} />
            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              <Calendar size={13} className="shrink-0 opacity-70" aria-hidden />
              {formatTaskDue(task)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-3 md:w-52 md:border-t-0 md:border-l md:border-l-slate-200 md:pl-4 md:pt-0 dark:border-slate-800 dark:md:border-l-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2 md:flex-col md:items-end md:gap-2">
            <AssigneeStack ids={task._ids} userMap={userMap} />
            <div className="flex flex-col items-end gap-1.5">
              {normalized !== "completed" ? (
                <button
                  type="button"
                  title="Mark as complete"
                  disabled={updatePending}
                  onClick={() => onUpdateStatus(id, "completed")}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/90 bg-primary px-3 text-xs font-medium text-white shadow-none transition hover:bg-primary/90 disabled:opacity-50 [&>span:last-child]:inline-flex [&>span:last-child]:h-full [&>span:last-child]:items-center"
                >
                  <span
                    className="flex size-[14px] shrink-0 items-center justify-center text-white"
                    aria-hidden
                  >
                    <CheckCircle2 size={14} strokeWidth={2} className="block size-[14px]" />
                  </span>
                  <span className="leading-none">Mark as complete</span>
                </button>
              ) : null}
              <Dropdown menu={{ items: moreItems }} trigger={["click"]} placement="bottomRight">
                <button
                  type="button"
                  title="More actions"
                  aria-label="More actions"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <MoreHorizontal size={15} strokeWidth={1.75} />
                </button>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
