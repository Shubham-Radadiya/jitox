import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";

/** Stable key for empty / null cells */
export function excelNormalizeCell(value) {
  if (value == null) return "__BLANK__";
  const s = String(value).trim();
  return s === "" ? "__BLANK__" : s;
}

export function excelDisplayLabel(key) {
  return key === "__BLANK__" ? "(Blanks)" : String(key);
}

/** @typedef {'text' | 'date' | 'amount'} ExcelFilterSortMode */

/**
 * Infer sort / filter semantics from column key when `filterSort` is not set on the column.
 * @param {string} columnKey
 * @returns {ExcelFilterSortMode}
 */
export function inferExcelFilterSortMode(columnKey) {
  const nk = String(columnKey || "")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (
    nk === "date" ||
    nk.endsWith("date") ||
    nk === "voucherdate" ||
    nk === "duedate" ||
    nk === "createdat" ||
    nk === "invoicedate"
  ) {
    return "date";
  }
  if (
    nk.includes("amount") ||
    nk.includes("paid") ||
    nk.includes("due") ||
    nk.includes("debit") ||
    nk.includes("credit") ||
    nk.includes("balance") ||
    nk.includes("total") ||
    nk.includes("rate") ||
    nk.includes("qty") ||
    nk.includes("quantity") ||
    nk.includes("price") ||
    nk.includes("mrp") ||
    nk.includes("tax") ||
    nk.includes("discount") ||
    nk.includes("emi") ||
    nk.includes("subtotal") ||
    nk.includes("value") ||
    nk.includes("opening") ||
    nk.includes("closing")
  ) {
    return "amount";
  }
  return "text";
}

/**
 * @param {ExcelFilterSortMode} mode
 * @returns {{ asc: string, desc: string }}
 */
function sortLabelsForMode(mode) {
  switch (mode) {
    case "date":
      return { asc: "Oldest → Newest", desc: "Newest → Oldest" };
    case "amount":
      return { asc: "Lowest → Highest", desc: "Highest → Lowest" };
    default:
      return { asc: "Sort A → Z", desc: "Sort Z → A" };
  }
}

/**
 * Excel-style column header control: funnel opens sort + filter-by-values popover.
 */
export default function ExcelColumnFilterHeader({
  columnKey,
  rows,
  /** `null` = no value filter; otherwise allowed normalized keys */
  appliedAllowed,
  onApplyAllowed,
  sortDir,
  onSort,
  /** Override inferred mode: `'text' | 'date' | 'amount'` */
  filterSort,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 288 });
  const [draft, setDraft] = useState(new Set());
  const [search, setSearch] = useState("");

  const sortMode = useMemo(() => {
    if (filterSort === "date" || filterSort === "amount" || filterSort === "text")
      return filterSort;
    return inferExcelFilterSortMode(columnKey);
  }, [columnKey, filterSort]);

  const sortLabels = useMemo(() => sortLabelsForMode(sortMode), [sortMode]);

  const allKeys = useMemo(() => {
    const s = new Set();
    (rows || []).forEach((r) => {
      s.add(excelNormalizeCell(r[columnKey]));
    });
    return Array.from(s).sort((a, b) => {
      if (a === "__BLANK__") return -1;
      if (b === "__BLANK__") return 1;
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [rows, columnKey]);

  const isActive =
    Boolean(sortDir) ||
    (appliedAllowed != null &&
      appliedAllowed.length > 0 &&
      appliedAllowed.length < allKeys.length);

  const updatePanelPosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const anchor = btn.closest("th") || btn;
    const r = anchor.getBoundingClientRect();
    const isNarrow = window.innerWidth < 640;
    const width = isNarrow
      ? Math.min(280, Math.max(224, Math.floor(r.width + 4)))
      : Math.min(300, Math.max(260, Math.floor(r.width + 8)));
    const preferredLeft = r.left;
    const left = Math.max(
      8,
      Math.min(preferredLeft, window.innerWidth - width - 8)
    );
    setPanelPos({ top: r.bottom + 4, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePanelPosition();
    const onScroll = () => updatePanelPosition();
    const onResize = () => updatePanelPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const t = e.target;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) {
        return;
      }
      const th = triggerRef.current?.closest("th");
      if (th && th.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    if (appliedAllowed == null) {
      setDraft(new Set(allKeys));
    } else {
      setDraft(new Set(appliedAllowed));
    }
    setSearch("");
    setOpen(true);
  };

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allKeys;
    return allKeys.filter((k) => {
      const disp = (k === "__BLANK__" ? "(blanks)" : String(k)).toLowerCase();
      return disp.includes(q);
    });
  }, [allKeys, search]);

  const selectAll = () => {
    if (search.trim()) {
      setDraft((prev) => {
        const next = new Set(prev);
        filteredKeys.forEach((k) => next.add(k));
        return next;
      });
    } else {
      setDraft(new Set(allKeys));
    }
  };
  const clearChecks = () => setDraft(new Set());

  const toggleKey = (k) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleOk = () => {
    if (draft.size === 0) {
      onApplyAllowed(columnKey, []);
      setOpen(false);
      return;
    }
    if (draft.size === allKeys.length) {
      onApplyAllowed(columnKey, null);
    } else {
      onApplyAllowed(columnKey, Array.from(draft));
    }
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Filter ${columnKey}`}
        className="fixed z-[200] flex min-h-0 max-h-[min(26rem,84vh)] min-w-[224px] max-w-[calc(100vw-0.75rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-[0_12px_48px_-8px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/[0.04] dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/50 dark:ring-white/[0.06] sm:max-h-[min(28rem,85vh)] sm:min-w-[260px] sm:max-w-[calc(100vw-1rem)] sm:rounded-2xl"
        style={{
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
        }}
      >
        <div className="shrink-0 border-b border-slate-200/90 px-3 pb-2.5 pt-3 dark:border-slate-700 sm:px-4 sm:pb-3 sm:pt-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Sort
          </p>
          <div className="mt-2 flex flex-col gap-0.5 sm:mt-2.5">
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors sm:px-3 sm:py-2 sm:text-[13px] ${
                sortDir === "asc"
                  ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-emerald-300"
                  : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={() => {
                onSort?.(columnKey, "asc");
                setOpen(false);
              }}
            >
              {sortLabels.asc}
            </button>
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors sm:px-3 sm:py-2 sm:text-[13px] ${
                sortDir === "desc"
                  ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-emerald-300"
                  : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={() => {
                onSort?.(columnKey, "desc");
                setOpen(false);
              }}
            >
              {sortLabels.desc}
            </button>
            {sortDir ? (
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                onClick={() => {
                  onSort?.(columnKey, null);
                  setOpen(false);
                }}
              >
                Clear sort
              </button>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 px-3 pb-2 pt-2.5 sm:px-4 sm:pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Filter by values
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs sm:mt-2.5">
            <button
              type="button"
              className="font-semibold text-primary hover:underline decoration-primary/60 underline-offset-2"
              onClick={selectAll}
            >
              {search.trim()
                ? `Select all shown (${filteredKeys.length})`
                : `Select all (${allKeys.length})`}
            </button>
            <button
              type="button"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              onClick={clearChecks}
            >
              Clear
            </button>
          </div>
          <div className="relative mt-2 sm:mt-2.5">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search values..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 sm:py-2"
            />
          </div>
        </div>

        <div className="mx-3 mb-1 min-h-0 max-h-[11.5rem] flex-1 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900 sm:mx-4 sm:max-h-[13.5rem]">
          {filteredKeys.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No matches
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
              {filteredKeys.map((k) => (
                <li key={k}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 sm:gap-3 sm:px-3 sm:py-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary accent-primary focus:ring-2 focus:ring-primary/25 dark:border-slate-500 dark:bg-slate-800"
                      checked={draft.has(k)}
                      onChange={() => toggleKey(k)}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] leading-snug text-slate-800 dark:text-slate-100 sm:text-[13px]">
                      {excelDisplayLabel(k)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50 sm:gap-3 sm:px-4 sm:py-3">
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-4 sm:py-2"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 sm:px-4 sm:py-2"
            onClick={handleOk}
          >
            OK
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Column filter"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openMenu();
        }}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
          isActive
            ? "border-primary/50 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15"
            : "border-transparent text-slate-400 hover:border-slate-200/90 hover:bg-slate-100 hover:text-slate-600 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        }`}
      >
        <Filter size={16} strokeWidth={2} aria-hidden />
      </button>
      {panel}
    </>
  );
}
