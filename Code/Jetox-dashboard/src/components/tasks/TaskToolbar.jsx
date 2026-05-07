import { Search } from "lucide-react";

function selectClasses(active) {
  const base =
    "h-8 w-full min-w-0 rounded-md border py-0 pl-2.5 pr-7 text-xs outline-none transition sm:w-auto";
  if (active) {
    return `${base} border-slate-200/90 bg-white font-medium text-primary shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-900 dark:text-emerald-400 dark:focus:border-emerald-500/60 dark:focus:ring-emerald-500/25`;
  }
  return `${base} border-slate-200/90 bg-white font-normal text-slate-700 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-400/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/30`;
}

export default function TaskToolbar({
  search,
  onSearchChange,
  statusF,
  onStatusF,
  priorityF,
  onPriorityF,
  sort,
  onSort,
}) {
  const searchActive = search.trim().length > 0;
  const statusActive = statusF !== "all";
  const priorityActive = priorityF !== "all";
  const sortActive = sort !== "due";

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-1.5 shadow-sm sm:p-2 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        <div className="relative min-w-0 w-full max-w-sm shrink-0 lg:max-w-xs xl:max-w-sm">
          <Search
            className={`pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 stroke-[1.75] ${
              searchActive ? "text-primary dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
            }`}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title or description…"
            className={[
              "h-8 w-full rounded-md border py-0 pl-8 pr-2.5 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/25",
              searchActive
                ? "border-slate-200/90 bg-white font-medium text-primary placeholder:text-slate-400 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-emerald-400 dark:placeholder:text-slate-500"
                : "border-slate-200/90 bg-slate-50/50 font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900",
            ].join(" ")}
            aria-label="Search tasks"
          />
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap lg:shrink-0">
          <select
            className={`${selectClasses(statusActive)} sm:min-w-[120px]`}
            value={statusF}
            onChange={(e) => onStatusF(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            className={`${selectClasses(priorityActive)} sm:min-w-[118px]`}
            value={priorityF}
            onChange={(e) => onPriorityF(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className={`${selectClasses(sortActive)} sm:min-w-[128px]`}
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
}
