import React from "react";

/**
 * Groups related fields in modals/pages with a consistent section chrome.
 * Use with `ds-form-grid-2` / `ds-form-grid-3` on child grids.
 * @param {boolean} [dense] — Tighter padding and gaps (modals, dense forms).
 * @param {boolean} [book] — Ledger-style sections: minimal padding, bold small titles (Create Account).
 */
export function FormSection({
  title,
  hint,
  children,
  className = "",
  dense = false,
  book = false,
}) {
  const pad = book ? "p-2 sm:p-2.5" : dense ? "p-3" : "p-3 sm:p-3.5";
  const head = dense ? "mb-2 pb-1.5" : "mb-2 pb-1.5";
  const titleCls = book
    ? "text-sm font-extrabold leading-snug tracking-wide text-slate-900 dark:text-slate-50"
    : dense
      ? "text-[13px] font-bold leading-snug text-slate-900 dark:text-slate-100"
      : "text-base font-bold leading-tight text-slate-900 dark:text-slate-100";
  const stack = book ? "space-y-1.5" : dense ? "space-y-2" : "space-y-2.5";

  const headerShell = book
    ? "mb-2 flex items-center gap-2 rounded-md border border-slate-200/95 bg-slate-50 px-2.5 py-2 dark:border-slate-600 dark:bg-slate-800/90"
    : `${head} border-b border-light-border dark:border-slate-700`;

  return (
    <section
      className={`rounded-lg border border-light-border/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${pad} ${className}`}
    >
      {title ? (
        <div className={headerShell}>
          {book ? (
            <span
              className="h-5 w-1 shrink-0 rounded-full bg-primary dark:bg-emerald-500"
              aria-hidden
            />
          ) : null}
          <h3 className={book ? `${titleCls} min-w-0 flex-1` : titleCls}>
            {title}
            {hint ? (
              <span className="ml-1.5 text-[11px] font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
                {hint}
              </span>
            ) : null}
          </h3>
        </div>
      ) : null}
      <div className={stack}>{children}</div>
    </section>
  );
}

/** Single-field inline validation (compact, below input). */
export function FieldError({ message, id }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-xs text-red-600 leading-snug dark:text-red-400"
    >
      {message}
    </p>
  );
}
