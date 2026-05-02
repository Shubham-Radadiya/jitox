import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, UserCheck, UserX, Users } from "lucide-react";
import { customersApi } from "../../services/api";

function pct(part, total) {
  if (!total || !Number.isFinite(part)) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Dashboard card: customer counts from sales quotations in the admin-configured window.
 * Clicks navigate to Account Master with ?status=active|inactive.
 */
export function CustomerSummaryCard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customerStatusSummary"],
    queryFn: async () => {
      const { data: d } = await customersApi.getStatusSummary();
      return d;
    },
    staleTime: 60_000,
  });

  const total = Number(data?.total) || 0;
  const active = Number(data?.active) || 0;
  const inactive = Number(data?.inactive) || 0;
  const tf = data?.timeframe;
  const windowLabel =
    tf?.unit === "days"
      ? `Last ${tf?.value ?? "—"} day${Number(tf?.value) === 1 ? "" : "s"} (billing)`
      : `Last ${tf?.value ?? "—"} month${Number(tf?.value) === 1 ? "" : "s"} (billing)`;

  const activePct = pct(active, total);
  const inactivePct = pct(inactive, total);

  const go = (status) => {
    navigate(`/dashboard/account?status=${encodeURIComponent(status)}`);
  };

  /** Inner KPI tiles: keep border + light shadow (same family as main jitox panel). */
  const metricTile =
    "flex min-h-[5.25rem] min-w-0 flex-col items-stretch justify-center rounded-xl border px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:px-3.5 dark:shadow-[0_2px_12px_rgba(0,0,0,0.38)]";

  const metricBtn =
    `group relative ${metricTile} text-left transition focus:outline-none focus-visible:ring-2 pr-9 sm:pr-10 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.45)]`;

  return (
    <div className="flex h-full min-h-[240px] flex-col gap-4 rounded-xl jitox-panel p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-5 dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100/90 text-sky-700 shadow-sm dark:bg-sky-950/55 dark:text-sky-300"
            aria-hidden
          >
            <Users className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customers
            </h3>
            <p
              className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400"
              title={windowLabel}
            >
              {windowLabel}
            </p>
          </div>
        </div>
        {isLoading ? (
          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
            Loading…
          </span>
        ) : isError ? (
          <span className="shrink-0 text-xs text-rose-600 dark:text-rose-400">
            Could not load
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div
          className={`${metricTile} border-light-border bg-slate-50/95 dark:border-slate-600 dark:bg-slate-800/60`}
          role="group"
          aria-label="Total customers"
        >
          <div className="flex min-w-0 flex-col items-start gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total
            </p>
            <p className="text-xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
              {isLoading ? "—" : total}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => go("active")}
          className={`${metricBtn} cursor-pointer border-emerald-200/80 bg-emerald-50/95 hover:bg-emerald-100/95 focus-visible:ring-emerald-400/40 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/55`}
        >
          <ChevronRight
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 opacity-40 transition group-hover:opacity-100 dark:text-emerald-400"
            strokeWidth={2}
            aria-hidden
          />
          <div className="flex min-w-0 flex-col items-start gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Active
            </span>
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-emerald-800 dark:text-emerald-200 sm:text-2xl">
              {isLoading ? "—" : active}
            </span>
            {!isLoading && total > 0 ? (
              <p className="mt-0.5 text-[11px] font-medium tabular-nums leading-tight text-emerald-600/90 dark:text-emerald-400/90">
                {activePct}% of total
              </p>
            ) : null}
          </div>
        </button>
        <button
          type="button"
          onClick={() => go("inactive")}
          className={`${metricBtn} cursor-pointer border-light-border bg-slate-50/95 hover:bg-slate-100/95 focus-visible:ring-slate-400/50 dark:border-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-800/90`}
        >
          <ChevronRight
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 opacity-40 transition group-hover:opacity-100 dark:text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
          <div className="flex min-w-0 flex-col items-start gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inactive
            </span>
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
              {isLoading ? "—" : inactive}
            </span>
            {!isLoading && total > 0 ? (
              <p className="mt-0.5 text-[11px] font-medium tabular-nums leading-tight text-slate-500 dark:text-slate-400">
                {inactivePct}% of total
              </p>
            ) : null}
          </div>
        </button>
      </div>

      {!isLoading && total > 0 ? (
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700"
          role="presentation"
          aria-hidden
        >
          <div
            className={`h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-500 dark:from-emerald-500 dark:to-emerald-400/90 ${
              activePct >= 99 ? "rounded-full" : "rounded-l-full"
            }`}
            style={{ width: `${Math.min(100, activePct)}%` }}
          />
        </div>
      ) : null}

      {!isLoading && !isError && total > 0 ? (
        <div className="mt-auto grid min-h-0 grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 sm:gap-5 dark:border-slate-700">
          <div className="flex min-h-0 min-w-0 flex-col gap-2">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
              Active names
            </p>
            <ul
              className="min-h-32 max-h-40 shrink-0 space-y-1.5 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-2.5 py-2 text-left text-sm font-medium leading-snug text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100"
              aria-label="Active customers"
            >
              {(data?.activeNames?.length ? data.activeNames : []).map(
                (name, i) => (
                  <li
                    key={`a-${i}-${name}`}
                    className="flex min-w-0 items-start gap-2"
                  >
                    <UserCheck
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate" title={name}>
                      {name}
                    </span>
                  </li>
                )
              )}
            </ul>
            {!data?.activeNames?.length ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                None
              </p>
            ) : null}
          </div>
          <div className="flex min-h-0 min-w-0 flex-col gap-2">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Inactive names
            </p>
            <ul
              className="min-h-32 max-h-40 shrink-0 space-y-1.5 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-slate-200/90 bg-slate-50/60 px-2.5 py-2 text-left text-sm leading-snug text-slate-800 dark:border-slate-600/60 dark:bg-slate-800/40 dark:text-slate-200"
              aria-label="Inactive customers"
            >
              {(data?.inactiveNames?.length
                ? data.inactiveNames
                : []
              ).map((name, i) => (
                <li
                  key={`i-${i}-${name}`}
                  className="flex min-w-0 items-start gap-2"
                >
                  <UserX
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate" title={name}>
                    {name}
                  </span>
                </li>
              ))}
            </ul>
            {!data?.inactiveNames?.length ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                None
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
