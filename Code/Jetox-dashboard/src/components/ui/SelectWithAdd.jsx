import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

/**
 * Standard select-style dropdown with optional search and a "+ Add" row (reference UI).
 *
 * @typedef {{ value: string; label: string; disabled?: boolean }} SelectOption
 *
 * Props:
 * - `options`, `value`, `onChange`, `placeholder`, `label`, `className` — same as legacy CommonDropdown
 * - `hideAdd` — set `true` on list/filter toolbars where "+ Add" is not wanted (default: row is shown)
 * - `filterBar` — toolbar row: h-9 trigger, compact label
 * - `formCompact` — dense forms (invoice): h-9 trigger, 10px muted label, 12px value, stronger chevron
 * - `compactValue` — smaller font for the closed trigger label only (height unchanged unless with formCompact)
 * - `searchable` — filter options; list scrolls, "+ Add" stays fixed at bottom
 * - `searchPlaceholder` — defaults to "Search…"
 * - `menuPlacement` — `"bottom"` (default) or `"top"` to open the panel above the trigger; top placement uses a fixed-position portal so parent `overflow:hidden` does not clip the menu
 * - `menuPortal` — when `true`, bottom-opening menus are portaled (`fixed`, high z-index); use inside modals so lists are not clipped by footers / overflow
 * - `onAddClick` — called when "+ Add" is clicked; combine with `renderAddModal` for modal flows
 * - `addNavigateTo` — dashboard path (e.g. `/dashboard/product`); used if neither `renderAddModal` nor `onAddClick` is set
 * - `addLabel` — default "+ Add"
 * - `closeOnAdd` — default true; set false to keep menu open until modal opens (then close manually)
 * - `renderAddModal` — optional `(ctx) => node` with `{ open, onClose }`; component owns open state when this is passed
 * - `onAddFallback` — optional `() => void` when nothing else handles add (default: brief toast)
 *
 * @example Navigate
 * <SelectWithAdd options={opts} value={v} onChange={setV} addNavigateTo="/dashboard/product" />
 *
 * @example Modal (menu stays open until you close in handler)
 * <SelectWithAdd
 *   closeOnAdd={false}
 *   onAddClick={() => setQuickOpen(true)}
 *   renderAddModal={({ open, onClose }) => (
 *     <CommonModal open={open} onClose={onClose}>…</CommonModal>
 *   )}
 * />
 */
export function SelectWithAdd({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  searchable = false,
  searchPlaceholder = "Search…",
  hideAdd = false,
  onAddClick,
  addLabel = "+ Add",
  closeOnAdd = true,
  renderAddModal,
  addNavigateTo,
  onAddFallback,
  disabled = false,
  /** Toolbar filters: h-9, text-sm, rounded-md */
  filterBar = false,
  /** Dense invoice-style fields: h-9, small muted label, 12px value */
  formCompact = false,
  /** Smaller selected-value font on the trigger; keeps `h-10` / `h-9` sizing */
  compactValue = false,
  /** Open list above trigger — use in dense tables / near bottom of scroll areas */
  menuPlacement = "bottom",
  /** Render menu in a body portal (fixed + high z-index) — use inside modals with overflow/footers */
  menuPortal = false,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const menuPortalRef = useRef(null);
  const listboxId = useId();

  /** Fixed coords — portaled to `document.body` when opening up, or down with `menuPortal` */
  const [fixedMenuStyle, setFixedMenuStyle] = useState(null);

  const showAdd = !hideAdd;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((opt) =>
      String(opt.label ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [options, query, searchable]);

  const flatLength = filteredOptions.length + (showAdd ? 1 : 0);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const handleAdd = useCallback(() => {
    if (typeof renderAddModal === "function") {
      if (closeOnAdd) closeMenu();
      setAddModalOpen(true);
      return;
    }
    if (typeof onAddClick === "function") {
      onAddClick();
      if (closeOnAdd) closeMenu();
      return;
    }
    const path =
      typeof addNavigateTo === "string" ? addNavigateTo.trim() : "";
    if (path) {
      navigate(path);
      if (closeOnAdd) closeMenu();
      return;
    }
    if (typeof onAddFallback === "function") {
      onAddFallback();
      if (closeOnAdd) closeMenu();
      return;
    }
    toast("Add new items from the related master or settings screen.", {
      duration: 3200,
    });
    if (closeOnAdd) closeMenu();
  }, [
    addNavigateTo,
    closeOnAdd,
    closeMenu,
    navigate,
    onAddClick,
    onAddFallback,
    renderAddModal,
  ]);

  const selectIndex = useCallback(
    (idx) => {
      if (idx < 0 || idx >= flatLength) return;
      if (showAdd && idx === filteredOptions.length) {
        handleAdd();
        return;
      }
      const opt = filteredOptions[idx];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        closeMenu();
        triggerRef.current?.focus();
      }
    },
    [flatLength, filteredOptions, onChange, closeMenu, showAdd, handleAdd]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      const t = e.target;
      if (
        (dropdownRef.current && dropdownRef.current.contains(t)) ||
        (menuPortalRef.current && menuPortalRef.current.contains(t))
      ) {
        return;
      }
      closeMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    if (!searchable) {
      const t = requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
      return () => cancelAnimationFrame(t);
    }
  }, [open, query, filteredOptions.length, searchable]);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  const onTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) setOpen(true);
    }
  };

  const onMenuKeyDown = (e) => {
    if (!open) return;
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(flatLength - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(Math.max(0, flatLength - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectIndex(activeIndex);
        break;
      default:
        break;
    }
  };

  const addModalClose = useCallback(() => setAddModalOpen(false), []);

  const triggerTextCls = filterBar
    ? "text-sm"
    : formCompact
      ? "text-[13px]"
      : compactValue
        ? "text-[12px]"
        : "text-[13px]";

  const triggerCls =
    filterBar || formCompact
      ? `flex h-9 min-h-9 max-h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-left ${triggerTextCls} shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color] hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:ring-white/[0.06] dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-primary/30`
      : `flex h-10 min-h-10 max-h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-left ${triggerTextCls} shadow-sm ring-1 ring-slate-900/[0.04] transition-[border-color,box-shadow,background-color] hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:ring-white/[0.06] dark:hover:border-slate-500 dark:hover:bg-slate-900 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-primary/30`;

  const labelCls = filterBar
    ? "mb-1 text-left text-[11px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200"
    : formCompact
      ? "mb-1 text-left text-xs font-medium leading-tight tracking-wide text-slate-600 dark:text-slate-400"
      : "mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200";

  const valueSizeCls = filterBar
    ? "text-sm"
    : formCompact
      ? "text-[13px]"
      : compactValue
        ? "text-[12px]"
        : "text-[13px]";

  const openUp = menuPlacement === "top";
  const useFixedMenuPortal = openUp || menuPortal;

  useLayoutEffect(() => {
    if (!open) {
      setFixedMenuStyle(null);
      return undefined;
    }
    if (!useFixedMenuPortal) {
      setFixedMenuStyle(null);
      return undefined;
    }
    const MENU_Z = 220;
    const update = () => {
      const el = triggerRef.current;
      if (!el || typeof window === "undefined") return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const maxDefault = window.matchMedia("(min-width:640px)").matches
        ? 288
        : 240;

      if (openUp) {
        const rawAbove = rect.top - gap - 10;
        const maxH = Math.min(maxDefault, Math.max(80, rawAbove));
        setFixedMenuStyle({
          position: "fixed",
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top + gap,
          maxHeight: maxH,
          zIndex: MENU_Z,
        });
        return;
      }

      const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
      const maxH = Math.min(maxDefault, Math.max(120, spaceBelow));
      setFixedMenuStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + gap,
        width: rect.width,
        maxHeight: maxH,
        zIndex: MENU_Z,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      setFixedMenuStyle(null);
    };
  }, [open, openUp, menuPortal, useFixedMenuPortal]);

  const valueTextCls = filterBar
    ? `text-sm leading-snug truncate ${
        selectedLabel === placeholder
          ? "text-gray-400 dark:text-slate-500"
          : "text-gray-900 dark:text-slate-100"
      }`
    : `${valueSizeCls} leading-snug truncate ${
        selectedLabel === placeholder
          ? formCompact
            ? "text-slate-400 dark:text-slate-500"
            : "text-light"
          : formCompact
            ? "text-slate-800 dark:text-slate-100"
            : "text-slate-900 dark:text-slate-100"
      }`;

  const menuPanelCls =
    "flex flex-col overflow-hidden outline-none ring-0 bg-white border border-light-border rounded-lg shadow-lg dark:border-slate-600 dark:bg-slate-900";

  const menuInner = (
    <>
      {searchable && (
        <div className="p-2 border-b border-light-border shrink-0 dark:border-slate-600">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                listRef.current?.focus({ preventScroll: true });
                setActiveIndex(0);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                closeMenu();
                triggerRef.current?.focus();
              }
            }}
            placeholder={searchPlaceholder}
            className={`w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-slate-900/[0.04] placeholder:text-slate-500 transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:ring-white/[0.06] dark:placeholder:text-slate-400 dark:focus:bg-slate-950 dark:focus:text-slate-100 dark:focus:ring-primary/30 ${
              formCompact ? "text-sm" : compactValue ? "text-[12px]" : "text-sm"
            }`}
            aria-label={searchPlaceholder}
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        {filteredOptions.length === 0 ? (
          <div
            className={`px-4 py-3 text-light dark:text-slate-400 ${
              formCompact ? "text-sm" : compactValue ? "text-[12px]" : "text-sm"
            }`}
          >
            No matches
          </div>
        ) : (
          filteredOptions.map((opt, idx) => {
            const selected = opt.value === value;
            const active = idx === activeIndex;
            const rowText = formCompact ? "text-sm" : compactValue ? "text-[12px]" : "text-sm";
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={selected}
                aria-disabled={opt.disabled || false}
                data-active={active}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => !opt.disabled && selectIndex(idx)}
                className={`mx-1 flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 ${rowText} transition-colors ${
                  opt.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : active
                      ? "bg-rowBg dark:bg-slate-800"
                      : "hover:bg-lightblue dark:hover:bg-slate-800/80"
                } ${selected ? "text-primary font-medium" : "text-slate-800 dark:text-slate-200"}`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-primary" : "border-slate-300 dark:border-slate-500"
                  }`}
                  aria-hidden
                >
                  {selected ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="truncate">{opt.label}</span>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="flex shrink-0 justify-end border-t border-light-border bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900">
          <button
            type="button"
            role="option"
            aria-label={addLabel}
            data-active={activeIndex === filteredOptions.length}
            onMouseEnter={() => setActiveIndex(filteredOptions.length)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }}
            className={`flex min-h-7 w-auto items-center justify-end gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:border-emerald-200 hover:bg-emerald-50/80 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/50 sm:min-h-8 sm:px-2.5 sm:py-1.5 sm:text-xs ${
              activeIndex === filteredOptions.length
                ? "border-emerald-200 bg-rowBg dark:border-emerald-800/60 dark:bg-slate-800"
                : ""
            }`}
          >
            <span className="text-sm leading-none sm:text-[15px]" aria-hidden>
              +
            </span>
            <span>{String(addLabel).replace(/^\+\s*/, "")}</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div ref={dropdownRef} className={`flex flex-col relative min-w-0 ${className}`}>
      {label && (
        <label className={labelCls}>
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`${triggerCls} ${
          open
            ? "border-primary ring-2 ring-primary/20 dark:ring-primary/25"
            : ""
        }`}
      >
        <span className={valueTextCls} title={selectedLabel}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${
            formCompact
              ? "text-slate-500 dark:text-slate-400"
              : "text-light dark:text-slate-400"
          } ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open &&
        useFixedMenuPortal &&
        fixedMenuStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            ref={(el) => {
              listRef.current = el;
              menuPortalRef.current = el;
            }}
            onKeyDown={onMenuKeyDown}
            style={fixedMenuStyle}
            className={menuPanelCls}
          >
            {menuInner}
          </div>,
          document.body
        )}

      {open && !useFixedMenuPortal && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onMenuKeyDown}
          className={`absolute top-full left-0 z-[120] mt-1.5 w-full max-h-60 sm:max-h-72 ${menuPanelCls}`}
        >
          {menuInner}
        </div>
      )}

      {typeof renderAddModal === "function" &&
        renderAddModal({ open: addModalOpen, onClose: addModalClose })}
    </div>
  );
}

/** @deprecated Prefer named import SelectWithAdd; kept for existing imports */
export const CommonDropdown = SelectWithAdd;
