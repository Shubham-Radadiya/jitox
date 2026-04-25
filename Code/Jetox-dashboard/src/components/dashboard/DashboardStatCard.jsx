import { ArrowDown, ArrowUp } from "lucide-react";

/**
 * Soft, minimal stat tiles for the dashboard overview grid.
 * Variants map to semantic meaning (positive / negative / warning / neutral).
 */
const VARIANT = {
  positive: {
    shell:
      "bg-white ring-1 ring-emerald-100/80 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:ring-emerald-900/50 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]",
    iconShell:
      "rounded-2xl bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-300",
    amount: "text-emerald-950 dark:text-emerald-100",
  },
  negative: {
    shell:
      "bg-white ring-1 ring-rose-100/80 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:ring-rose-900/45 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]",
    iconShell:
      "rounded-2xl bg-rose-100/90 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    amount: "text-rose-950 dark:text-rose-100",
  },
  warning: {
    shell:
      "bg-white ring-1 ring-orange-100/80 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:ring-orange-900/40 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]",
    iconShell:
      "rounded-2xl bg-orange-100/90 text-orange-700 dark:bg-orange-950/45 dark:text-orange-300",
    amount: "text-orange-950 dark:text-orange-100",
  },
  neutral: {
    shell:
      "bg-white ring-1 ring-sky-100/70 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:ring-sky-800/45 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]",
    iconShell:
      "rounded-2xl bg-sky-100/90 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    amount: "text-slate-900 dark:text-slate-100",
  },
  neutralInk: {
    shell:
      "bg-white ring-1 ring-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:ring-slate-600 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.55)]",
    iconShell:
      "rounded-2xl bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    amount: "text-slate-950 dark:text-slate-100",
  },
};

const TREND_ICON = {
  up: ArrowUp,
  down: ArrowDown,
};

const TREND_CLASS = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
};

export function DashboardStatCard({
  label,
  value,
  loading,
  icon: Icon,
  variant = "neutral",
  trend,
  onActivate,
  infoSlot,
  className = "",
}) {
  const v = VARIANT[variant] || VARIANT.neutral;
  const TrendIcon = trend?.direction ? TREND_ICON[trend.direction] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate?.();
        }
      }}
      className={`group relative flex h-full min-h-[7rem] cursor-pointer flex-row rounded-2xl px-5 py-4 text-left transition-all duration-200 ease-in-out hover:-translate-y-[3px] ${v.shell} ${className}`.trim()}
    >
      {infoSlot}
      <div className="flex min-h-0 flex-1 items-stretch gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center self-center transition-transform duration-200 ease-in-out group-hover:scale-[1.03] ${v.iconShell}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 pr-6">
          <div className="text-xs font-semibold uppercase leading-snug tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
            <span
              className={`min-w-0 truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${v.amount}`}
            >
              {loading ? "…" : value}
            </span>
            {TrendIcon && trend?.direction ? (
              <TrendIcon
                className={`h-4 w-4 shrink-0 ${TREND_CLASS[trend.direction]}`}
                strokeWidth={2.5}
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
