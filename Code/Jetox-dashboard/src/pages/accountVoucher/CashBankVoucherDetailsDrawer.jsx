import React from "react";
import { ArrowRight, ExternalLink, X } from "lucide-react";

function TransferAccount({ label, value }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/60">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

/**
 * Read-only side panel for cash / bank transfer vouchers.
 */
const CashBankVoucherDetailsDrawer = ({ open, onClose, data }) => {
  if (!open || !data) return null;

  const {
    kindLabel,
    voucherNo,
    dateLabel,
    debitLabel,
    creditLabel,
    amountLabel,
    remarks,
    attachmentUrl,
    attachmentName,
  } = data;

  return (
    <div className="fixed inset-0 z-1000 flex justify-end">
      <div
        className="absolute inset-0 bg-black/25 transition-opacity dark:bg-black/65"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-linear-to-r from-slate-50 to-white px-4 py-3.5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary dark:text-emerald-400">
              {kindLabel}
            </p>
            <div className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {voucherNo}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Date
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {dateLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Amount
                </div>
                <div className="mt-1 text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {amountLabel}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Transfer
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TransferAccount label="Debit from" value={debitLabel} />
              <div className="flex shrink-0 justify-center text-primary dark:text-emerald-400">
                <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
              </div>
              <TransferAccount label="Credit to" value={creditLabel} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Narration
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {remarks}
            </p>
          </section>

          {attachmentUrl ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Attachment
              </h3>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline dark:text-emerald-400"
              >
                <ExternalLink size={15} strokeWidth={2} aria-hidden />
                {attachmentName || "View attachment"}
              </a>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

export default CashBankVoucherDetailsDrawer;
