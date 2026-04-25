/**
 * Shared table layout tokens for DataTable, TableContent (hook), and page-specific tables.
 */

/** Visible grid on every cell (use with `border-collapse` on `<table>`). */
export const TABLE_CELL_BORDER =
  "border border-slate-200 dark:border-slate-600";

const RIGHT_ALIGN_KEYS = new Set([
  "Paid",
  "Due",
  "Total Amount",
  "Amount",
  "Amount (₹)",
  "Price",
  "Total",
  "Balance",
  "Qty",
  "Quantity",
  "Rate",
  "Subtotal",
  "Credit",
  "Debit",
  "Debit Amount",
  "Credit Amount",
  "Credit (₹)",
  "Debit (₹)",
  "Debit (Outflow)",
  "Credit (Inflow)",
  "Debit From",
  "Credit (Outflow)",
  "Order Qty",
  "Re. Qty",
  "Returned QTY",
  "Rate per Ltr",
  "MRP Per Unit",
  "Opening Balance",
  "Closing Balance",
  "Grand Total",
  "Tax",
  "Discount",
  "EMI",
  "Value",
]);

const CENTER_ALIGN_KEYS = new Set([
  "Payment Status",
  "Order Status",
  "Status",
  "Actions",
  "Action",
  "Select",
]);

function columnKeyIsNumericAlign(columnKey) {
  if (!columnKey) return false;
  if (RIGHT_ALIGN_KEYS.has(columnKey)) return true;
  const k = String(columnKey);
  if (k.includes("(₹)")) return true;
  return false;
}

/**
 * @param {string} columnKey
 * @returns {string} Tailwind text-align + optional tabular nums
 */
export function getTableCellAlignClass(columnKey) {
  if (!columnKey) return "text-left";
  if (CENTER_ALIGN_KEYS.has(columnKey)) return "text-center";
  if (columnKeyIsNumericAlign(columnKey)) return "text-right tabular-nums";
  return "text-left";
}

/** Text align for TruncatedText / flex children */
export function getCellTextAlign(columnKey) {
  if (!columnKey) return "left";
  if (CENTER_ALIGN_KEYS.has(columnKey)) return "center";
  if (columnKeyIsNumericAlign(columnKey)) return "right";
  return "left";
}

const TABLE_FOOTER_TD_BASE_DEFAULT =
  `px-3 py-2.5 align-middle ${TABLE_CELL_BORDER} bg-slate-50 text-sm font-semibold text-gray-900 dark:bg-slate-800/80 dark:text-slate-100`;

const TABLE_FOOTER_TD_BASE_HEAD =
  `px-3 py-2.5 align-middle ${TABLE_CELL_BORDER} bg-slate-50 text-sm font-semibold text-dark dark:bg-slate-800/80 dark:text-slate-100`;

/**
 * Consistent `<tfoot>` cell styling; alignment follows {@link getTableCellAlignClass}.
 * @param {string} columnKey
 * @param {{ extra?: string, variant?: "default"|"head", alignClass?: string }} [opts]
 */
export function tableFooterTdClasses(columnKey, opts = {}) {
  const { extra = "", variant = "default", alignClass } = opts;
  const base =
    variant === "head" ? TABLE_FOOTER_TD_BASE_HEAD : TABLE_FOOTER_TD_BASE_DEFAULT;
  const align = alignClass ?? getTableCellAlignClass(columnKey);
  return [base, align, extra].filter(Boolean).join(" ");
}

/**
 * Order / dashboard orders: column hints + responsive hiding; table may scroll horizontally.
 * Hidden columns use display:none below breakpoint; table-layout:fixed shares remaining space.
 */
export const ORDER_TABLE_COL = {
  Date: {
    /* No % width on <th>: percentages that sum to 100% + a fixed Actions column
       fight under table-fixed and the last column is often computed too narrow. */
    th: "min-w-[5.25rem] hidden sm:table-cell",
    td: "hidden min-w-[5.25rem] sm:table-cell",
  },
  "Order ID": { th: "min-w-[6.75rem]", td: "min-w-[6.75rem]" },
  "Client Name": { th: "min-w-[8rem]", td: "min-w-[8rem]" },
  Products: {
    th: "min-w-[11rem] hidden md:table-cell",
    td: "hidden min-w-[11rem] md:table-cell",
  },
  "Manager Name": {
    th: "min-w-[7rem] hidden lg:table-cell",
    td: "hidden min-w-[7rem] lg:table-cell",
  },
  Paid: { th: "min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  Due: { th: "min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  "Payment Status": {
    th: "min-w-[7.25rem]",
    td: "min-w-[7.25rem]",
  },
  "Total Amount": { th: "min-w-[7rem]", td: "min-w-[7rem]" },
  "Order Status": { th: "min-w-[7rem]", td: "min-w-[7rem]" },
  Actions: {
    th: "w-[14rem] min-w-[14rem] max-w-[14rem]",
    td: "w-[14rem] min-w-[14rem] max-w-[14rem]",
  },
  Action: {
    th: "w-[14rem] min-w-[14rem] max-w-[14rem]",
    td: "w-[14rem] min-w-[14rem] max-w-[14rem]",
  },
};

/** Reports “All Order” grid (no Actions / Order Status). */
export const REPORT_ORDER_TABLE_COL = {
  "Order ID": { th: "w-[10%] min-w-[6.75rem]", td: "min-w-[6.75rem]" },
  "Client Name": { th: "w-[16%] min-w-[8rem]", td: "min-w-[8rem]" },
  Date: {
    th: "w-[9%] min-w-[5.25rem] hidden sm:table-cell",
    td: "hidden min-w-[5.25rem] sm:table-cell",
  },
  Products: {
    th: "w-[18%] min-w-[11rem] hidden md:table-cell",
    td: "hidden min-w-[11rem] md:table-cell",
  },
  "Manager Name": {
    th: "w-[11%] min-w-[7rem] hidden lg:table-cell",
    td: "hidden min-w-[7rem] lg:table-cell",
  },
  Paid: { th: "w-[8%] min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  Due: { th: "w-[8%] min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  "Payment Status": { th: "w-[10%] min-w-[7.25rem]", td: "min-w-[7.25rem]" },
  "Total Amount": { th: "w-[10%] min-w-[7rem]", td: "min-w-[7rem]" },
};

export function orderTableColClass(key, slot) {
  const row = ORDER_TABLE_COL[key];
  if (!row) return "";
  return slot === "th" ? row.th : row.td;
}

export function reportOrderColClass(key, slot) {
  const row = REPORT_ORDER_TABLE_COL[key];
  if (!row) return "";
  return slot === "th" ? row.th : row.td;
}

/** Order table header: sticky, compact SaaS style */
function denseOrderThBase(columnKey) {
  /* Avoid min-w-0 on Actions/Action: under table-fixed it lets the column shrink and
     icon buttons overflow past the cell even when width utilities are set. */
  const shrink =
    columnKey === "Actions" || columnKey === "Action" ? "" : "min-w-0";
  return [
    "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200",
    TABLE_CELL_BORDER,
    "bg-slate-100 dark:bg-slate-800/90",
    "sticky top-0 z-20",
    getTableCellAlignClass(columnKey),
    "whitespace-normal align-middle leading-snug break-words",
    shrink,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Order body cell */
function denseOrderTdBase(columnKey) {
  const nowrap =
    columnKey === "Actions" || columnKey === "Action" ? " whitespace-nowrap" : "";
  const clip =
    columnKey === "Actions" || columnKey === "Action"
      ? ""
      : "min-w-0 overflow-hidden";
  return [
    "px-3 py-2.5 text-sm leading-snug align-middle text-slate-800 dark:text-slate-100",
    TABLE_CELL_BORDER,
    "transition-colors duration-150",
    getTableCellAlignClass(columnKey),
    nowrap,
    clip,
  ]
    .filter(Boolean)
    .join(" ");
}

export function orderTableThClasses(columnKey) {
  return [denseOrderThBase(columnKey), orderTableColClass(columnKey, "th")]
    .filter(Boolean)
    .join(" ");
}

export function orderTableTdClasses(columnKey) {
  return [denseOrderTdBase(columnKey), orderTableColClass(columnKey, "td")]
    .filter(Boolean)
    .join(" ");
}

export function reportOrderThClasses(columnKey) {
  return [denseOrderThBase(columnKey), reportOrderColClass(columnKey, "th")]
    .filter(Boolean)
    .join(" ");
}

export function reportOrderTdClasses(columnKey) {
  return [denseOrderTdBase(columnKey), reportOrderColClass(columnKey, "td")]
    .filter(Boolean)
    .join(" ");
}

/** <th> classes: hierarchy + alignment */
export function tableThClasses(columnKey) {
  return [
    "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200",
    TABLE_CELL_BORDER,
    "bg-slate-100 dark:bg-slate-800/90",
    getTableCellAlignClass(columnKey),
    "whitespace-nowrap align-middle min-w-0",
  ].join(" ");
}

/** Default <td> for data cells (non-badge) */
export function tableTdClasses(columnKey, { dense = false } = {}) {
  const py = dense ? "py-2" : "py-2.5";
  const nowrap =
    columnKey === "Actions" || columnKey === "Action" ? " whitespace-nowrap" : "";
  const clip =
    columnKey === "Actions" || columnKey === "Action" ? "" : "min-w-0";
  return [
    "px-3 text-sm align-middle text-slate-800 leading-snug dark:text-slate-100",
    py,
    TABLE_CELL_BORDER,
    "transition-colors duration-150",
    getTableCellAlignClass(columnKey),
    nowrap,
    clip,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Full-width card; horizontal scroll when cell content is wider than the viewport. */
export const TABLE_WRAPPER_CLASS =
  "w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:ring-white/[0.06]";

/**
 * Orders grid: vertical scroll + sticky header, horizontal scroll if needed.
 */
export const ORDERS_TABLE_WRAPPER_CLASS =
  "jitox-orders-table-wrap w-full min-w-0 max-h-[min(48vh,420px)] sm:max-h-[min(56vh,520px)] lg:max-h-[min(62vh,600px)] overflow-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-600 dark:bg-slate-900 dark:ring-white/[0.06]";

/**
 * Fixed layout with a floor width so status/amount headers are not clipped;
 * wrapper scrolls horizontally on narrow viewports.
 */
export const ORDERS_TABLE_ELEMENT_CLASS =
  "w-full min-w-[1128px] table-fixed border-collapse text-sm leading-snug";

/** Auto layout so nowrap cells can widen columns; use horizontal scroll on the wrapper. */
export const TABLE_ELEMENT_CLASS =
  "w-full min-w-full table-auto border-collapse text-sm leading-snug";

const BADGE_BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-none";

const BADGE_DENSE_BASE = BADGE_BASE;

function pickBadgeBase(dense) {
  return dense ? BADGE_DENSE_BASE : BADGE_BASE;
}

/** Payment status pill (orders, receivables, etc.). Pass `{ dense: true }` on order grids. */
export function paymentStatusBadgeClasses(value, options = {}) {
  const B = pickBadgeBase(options.dense);
  const s = String(value ?? "").toLowerCase();
  if (s === "paid")
    return `${B} bg-green-100 text-green-800 dark:bg-emerald-950 dark:text-emerald-300`;
  if (s === "pending")
    return `${B} bg-yellow-100 text-yellow-800 dark:bg-amber-950 dark:text-amber-200`;
  if (s === "unpaid")
    return `${B} bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200`;
  return `${B} bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300`;
}

/** Order / workflow status pill */
export function orderStatusBadgeClasses(value, options = {}) {
  const B = pickBadgeBase(options.dense);
  const s = String(value ?? "").toLowerCase().replace(/\s+/g, "");
  const map = {
    pending: `${B} bg-yellow-100 text-yellow-800 dark:bg-amber-950 dark:text-amber-200`,
    approved: `${B} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`,
    dispatched: `${B} bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200`,
    cancelled: `${B} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`,
    processing: `${B} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200`,
    partsupply: `${B} bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200`,
    "part-supply": `${B} bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200`,
  };
  return map[s] || `${B} bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200`;
}

/** Centers status pills vertically without breaking single-line row layout. */
export const STATUS_CELL_INNER =
  "flex min-h-0 items-center justify-center overflow-hidden px-0.5 py-0.5";

/** Dense status cell (order tables). */
export const STATUS_CELL_INNER_DENSE =
  "flex min-h-0 items-center justify-center overflow-hidden px-0.5 py-0.5";

/** Horizontal cluster for order / voucher action icons (never stack vertically). */
export const TABLE_ACTIONS_ROW =
  "inline-flex flex-nowrap items-center justify-center gap-2";

export const TABLE_ACTIONS_ROW_DENSE =
  "inline-flex max-w-full flex-nowrap items-center justify-center gap-1.5";

/** Icon button in Actions column (32px) */
export const TABLE_ACTION_ICON_BTN =
  "inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-600 text-sm shadow-sm transition-colors duration-150 hover:bg-gray-50 hover:text-emerald-600 hover:border-gray-300 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-emerald-400";

/** Order table action icons (28px; fits four + gaps inside fixed Actions column). */
export const TABLE_ACTION_ICON_BTN_DENSE =
  "inline-flex shrink-0 items-center justify-center h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-600 text-sm shadow-sm transition-colors duration-150 hover:bg-gray-50 hover:text-emerald-600 hover:border-gray-300 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-emerald-400";
