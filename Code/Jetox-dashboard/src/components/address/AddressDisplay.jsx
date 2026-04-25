import { buildFullMultiline, buildTableSummary, EMPTY_ADDRESS } from "../../utils/addressFormat";

/**
 * Multi-line formatted address for detail views.
 */
export function AddressDisplay({ value, className = "" }) {
  const text = buildFullMultiline({ ...EMPTY_ADDRESS, ...value });
  if (!String(text).trim()) {
    return (
      <span className={`text-sm text-gray-400 dark:text-slate-500 ${className}`}>—</span>
    );
  }
  return (
    <div
      className={`text-sm text-gray-800 whitespace-pre-line leading-relaxed dark:text-slate-200 ${className}`}
    >
      {text}
    </div>
  );
}

/**
 * Single-line summary for tables; full formatted address in title tooltip.
 */
export function AddressTableCell({ value, className = "" }) {
  const merged = { ...EMPTY_ADDRESS, ...value };
  const summary = buildTableSummary(merged);
  const full = buildFullMultiline(merged);
  const showTitle = full && full !== summary.replace(/—/g, "").trim();
  return (
    <span
      title={showTitle ? full : undefined}
      className={`text-sm text-gray-800 truncate max-w-[14rem] inline-block align-middle dark:text-slate-200 ${className}`}
    >
      {summary}
    </span>
  );
}
