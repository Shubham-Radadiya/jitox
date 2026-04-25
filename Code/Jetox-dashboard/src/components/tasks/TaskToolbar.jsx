import { Search, ArrowDownAZ, CalendarDays } from "lucide-react";

const selectClass =
  "h-10 w-full min-w-0 rounded-[10px] border border-slate-200/90 bg-white pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-auto dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";

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
  return (
    <div className="rounded-[14px] border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title or description…"
            className="h-10 w-full rounded-[10px] border border-slate-200/90 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            aria-label="Search tasks"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CalendarDays size={16} strokeWidth={1.75} className="hidden sm:block" />
            <select
              className={`${selectClass} sm:min-w-[132px]`}
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
          </div>
          <select
            className={`${selectClass} sm:min-w-[128px]`}
            value={priorityF}
            onChange={(e) => onPriorityF(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ArrowDownAZ size={16} strokeWidth={1.75} className="hidden sm:block" />
            <select
              className={`${selectClass} sm:min-w-[148px]`}
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
    </div>
  );
}
