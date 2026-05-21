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
  "Total Cost",
  "Cost/Unit",
  "Qty Made",
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
  `px-2 py-1.5 align-middle ${TABLE_CELL_BORDER} bg-slate-50 text-[15px] font-semibold text-gray-900 dark:bg-slate-800/80 dark:text-slate-100`;

const TABLE_FOOTER_TD_BASE_HEAD =
  `px-2 py-1.5 align-middle ${TABLE_CELL_BORDER} bg-slate-50 text-[15px] font-semibold text-dark dark:bg-slate-800/80 dark:text-slate-100`;

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
    th: "min-w-[8.75rem] hidden lg:table-cell",
    td: "hidden min-w-[8.75rem] lg:table-cell",
  },
  Paid: { th: "min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  Due: { th: "min-w-[4.5rem]", td: "min-w-[4.5rem]" },
  "Payment Status": {
    th: "min-w-[8.5rem]",
    td: "min-w-[8.5rem]",
  },
  "Total Amount": { th: "min-w-[8rem]", td: "min-w-[8rem]" },
  "Order Status": { th: "min-w-[8rem]", td: "min-w-[8rem]" },
  Actions: {
    th: "w-[9rem] min-w-[9rem] max-w-[9rem]",
    td: "w-[9rem] min-w-[9rem] max-w-[9rem]",
  },
  Action: {
    th: "w-[9rem] min-w-[9rem] max-w-[9rem]",
    td: "w-[9rem] min-w-[9rem] max-w-[9rem]",
  },
};

/** Reports “All Order” grid (no Actions / Order Status). */
export const REPORT_ORDER_TABLE_COL = {
  "Order ID": { th: "w-[10%] min-w-[6.75rem]", td: "min-w-[6.75rem]" },
  "Client Name": { th: "w-[16%] min-w-[8rem]", td: "min-w-[8rem]" },
  Date: {
    th: "w-[9%] min-w-[5.25rem]",
    td: "min-w-[5.25rem]",
  },
  Products: {
    th: "w-[18%] min-w-[11rem]",
    td: "min-w-[11rem]",
  },
  "Manager Name": {
    th: "w-[11%] min-w-[7rem]",
    td: "min-w-[7rem]",
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
    "px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200",
    TABLE_CELL_BORDER,
    "bg-slate-100 dark:bg-slate-800/90",
    "sticky top-0 z-20",
    getTableCellAlignClass(columnKey),
    "whitespace-nowrap align-middle leading-snug",
    shrink,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Order body cell */
function denseOrderTdBase(columnKey) {
  const clip =
    columnKey === "Actions" || columnKey === "Action"
      ? ""
      : "min-w-0 overflow-hidden";
  return [
    "whitespace-nowrap px-2 py-1.5 text-sm leading-snug align-middle text-slate-800 dark:text-slate-100",
    TABLE_CELL_BORDER,
    "transition-colors duration-150",
    getTableCellAlignClass(columnKey),
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
    "px-1 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200",
    TABLE_CELL_BORDER,
    "bg-slate-100 dark:bg-slate-800/90",
    getTableCellAlignClass(columnKey),
    "whitespace-nowrap align-middle min-w-0",
  ].join(" ");
}

/** Default <td> for data cells (non-badge) */
export function tableTdClasses(columnKey, { dense = false } = {}) {
  const py = dense ? "py-1.5" : "py-2";
  const clip =
    columnKey === "Actions" || columnKey === "Action" ? "" : "min-w-0";
  return [
    "whitespace-nowrap px-2 text-[15px] align-middle text-slate-800 leading-snug dark:text-slate-100",
    py,
    TABLE_CELL_BORDER,
    "transition-colors duration-150",
    getTableCellAlignClass(columnKey),
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
  "w-full min-w-[1260px] table-auto border-collapse text-sm leading-snug";

/** Auto layout so nowrap cells can widen columns; use horizontal scroll on the wrapper. */
export const TABLE_ELEMENT_CLASS =
  "w-full min-w-full table-auto border-collapse text-[15px] leading-snug";

const BADGE_BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold leading-tight";

const BADGE_DENSE_BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-tight";

function pickBadgeBase(dense) {
  return dense ? BADGE_DENSE_BASE : BADGE_BASE;
}

/** Payment status pill (orders, receivables, etc.). Pass `{ dense: true }` on order grids. */
export function paymentStatusBadgeClasses(value, options = {}) {
  const B = pickBadgeBase(options.dense);
  const s = String(value ?? "").toLowerCase();
  if (s === "paid" || s === "received")
    return `${B} border-green-200/90 bg-green-100 text-green-800 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50`;
  if (s === "partial")
    return `${B} border-sky-200/90 bg-sky-100 text-sky-900 dark:border-sky-400/45 dark:bg-sky-500/16 dark:text-sky-50`;
  if (s === "pending")
    return `${B} border-amber-200/90 bg-amber-100 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-50`;
  if (s === "unpaid")
    return `${B} border-slate-200/90 bg-gray-100 text-gray-700 dark:border-slate-500/40 dark:bg-slate-500/18 dark:text-slate-100`;
  return `${B} border-slate-200/80 bg-gray-100 text-gray-600 dark:border-slate-500/35 dark:bg-slate-500/15 dark:text-slate-200`;
}

/** Scheme list lifecycle: Active / Expired / Upcoming (from start/end dates). */
export function schemeLifecycleBadgeClasses(value, options = {}) {
  const B = pickBadgeBase(options.dense);
  const s = String(value ?? "").toLowerCase();
  if (s === "active")
    return `${B} border-emerald-200/90 bg-emerald-100 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50`;
  if (s === "expired")
    return `${B} border-red-200/90 bg-red-100 text-red-900 dark:border-rose-400/45 dark:bg-rose-500/18 dark:text-rose-50`;
  if (s === "upcoming")
    return `${B} border-amber-200/90 bg-amber-100 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-50`;
  return `${B} border-slate-200/80 bg-gray-100 text-gray-600 dark:border-slate-500/35 dark:bg-slate-500/15 dark:text-slate-200`;
}

/** Order / workflow status pill */
export function orderStatusBadgeClasses(value, options = {}) {
  const B = pickBadgeBase(options.dense);
  const s = String(value ?? "").toLowerCase().replace(/\s+/g, "");
  const map = {
    pending: `${B} border-amber-200/90 bg-amber-100 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-50`,
    approved: `${B} border-emerald-200/90 bg-emerald-100 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50`,
    dispatched: `${B} border-purple-200/90 bg-purple-100 text-purple-900 dark:border-violet-400/45 dark:bg-violet-500/18 dark:text-violet-50`,
    cancelled: `${B} border-red-200/90 bg-red-100 text-red-900 dark:border-rose-400/45 dark:bg-rose-500/18 dark:text-rose-50`,
    processing: `${B} border-blue-200/90 bg-blue-100 text-blue-900 dark:border-sky-400/45 dark:bg-sky-500/18 dark:text-sky-50`,
    quotation: `${B} border-slate-200/80 bg-gray-100 text-gray-700 dark:border-slate-500/35 dark:bg-slate-500/15 dark:text-slate-200`,
    notonorderlist: `${B} border-red-200/90 bg-red-100 text-red-800 dark:border-red-400/45 dark:bg-red-500/18 dark:text-red-50`,
    onorderlist: `${B} border-emerald-200/90 bg-emerald-100 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50`,
    partsupply: `${B} border-orange-200/90 bg-amber-100 text-amber-900 dark:border-orange-400/45 dark:bg-orange-500/16 dark:text-orange-50`,
    "part-supply": `${B} border-orange-200/90 bg-amber-100 text-amber-900 dark:border-orange-400/45 dark:bg-orange-500/16 dark:text-orange-50`,
  };
  if (s.includes("notonorder")) {
    return map.notonorderlist;
  }
  if (s.includes("onorderlist")) {
    return map.onorderlist;
  }
  return (
    map[s] ||
    `${B} border-slate-200/80 bg-gray-100 text-gray-700 dark:border-slate-500/35 dark:bg-slate-500/15 dark:text-slate-200`
  );
}

/** Centers status pills vertically without breaking single-line row layout. */
export const STATUS_CELL_INNER =
  "flex min-h-0 items-center justify-center overflow-hidden px-0.5 py-0.5";

/** Dense status cell (order tables). */
export const STATUS_CELL_INNER_DENSE =
  "flex min-h-0 items-center justify-center overflow-hidden px-0.5 py-0.5";

/** Horizontal cluster for order / voucher action icons (never stack vertically). */
export const TABLE_ACTIONS_ROW =
  "inline-flex max-w-full flex-nowrap items-center justify-center gap-1.5 sm:gap-2";

export const TABLE_ACTIONS_ROW_DENSE =
  "inline-flex max-w-full flex-nowrap items-center justify-center gap-1 sm:gap-1.5";

/** Icon button in Actions column — compact on xs so a full row stays on one line. */
export const TABLE_ACTION_ICON_BTN =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-500/60 bg-transparent text-slate-700 transition-colors duration-150 hover:border-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-500/70 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-100 [&_svg]:max-h-[18px] [&_svg]:max-w-[18px]";

/** Order table action icons — tighter on small screens for fixed Actions column. */
export const TABLE_ACTION_ICON_BTN_DENSE =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-500/60 bg-transparent text-slate-700 text-sm transition-colors duration-150 hover:border-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-500/70 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 sm:h-7 sm:w-7 [&_svg]:opacity-100 [&_svg]:max-h-[14px] [&_svg]:max-w-[14px] sm:[&_svg]:max-h-[16px] sm:[&_svg]:max-w-[16px]";
