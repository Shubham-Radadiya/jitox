import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
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

  return (
    <div className="rounded-xl border border-light-border bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col gap-3 min-h-[240px] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-blue-500 bg-white text-blue-600 shadow-sm dark:border-blue-400 dark:bg-slate-800 dark:text-blue-300"
            aria-hidden
          >
            <Users className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight dark:text-slate-100">
              Customers
            </h3>
            <p
              className="text-xs text-slate-500 mt-0.5 truncate dark:text-slate-400"
              title={windowLabel}
            >
              {windowLabel}
            </p>
          </div>
        </div>
        {isLoading ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">Loading…</span>
        ) : isError ? (
          <span className="text-xs text-rose-600 dark:text-rose-400">Could not load</span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="text-left min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums mt-1 leading-none dark:text-slate-100">
            {isLoading ? "—" : total}
          </p>
        </div>
        <button
          type="button"
          onClick={() => go("active")}
          className="rounded-xl border border-transparent px-0 py-0 text-left transition hover:bg-emerald-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 cursor-pointer min-w-0 dark:hover:bg-emerald-950/30"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Active
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums mt-1 leading-none">
            {isLoading ? "—" : active}
          </p>
          {!isLoading && total > 0 ? (
            <p className="text-xs font-medium text-emerald-600 mt-1.5 tabular-nums">
              {activePct}%
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => go("inactive")}
          className="rounded-xl border border-transparent px-0 py-0 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer min-w-0 dark:hover:bg-slate-800/60"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Inactive
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums mt-1 leading-none dark:text-slate-100">
            {isLoading ? "—" : inactive}
          </p>
          {!isLoading && total > 0 ? (
            <p className="text-xs font-medium text-slate-400 mt-1.5 tabular-nums">
              {inactivePct}%
            </p>
          ) : null}
        </button>
      </div>

      {!isLoading && total > 0 ? (
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700"
          role="presentation"
        >
          <div
            className={`h-full bg-emerald-500 transition-all duration-500 ${
              activePct >= 99 ? "rounded-full" : "rounded-l-full"
            }`}
            style={{ width: `${Math.min(100, activePct)}%` }}
          />
        </div>
      ) : null}

      {!isLoading && !isError && total > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 mt-auto border-t border-slate-100 dark:border-slate-700">
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Active names
            </p>
            <ul
              className="max-h-[7.5rem] overflow-y-auto text-sm text-emerald-600 font-medium space-y-1.5 pr-1 leading-snug"
              aria-label="Active customers"
            >
              {(data?.activeNames?.length
                ? data.activeNames
                : []
              ).map((name) => (
                <li key={`a-${name}`} className="truncate" title={name}>
                  {name}
                </li>
              ))}
            </ul>
            {!data?.activeNames?.length ? (
              <p className="text-xs text-slate-400">None</p>
            ) : null}
          </div>
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Inactive names
            </p>
            <ul
              className="max-h-[7.5rem] overflow-y-auto text-sm text-slate-800 space-y-1.5 pr-1 leading-snug dark:text-slate-200"
              aria-label="Inactive customers"
            >
              {(data?.inactiveNames?.length
                ? data.inactiveNames
                : []
              ).map((name) => (
                <li key={`i-${name}`} className="truncate" title={name}>
                  {name}
                </li>
              ))}
            </ul>
            {!data?.inactiveNames?.length ? (
              <p className="text-xs text-slate-400">None</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
