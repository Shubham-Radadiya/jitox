import React from "react";
import { X } from "lucide-react";

function statusBadgeClass(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "completed")
    return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60";
  if (s === "in progress")
    return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60";
  if (s === "failed")
    return "bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800/60";
  if (s === "paused")
    return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60";
  if (s === "planned")
    return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-600/60";
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-600/60";
}

const sectionAccent = (
  <span
    className="h-3.5 w-0.5 shrink-0 rounded-full bg-primary dark:bg-emerald-500"
    aria-hidden
  />
);

/**
 * Read-only side panel for a manufacturing batch (all statuses).
 * Compact width and spacing; tables scroll when needed.
 */
export default function ManufacturingDetailsDrawer({ open, onClose, data }) {
  if (!open || !data) return null;

  const {
    batchCode,
    voucherNo,
    status,
    mfgDateLabel,
    expDateLabel,
    startedAtLabel,
    completedAtLabel,
    failedAtLabel,
    finishedProductName,
    qtyLine,
    rawMaterialLines,
    costLines,
    rawMaterialSubtotal,
    additionalSubtotal,
    grandTotalLabel,
    costPerUnitLabel,
    remarks,
    failureReason,
    failureRemarks,
    supervisorName,
  } = data;

  const showFailure = Boolean(failureReason && failureReason.trim());

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="relative flex h-full max-h-[100dvh] w-full max-w-full flex-col border-slate-200/90 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 sm:max-w-[min(100%,26rem)] sm:border-l sm:rounded-tl-lg md:max-w-[min(100%,30rem)] lg:max-w-[min(100%,34rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mfg-drawer-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200/90 bg-slate-50/90 px-2.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/90">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
              Manufacturing
            </p>
            <h2
              id="mfg-drawer-title"
              className="mt-0.5 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl dark:text-slate-50"
            >
              {batchCode}
            </h2>
            <p className="mt-0.5 break-all text-xs leading-snug text-slate-500 sm:text-sm dark:text-slate-400">
              {voucherNo}
            </p>
            <div className="mt-1.5">
              <span
                className={`inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
              >
                {status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain px-2.5 py-2.5 pb-4">
          <section className="rounded-lg border border-slate-200/90 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mb-1.5 flex items-center gap-1.5">
              {sectionAccent}
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Summary
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Qty
                </div>
                <div className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {qtyLine}
                </div>
              </div>
              <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Mfg date
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {mfgDateLabel}
                </div>
              </div>
              <div className="col-span-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Finished product
                </div>
                <div className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {finishedProductName}
                </div>
              </div>
              <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Expiry
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {expDateLabel}
                </div>
              </div>
              {startedAtLabel !== "—" ? (
                <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Started
                  </div>
                  <div className="mt-0.5 break-words text-xs font-semibold leading-snug text-slate-900 sm:text-sm dark:text-slate-100">
                    {startedAtLabel}
                  </div>
                </div>
              ) : null}
              {completedAtLabel !== "—" ? (
                <div className="col-span-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Completed
                  </div>
                  <div className="mt-0.5 break-words text-xs font-semibold leading-snug text-slate-900 sm:text-sm dark:text-slate-100">
                    {completedAtLabel}
                  </div>
                </div>
              ) : null}
              {failedAtLabel !== "—" ? (
                <div className="col-span-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Failed at
                  </div>
                  <div className="mt-0.5 break-words text-xs font-semibold leading-snug text-slate-900 sm:text-sm dark:text-slate-100">
                    {failedAtLabel}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {showFailure ? (
            <section className="rounded-lg border border-red-200/90 bg-red-50/90 p-2.5 dark:border-red-900/40 dark:bg-red-950/25">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-3 w-0.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400" aria-hidden />
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-red-800 dark:text-red-300">
                  Failure
                </h3>
              </div>
              <p className="text-sm font-semibold leading-snug text-red-900 dark:text-red-100">
                {failureReason}
              </p>
              {supervisorName ? (
                <p className="mt-1.5 text-xs text-red-900/90 sm:text-sm dark:text-red-200/90">
                  <span className="font-semibold">Supervisor:</span> {supervisorName}
                </p>
              ) : null}
              {failureRemarks ? (
                <p className="mt-1.5 whitespace-pre-wrap rounded border border-red-100/80 bg-white/70 p-2 text-xs leading-relaxed text-red-950 sm:text-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-100">
                  {failureRemarks}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200/90 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mb-1.5 flex items-center gap-1.5">
              {sectionAccent}
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Raw materials
              </h3>
            </div>
            {rawMaterialLines.length ? (
              <div
                className="overflow-x-auto rounded-md border border-slate-200/80 dark:border-slate-600/70"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="max-h-[min(42vh,14rem)] overflow-y-auto sm:max-h-[min(48vh,16rem)] md:max-h-none md:overflow-visible">
                  <table className="w-full min-w-[17rem] border-separate border-spacing-0 text-xs sm:text-sm md:min-w-0">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Material
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Req.
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Rate
                        </th>
                        <th
                          scope="col"
                          className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100 px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawMaterialLines.map((line, i) => (
                        <tr
                          key={`${line.productName}-${i}`}
                          className="odd:bg-white even:bg-slate-50/80 dark:odd:bg-slate-900/30 dark:even:bg-slate-800/25"
                        >
                          <td className="border-b border-slate-100 px-2 py-2 align-top text-xs font-medium leading-snug text-slate-900 sm:text-sm dark:border-slate-800 dark:text-slate-100">
                            {line.productName}
                          </td>
                          <td className="border-b border-slate-100 px-2 py-2 text-right align-top text-xs tabular-nums text-slate-700 sm:text-sm dark:border-slate-800 dark:text-slate-300">
                            {line.requiredDisplay}
                          </td>
                          <td className="border-b border-slate-100 px-2 py-2 text-right align-top text-xs tabular-nums text-slate-700 sm:text-sm dark:border-slate-800 dark:text-slate-300">
                            {line.rateDisplay}
                          </td>
                          <td className="border-b border-slate-100 px-2 py-2 text-right align-top text-xs font-semibold tabular-nums text-slate-900 sm:text-sm dark:border-slate-800 dark:text-slate-100">
                            {line.subtotalDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="rounded border border-dashed border-slate-200 py-3 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                No raw materials.
              </p>
            )}
          </section>

          {costLines.length ? (
            <section className="rounded-lg border border-slate-200/90 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900/80">
              <div className="mb-1.5 flex items-center gap-1.5">
                {sectionAccent}
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Additional costs
                </h3>
              </div>
              <div className="overflow-x-auto rounded-md border border-slate-200/80 dark:border-slate-600/70">
                <table className="w-full min-w-[14rem] border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
                      <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:text-slate-400">
                        Account
                      </th>
                      <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[11px] dark:text-slate-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {costLines.map((line, i) => (
                      <tr
                        key={`${line.label}-${i}`}
                        className="border-b border-slate-100 odd:bg-white even:bg-slate-50/80 last:border-b-0 dark:border-slate-800 dark:odd:bg-slate-900/20 dark:even:bg-slate-800/20"
                      >
                        <td className="px-2 py-2 text-xs text-slate-800 sm:text-sm dark:text-slate-200">
                          {line.label}
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-medium tabular-nums text-slate-900 sm:text-sm dark:text-slate-100">
                          {line.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200/90 bg-slate-50/90 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-1.5 flex items-center gap-1.5">
              {sectionAccent}
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Totals
              </h3>
            </div>
            <dl className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600 dark:text-slate-400">Raw materials</dt>
                <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                  {rawMaterialSubtotal}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-600 dark:text-slate-400">Additional</dt>
                <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                  {additionalSubtotal}
                </dd>
              </div>
              <div className="flex justify-between gap-2 rounded-md bg-primary/10 px-2 py-2 dark:bg-emerald-950/35">
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Grand total
                </dt>
                <dd className="text-sm font-bold tabular-nums text-primary sm:text-base dark:text-emerald-400">
                  {grandTotalLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2 pt-0.5">
                <dt className="text-slate-600 dark:text-slate-400">Cost / unit</dt>
                <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {costPerUnitLabel}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="mb-1 flex items-center gap-1.5">
              {sectionAccent}
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Remarks
              </h3>
            </div>
            <p className="whitespace-pre-wrap break-words rounded border border-slate-200/80 bg-white px-2.5 py-2 text-xs leading-relaxed text-slate-800 sm:text-sm dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
              {remarks}
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
