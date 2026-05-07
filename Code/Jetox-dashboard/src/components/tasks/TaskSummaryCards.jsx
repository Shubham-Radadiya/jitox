import {
  LayoutList,
  CheckCircle2,
  Activity,
  AlertCircle,
  TrendingUp,
  Minus,
} from "lucide-react";

export default function TaskSummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total",
      value: summary.total,
      icon: LayoutList,
      trend: "neutral",
      trendClass: "text-slate-300 dark:text-slate-500",
      border: "border-slate-200/80 dark:border-slate-600",
      bg: "bg-white dark:bg-slate-900",
      iconWrap: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      trend: "up",
      trendClass: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200/60 dark:border-emerald-800/50",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/35",
      iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      label: "Active",
      value: summary.pending,
      icon: Activity,
      trend: "neutral",
      trendClass: "text-slate-300 dark:text-slate-500",
      border: "border-blue-200/60 dark:border-blue-800/50",
      bg: "bg-blue-50/40 dark:bg-blue-950/30",
      iconWrap: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },
    {
      label: "Overdue",
      value: summary.overdue,
      icon: AlertCircle,
      trend: summary.overdue > 0 ? "up" : "neutral",
      trendClass: summary.overdue > 0 ? "text-red-500 dark:text-red-400" : "text-slate-300 dark:text-slate-500",
      border: "border-red-200/60 dark:border-red-900/40",
      bg: "bg-red-50/40 dark:bg-red-950/25",
      iconWrap: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`rounded-xl border px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] ${c.border} ${c.bg}`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconWrap}`}
              >
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold tabular-nums leading-none text-slate-900 sm:text-xl dark:text-slate-100">
                    {c.value}
                  </span>
                  <span className="shrink-0" aria-hidden>
                    {c.trend === "up" ? (
                      <TrendingUp className={c.trendClass} size={14} strokeWidth={2} />
                    ) : (
                      <Minus size={14} className={c.trendClass} strokeWidth={2} />
                    )}
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {c.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
