import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileSpreadsheet,
  Keyboard,
  Plus,
  Printer,
  Receipt,
  ScanLine,
  Settings,
  Share2,
  Trash2,
  Truck,
} from "lucide-react";
import {
  Button,
  CommonDropdown,
  DateInput,
  InputField,
} from "../../../components/ui/CommanUI";
import {
  fmtInr,
  parseNum,
  QUOTATION_INVOICE_PREFIX,
} from "./voucherFormConstants";
import {
  buildPurchasePayloadShareText,
  downloadPurchasePayloadCsv,
  downloadPurchasePayloadTaxInvoicePdf,
  shareOrCopyText,
} from "../../../utils/voucherShare";

function useMatchMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatches(mq.matches);
    mq.addEventListener("change", fn);
    fn();
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return matches;
}

/** Line-items grid — flat fields; centered text so placeholders align (not hugging one edge) */
const cellTable =
  "w-full min-w-0 min-h-8 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] leading-snug text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/25 sm:min-h-0 sm:px-2.5 sm:py-2 sm:text-[13px] sm:leading-tight";
/** Numeric line cells — centered like placeholders; tabular nums for digits */
const cellNum = `${cellTable} tabular-nums`;
const thBase =
  "sticky top-0 z-[1] bg-slate-100 px-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 sm:px-3 sm:py-2.5 sm:text-[11px] dark:bg-slate-800 dark:text-slate-400";
const th = `${thBase} text-left`;
const thC = `${thBase} text-center`;

function rowMoney(row, gstRate) {
  const q = parseNum(row.qty);
  const r = parseNum(row.rate);
  const base = q * r;
  const dAmt = parseNum(row.discountAmt);
  const dPct = parseNum(row.discountPct);
  const disc = dAmt > 0 ? dAmt : base * (dPct / 100);
  const taxable = Math.max(0, base - disc);
  const gstPct = parseNum(gstRate);
  const tax = gstPct ? (taxable * gstPct) / 100 : 0;
  const amount = taxable + tax;
  return { base, disc, taxable, tax, amount, gstPct };
}

/**
 * Purchase invoice UI for the wide modal — tuned for clarity, touch targets, and scanability.
 */
export default function InvoicePurchaseModalLayout({
  formType = "purchase",
  dropdownOptions,
  liveNow,
  onClose,
  onSave,
  partyName,
  onBillPartyChange,
  onShipPartyChange,
  partyHint,
  billTo,
  setBillTo,
  shipDifferent,
  setShipDifferent,
  shipToPartyName,
  shipTo,
  setShipTo,
  persistedShipToRef,
  purchaseDate,
  handleDateChange,
  invoicePrefix,
  setInvoicePrefix,
  invoiceNumber,
  setInvoiceNumber,
  setVoucherNo,
  originalInvNo,
  setOriginalInvNo,
  ewayBill,
  setEwayBill,
  voucherNo,
  transporter,
  setTransporter,
  deliveryAt,
  setDeliveryAt,
  orderBy,
  setOrderBy,
  productRows,
  addProductRow,
  removeProductRow,
  updateProductRow,
  gstRate,
  setGstRate,
  termsPayment,
  setTermsPayment,
  termsText,
  setTermsText,
  narration,
  setNarration,
  internalNotes,
  setInternalNotes,
  getShareSnapshot,
  stockToggle,
  setStockToggle,
  moreDetailsOpen,
  setMoreDetailsOpen,
  lineTotals,
  renderGstAddModal,
  renderTermsAddModal,
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [roundOff, setRoundOff] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareNarrow = useMatchMedia("(max-width: 639px)");
  const shareWrapRef = useRef(null);

  useEffect(() => {
    if (!shareOpen || shareNarrow) return undefined;
    const onDoc = (e) => {
      const el = shareWrapRef.current;
      if (el && !el.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [shareOpen, shareNarrow]);

  useEffect(() => {
    if (!shareOpen || !shareNarrow) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shareOpen, shareNarrow]);

  const clock = liveNow ? dayjs(liveNow).format("DD MMM YYYY, hh:mm:ss A") : "";

  const gstPct = parseNum(gstRate);
  const halfRate = gstPct > 0 ? gstPct / 2 : 0;

  const lineGrand = useMemo(
    () =>
      productRows.reduce((s, r) => s + rowMoney(r, gstRate).amount, 0),
    [productRows, gstRate]
  );

  const lineQty = useMemo(
    () => productRows.reduce((s, r) => s + parseNum(r.qty), 0),
    [productRows]
  );

  const totalTax = lineTotals.tax;
  const totalSgst = totalTax / 2;
  const totalCgst = totalTax / 2;

  const rawGrand = lineGrand;
  const displayGrand = Math.round(rawGrand);
  const roundDelta = roundOff ? displayGrand - rawGrand : 0;

  const isPurchaseReturn = formType === "purchase-return";
  const isSalesReturn = formType === "sales-return";
  const isReturn = isPurchaseReturn;
  const isSales = formType === "sales";
  const isQuotation = formType === "quotation";
  const isPurchase = formType === "purchase";
  const headerEyebrow = isQuotation
    ? "Quotation"
    : isSalesReturn
      ? "Sales return"
      : isSales
        ? "Sales invoice"
        : isReturn
          ? "Purchase return"
          : "Purchase invoice";
  const headerTitle = isQuotation
    ? "Create Quotation"
    : isSalesReturn
      ? "Review & approve sales return"
      : isSales
        ? "Create Sales Invoice"
        : isReturn
          ? "Create Purchase Return"
          : "Create Purchase Invoice";
  const billFromEyebrow =
    isSales || isSalesReturn || isQuotation
      ? "Bill to"
      : isReturn
        ? "Return to"
        : "Bill from";
  const shipFromEyebrow =
    isSales || isSalesReturn || isQuotation
      ? "Ship to"
      : isReturn
        ? "Ship from (your end)"
        : "Ship from";
  const invoiceSectionTitle = isQuotation
    ? "Quotation details"
    : isSalesReturn
      ? "Return details"
      : isSales
        ? "Sales details"
        : isReturn
          ? "Return details"
          : "Invoice details";
  const stockToggleLabel = isQuotation
    ? "Show stock quantity on this quote (inventory is not updated)"
    : isSalesReturn
      ? "Increase stock when this return is approved (not on save)"
      : isSales
        ? "Decrease stock when this sale is saved"
        : isReturn
          ? "Decrease stock when this return is saved"
          : "Update stock when this voucher is saved";
  const shareDocLabel = isQuotation
    ? "Quotation"
    : isSalesReturn
      ? "Sales return"
      : isSales
        ? "Sales"
        : "Purchase";

  return (
    <div className="flex min-h-0 flex-col bg-gradient-to-b from-slate-100/95 via-slate-50/90 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/98 dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.35)] sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-primary/40 hover:bg-emerald-50/90 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-primary/50 dark:hover:bg-primary/15 dark:hover:text-emerald-300"
              aria-label="Close and go back"
            >
              <ArrowLeft size={19} strokeWidth={2} />
            </button>
            <div className="min-w-0 border-l border-slate-200/90 pl-3 dark:border-slate-600">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary dark:text-emerald-400">
                {headerEyebrow}
              </p>
              <h2 className="text-[1.05rem] font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-50 sm:truncate sm:text-lg">
                {headerTitle}
              </h2>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400 sm:hidden">
                Totals and taxes update as you fill each line.
              </p>
              <p className="mt-0.5 hidden text-[11px] leading-snug text-slate-500 sm:block dark:text-slate-400">
                Fields below calculate totals and taxes as you type.
              </p>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            {clock ? (
              <time
                dateTime={liveNow?.toISOString?.()}
                className="w-full shrink-0 text-center text-[11px] font-medium tabular-nums text-slate-500 sm:w-auto sm:text-right sm:text-xs dark:text-slate-400"
              >
                {clock}
              </time>
            ) : null}
            <div className="flex w-full min-w-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-2">
              <div className="flex items-center justify-center gap-1.5 sm:justify-end">
              <button
                type="button"
                title="Keyboard shortcuts (coming soon)"
                aria-label="Keyboard shortcuts"
                onClick={() =>
                  toast("Shortcuts: Ctrl+S save — full shortcut map coming soon.")
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Keyboard size={18} />
              </button>
              <button
                type="button"
                title="Invoice settings"
                aria-label="Settings"
                onClick={() => toast("Invoice settings will open here.")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Settings size={18} />
              </button>
              <div ref={shareWrapRef} className="relative shrink-0">
                <button
                  type="button"
                  title="Share or export voucher"
                  aria-expanded={shareOpen}
                  aria-haspopup="menu"
                  onClick={() => setShareOpen((o) => !o)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-emerald-50/90 dark:border-slate-600 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-primary/50 dark:hover:bg-primary/10"
                >
                  <Share2 size={17} strokeWidth={2} />
                  <span className="hidden sm:inline">Share</span>
                  <ChevronDown
                    size={14}
                    className={`opacity-70 transition ${shareOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {shareOpen && shareNarrow && typeof document !== "undefined"
                  ? createPortal(
                      <>
                        <button
                          type="button"
                          aria-label="Close share menu"
                          className="fixed inset-0 z-[200] bg-slate-950/55 backdrop-blur-[2px]"
                          onClick={() => setShareOpen(false)}
                        />
                        <div
                          role="menu"
                          className="fixed left-1/2 top-1/2 z-[210] w-[min(calc(100vw-1.25rem),20rem)] max-h-[min(70vh,24rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl ring-1 ring-slate-900/8 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/10"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium leading-snug text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-800/90"
                            onClick={async () => {
                              setShareOpen(false);
                              const snap =
                                typeof getShareSnapshot === "function"
                                  ? getShareSnapshot()
                                  : null;
                              if (!snap) {
                                toast.error("Nothing to share yet.");
                                return;
                              }
                              const text = buildPurchasePayloadShareText(snap);
                              const r = await shareOrCopyText(
                                `${shareDocLabel} ${snap.voucherNo || ""}`,
                                text
                              );
                              if (r === "shared") toast.success("Shared");
                              else if (r === "copied")
                                toast.success("Summary copied to clipboard");
                              else toast.error("Could not share or copy");
                            }}
                          >
                            <Copy
                              className="h-5 w-5 shrink-0 text-primary"
                              strokeWidth={2}
                            />
                            Copy / system share
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium leading-snug text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-800/90"
                            onClick={() => {
                              setShareOpen(false);
                              const snap =
                                typeof getShareSnapshot === "function"
                                  ? getShareSnapshot()
                                  : null;
                              if (!snap) {
                                toast.error("Nothing to export yet.");
                                return;
                              }
                              downloadPurchasePayloadCsv(snap);
                              toast.success("Excel-compatible CSV downloaded");
                            }}
                          >
                            <FileSpreadsheet
                              className="h-5 w-5 shrink-0 text-primary"
                              strokeWidth={2}
                            />
                            Download Excel (CSV)
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium leading-snug text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-800/90"
                            onClick={async () => {
                              setShareOpen(false);
                              const snap =
                                typeof getShareSnapshot === "function"
                                  ? getShareSnapshot()
                                  : null;
                              if (!snap) {
                                toast.error("Nothing to print yet.");
                                return;
                              }
                              try {
                                await downloadPurchasePayloadTaxInvoicePdf(
                                  snap
                                );
                                toast.success("Tax invoice PDF downloaded.");
                              } catch (e) {
                                console.error(e);
                                toast.error("Could not generate PDF.");
                              }
                            }}
                          >
                            <Printer
                              className="h-5 w-5 shrink-0 text-primary"
                              strokeWidth={2}
                            />
                            Download tax invoice (PDF)
                          </button>
                        </div>
                      </>,
                      document.body
                    )
                  : null}
                {shareOpen && !shareNarrow ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-40 mt-1.5 w-[min(100vw-2rem,15.5rem)] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={async () => {
                        setShareOpen(false);
                        const snap =
                          typeof getShareSnapshot === "function"
                            ? getShareSnapshot()
                            : null;
                        if (!snap) {
                          toast.error("Nothing to share yet.");
                          return;
                        }
                        const text = buildPurchasePayloadShareText(snap);
                        const r = await shareOrCopyText(
                          `${shareDocLabel} ${snap.voucherNo || ""}`,
                          text
                        );
                        if (r === "shared") toast.success("Shared");
                        else if (r === "copied")
                          toast.success("Summary copied to clipboard");
                        else toast.error("Could not share or copy");
                      }}
                    >
                      <Copy size={16} className="shrink-0 text-primary" />
                      Copy / system share
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        setShareOpen(false);
                        const snap =
                          typeof getShareSnapshot === "function"
                            ? getShareSnapshot()
                            : null;
                        if (!snap) {
                          toast.error("Nothing to export yet.");
                          return;
                        }
                        downloadPurchasePayloadCsv(snap);
                        toast.success("Excel-compatible CSV downloaded");
                      }}
                    >
                      <FileSpreadsheet
                        size={16}
                        className="shrink-0 text-primary"
                      />
                      Download Excel (CSV)
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={async () => {
                        setShareOpen(false);
                        const snap =
                          typeof getShareSnapshot === "function"
                            ? getShareSnapshot()
                            : null;
                        if (!snap) {
                          toast.error("Nothing to print yet.");
                          return;
                        }
                        try {
                          await downloadPurchasePayloadTaxInvoicePdf(snap);
                          toast.success("Tax invoice PDF downloaded.");
                        } catch (e) {
                          console.error(e);
                          toast.error("Could not generate PDF.");
                        }
                      }}
                    >
                      <Printer size={16} className="shrink-0 text-primary" />
                      Download tax invoice (PDF)
                    </button>
                  </div>
                ) : null}
              </div>
              </div>
              <div
                className="hidden h-6 w-px shrink-0 bg-slate-200 sm:block dark:bg-slate-600"
                aria-hidden
              />
              <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:gap-2">
              <Button
                type="button"
                label="Save & New"
                variant="outline"
                size="sm"
                className="max-sm:!min-h-9 max-sm:!py-2 max-sm:!text-[12px] max-sm:!leading-tight w-full justify-center border-primary/35 px-2 font-semibold text-primary shadow-sm hover:bg-emerald-50 sm:min-h-10 sm:w-auto sm:px-3 sm:text-sm dark:border-primary/45 dark:text-emerald-300 dark:hover:bg-primary/15"
                onClick={() => onSave("new")}
              />
              <Button
                type="button"
                label="Save"
                variant="primary"
                size="sm"
                className="max-sm:!min-h-9 max-sm:!py-2 max-sm:!text-[12px] max-sm:!leading-tight w-full justify-center bg-primary px-2.5 font-semibold text-white shadow-md hover:bg-primary/90 sm:min-h-10 sm:min-w-[5.5rem] sm:w-auto sm:px-5 sm:text-sm dark:bg-primary dark:hover:bg-primary/85"
                onClick={() => onSave("close")}
              />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[1200px] flex flex-col">
          <div className="flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.02] transition-shadow hover:shadow-md hover:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 sm:p-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-primary dark:text-emerald-400" aria-hidden />
                  {billFromEyebrow}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-primary dark:text-emerald-400">
                  Change party
                </span>
              </div>
              <CommonDropdown
                hideAdd
                searchable
                searchPlaceholder="Search party…"
                options={dropdownOptions.parties}
                value={partyName}
                onChange={onBillPartyChange}
                placeholder="Select party (required)"
                className="w-full"
              />
              {partyHint ? (
                <div
                  role="status"
                  className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {partyHint}
                </div>
              ) : null}
            </div>

            <div
              className={`flex h-full min-h-0 flex-col rounded-2xl border bg-white p-3.5 shadow-sm ring-1 transition-all dark:bg-slate-900 sm:p-4 ${
                shipDifferent
                  ? "border-primary/35 ring-primary/15 dark:border-primary/40 dark:ring-primary/25"
                  : "border-slate-200/90 ring-slate-900/[0.02] dark:border-slate-700 dark:ring-white/5"
              }`}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                  {shipFromEyebrow}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-primary dark:text-emerald-400">
                  Change shipping
                </span>
              </div>
              <CommonDropdown
                hideAdd
                searchable
                searchPlaceholder="Search party…"
                options={dropdownOptions.parties}
                value={shipDifferent ? shipToPartyName : partyName}
                onChange={(name) => {
                  if (shipDifferent) {
                    onShipPartyChange(name);
                  } else {
                    onBillPartyChange(name);
                  }
                }}
                placeholder="Select ship-to party"
                className="w-full"
                disabled={!shipDifferent}
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-0 py-0.5 hover:border-slate-100 dark:hover:border-slate-800">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary accent-primary focus:ring-primary"
                  checked={shipDifferent}
                  onChange={(e) => setShipDifferent(e.target.checked)}
                />
                <span className="text-[13px] font-medium leading-snug text-slate-700 sm:text-[12px] dark:text-slate-300">
                  Different ship-to party
                </span>
              </label>
              {shipDifferent ? (
                <div className="mt-2">
                  <InputField
                    label="Ship to address"
                    multiline
                    rows={2}
                    value={shipTo}
                    onChange={(e) => setShipTo(e.target.value)}
                    inputClassName="!text-[14px] min-h-[3.25rem] sm:!text-[13px]"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.02] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:mb-4 dark:text-slate-400">
              <Receipt
                className="h-4 w-4 shrink-0 text-primary dark:text-emerald-400"
                strokeWidth={2}
                aria-hidden
              />
              {invoiceSectionTitle}
            </h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 sm:gap-y-4 lg:grid-cols-3 xl:grid-cols-6 [&_input]:!text-[14px] [&_input]:!leading-tight [&_textarea]:!text-[14px] [&_textarea]:!leading-tight sm:[&_input]:!text-[13px] sm:[&_textarea]:!text-[13px] max-sm:[&_input]:!min-h-11 max-sm:[&_.ant-picker]:!min-h-[2.75rem]">
              <div className="min-w-0">
                <InputField
                  label="Invoice prefix"
                  value={isQuotation ? QUOTATION_INVOICE_PREFIX : invoicePrefix}
                  readOnly={isQuotation}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  inputClassName={
                    isQuotation
                      ? "!text-[13px] !leading-tight bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                      : "!text-[13px] !leading-tight"
                  }
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Invoice no."
                  value={invoiceNumber}
                  readOnly={
                    isPurchase ||
                    isSales ||
                    isSalesReturn ||
                    isPurchaseReturn
                  }
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onBlur={
                    isQuotation
                      ? (e) => {
                          const raw = String(e.target.value || "").replace(
                            /\D/g,
                            ""
                          );
                          if (!raw) return;
                          const padded = String(parseInt(raw, 10)).padStart(
                            3,
                            "0"
                          );
                          setInvoiceNumber(padded);
                          setInvoicePrefix(QUOTATION_INVOICE_PREFIX);
                        }
                      : undefined
                  }
                  placeholder={isQuotation ? "001" : undefined}
                  inputMode={isQuotation ? "numeric" : undefined}
                  inputClassName={
                    isPurchase ||
                    isSales ||
                    isSalesReturn ||
                    isPurchaseReturn
                      ? "!text-[13px] !leading-tight bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-600"
                      : "!text-[13px] !leading-tight"
                  }
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <DateInput
                  label="Purchase inv. date"
                  value={purchaseDate}
                  name="purchaseDate"
                  onChange={handleDateChange}
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Voucher ref."
                  value={voucherNo}
                  readOnly
                  inputClassName="!text-[13px] !leading-tight bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Original inv no."
                  value={originalInvNo}
                  onChange={(e) => setOriginalInvNo(e.target.value)}
                  placeholder="Optional"
                  inputClassName="!text-[13px] !leading-tight"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="E-Way bill no."
                  value={ewayBill}
                  onChange={(e) => setEwayBill(e.target.value)}
                  placeholder="Optional"
                  inputClassName="!text-[13px] !leading-tight"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white shadow-md shadow-slate-900/5 ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:from-slate-950 dark:to-slate-900 dark:shadow-black/30 dark:ring-white/5">
            <p className="border-b border-slate-100 px-2 py-2 text-center text-[10px] leading-snug text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 sm:hidden">
              Swipe horizontally to reach every column on small screens.
            </p>
            <div className="overflow-x-auto overscroll-x-auto [-webkit-overflow-scrolling:touch] touch-pan-x">
              <table className="w-full min-w-[1180px] table-fixed border-collapse text-[11px] sm:min-w-[1312px] sm:text-[13px]">
                <thead className="border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className={`${thC} w-10`}>No</th>
                    <th className={`${th} w-52`}>Item</th>
                    <th className={`${thC} w-28`}>HSN</th>
                    <th className={`${thC} w-28`}>Batch</th>
                    <th className={`${thC} w-[9.5rem]`}>Exp.</th>
                    <th className={`${thC} w-[9.5rem]`}>Mfg</th>
                    <th className={`${thC} w-24`}>MRP</th>
                    <th className={`${thC} w-20`}>Qty</th>
                    <th className={`${thC} w-28`}>Price (₹)</th>
                    <th className={`${thC} w-20`}>Disc %</th>
                    <th className={`${thC} w-24`}>Disc ₹</th>
                    <th className={`${thC} w-20`}>Tax</th>
                    <th className={`${thC} w-28`}>Amt (₹)</th>
                    <th className={`${th} w-56`}>Description</th>
                    <th className={`${thC} w-11`} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, idx) => {
                    const m = rowMoney(row, gstRate);
                    return (
                      <tr
                        key={row.id}
                        className="group border-b border-slate-100/90 transition-colors hover:bg-slate-50/70 dark:border-slate-800/80 dark:hover:bg-slate-800/25"
                      >
                        <td className="px-2 py-1.5 text-center text-[10px] font-medium tabular-nums text-slate-400 sm:px-3 sm:py-2.5 sm:text-xs dark:text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="min-w-0 max-w-52 px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <div className="w-full min-w-0 max-w-full">
                            <CommonDropdown
                              formCompact
                              hideAdd
                              searchable
                              menuPlacement="top"
                              searchPlaceholder="Search item…"
                              options={dropdownOptions.products}
                              value={row.product}
                              onChange={(v) => updateProductRow(row.id, "product", v)}
                              placeholder="Select item"
                              className="w-full min-w-0 max-sm:[&_button]:!h-8 max-sm:[&_button]:!min-h-8 max-sm:[&_button]:!max-h-8 max-sm:[&_button]:!px-2 max-sm:[&_button]:!py-1 max-sm:[&_button>span]:!text-[11px]"
                            />
                          </div>
                        </td>
                        <td className="px-1.5 py-1 align-middle text-center sm:px-2 sm:py-2">
                          <input
                            className={cellTable}
                            value={row.hsn}
                            onChange={(e) =>
                              updateProductRow(row.id, "hsn", e.target.value)
                            }
                            placeholder="—"
                            inputMode="numeric"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle text-center sm:px-2 sm:py-2">
                          <input
                            className={cellTable}
                            value={row.batch}
                            onChange={(e) =>
                              updateProductRow(row.id, "batch", e.target.value)
                            }
                            placeholder="—"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            type="date"
                            className={`${cellTable} min-w-0 max-w-full`}
                            value={row.expDate}
                            onChange={(e) =>
                              updateProductRow(row.id, "expDate", e.target.value)
                            }
                            title="Expiry date"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            type="date"
                            className={`${cellTable} min-w-0 max-w-full`}
                            value={row.mfgDate}
                            onChange={(e) =>
                              updateProductRow(row.id, "mfgDate", e.target.value)
                            }
                            title="Manufacturing date"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            className={cellNum}
                            value={row.mrp}
                            onChange={(e) =>
                              updateProductRow(row.id, "mrp", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            className={cellNum}
                            value={row.qty}
                            onChange={(e) =>
                              updateProductRow(row.id, "qty", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            className={cellNum}
                            value={row.rate}
                            onChange={(e) =>
                              updateProductRow(row.id, "rate", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            className={cellNum}
                            placeholder="%"
                            title="Discount percent of line value"
                            value={row.discountPct}
                            onChange={(e) =>
                              updateProductRow(row.id, "discountPct", e.target.value)
                            }
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <input
                            className={`${cellNum}${
                              parseNum(row.discountPct) > 0 &&
                              !row.discountAmtManual
                                ? " bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                                : ""
                            }`}
                            placeholder="₹"
                            title={
                              parseNum(row.discountPct) > 0
                                ? "Auto from Disc % — edit to use a fixed ₹ amount instead"
                                : "Discount amount (or enter Disc % first)"
                            }
                            value={row.discountAmt}
                            onChange={(e) =>
                              updateProductRow(row.id, "discountAmt", e.target.value)
                            }
                            inputMode="decimal"
                          />
                        </td>
                        <td className="bg-slate-50/70 px-1 py-1.5 text-center text-[10px] tabular-nums text-slate-700 sm:px-1.5 sm:py-2 sm:text-xs dark:bg-slate-800/40 dark:text-slate-200">
                          {m.gstPct ? (
                            <span className="inline-block w-full max-w-full leading-tight">
                              {fmtInr(m.tax)}
                              <span className="block text-[9px] font-medium text-slate-500 max-sm:leading-tight dark:text-slate-400 sm:text-[10px]">
                                ({m.gstPct}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="bg-slate-50/70 px-1.5 py-1.5 text-center text-xs font-semibold tabular-nums text-slate-900 sm:px-2 sm:py-2 sm:text-sm dark:bg-slate-800/40 dark:text-slate-50">
                          {fmtInr(m.amount)}
                        </td>
                        <td className="min-w-0 max-w-56 px-1.5 py-1 align-middle sm:px-2 sm:py-2">
                          <textarea
                            rows={1}
                            placeholder="Optional note"
                            value={row.description}
                            onChange={(e) =>
                              updateProductRow(row.id, "description", e.target.value)
                            }
                            className={`${cellTable} box-border h-8 min-h-8 max-h-8 w-full min-w-0 resize-none overflow-y-auto text-left sm:h-10 sm:min-h-10 sm:max-h-10`}
                          />
                        </td>
                        <td className="px-0.5 py-1 text-center align-middle sm:px-1 sm:py-2">
                          <button
                            type="button"
                            disabled={productRows.length === 1}
                            onClick={() => removeProductRow(row.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-35 max-sm:h-7 max-sm:w-7 dark:hover:bg-red-950/50 dark:hover:text-red-400 sm:h-9 sm:w-9 sm:rounded-lg"
                            title="Remove line"
                          >
                            <Trash2 className="h-[15px] w-[15px] sm:h-[17px] sm:w-[17px]" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-100/95 text-xs font-semibold dark:border-slate-600 dark:bg-slate-800 sm:text-sm">
                    <td
                      colSpan={7}
                      className="px-2 py-2 text-right text-slate-700 sm:px-4 sm:py-3 dark:text-slate-300"
                    >
                      Totals
                    </td>
                    <td className="w-20 whitespace-nowrap px-1.5 py-2 text-center align-middle text-[11px] tabular-nums text-slate-700 sm:px-2 sm:py-3 sm:text-sm dark:text-slate-300">
                      <span className="font-normal">Qty : </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {lineQty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-center tabular-nums text-slate-500 sm:px-2 sm:py-3 dark:text-slate-500" />
                    <td className="px-1.5 py-2 text-center tabular-nums text-slate-500 sm:px-2 sm:py-3 dark:text-slate-500" />
                    <td className="px-1.5 py-2 text-center tabular-nums text-slate-500 sm:px-2 sm:py-3 dark:text-slate-500" />
                    <td className="px-1.5 py-2 text-center text-[11px] tabular-nums text-primary sm:px-2 sm:py-3 sm:text-sm dark:text-emerald-300">
                      {fmtInr(totalTax)}
                    </td>
                    <td className="px-1.5 py-2 text-center text-xs tabular-nums text-slate-900 sm:px-2 sm:py-3 sm:text-base dark:text-slate-50">
                      {fmtInr(rawGrand)}
                    </td>
                    <td className="px-1.5 py-2 dark:bg-slate-800 sm:px-2 sm:py-3" />
                    <td className="px-1.5 py-2 dark:bg-slate-800 sm:px-2 sm:py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-2.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={addProductRow}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-primary/40 bg-emerald-50/70 px-3 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-primary hover:bg-emerald-50 active:scale-[0.99] dark:border-primary/50 dark:bg-primary/10 dark:text-emerald-100 dark:hover:bg-primary/15 sm:min-h-11 sm:w-56 sm:flex-none sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
              >
                <Plus strokeWidth={2.25} className="h-4 w-4 shrink-0 text-primary sm:h-[19px] sm:w-[19px] dark:text-emerald-400" />
                Add item
              </button>
              <button
                type="button"
                onClick={() =>
                  toast("Connect a barcode scanner or use the device camera to scan.")
                }
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-primary/35 hover:bg-emerald-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary/40 dark:hover:bg-primary/10 sm:min-h-11 sm:w-56 sm:flex-none sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
              >
                <ScanLine strokeWidth={2} className="h-4 w-4 shrink-0 sm:h-[19px] sm:w-[19px]" />
                Scan barcode
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.06] sm:gap-4 sm:p-5">
              <button
                type="button"
                onClick={() => setNotesOpen((o) => !o)}
                className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {notesOpen ? (
                  <>
                    <ChevronUp size={16} />
                    Hide notes
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Add notes
                  </>
                )}
              </button>
              {notesOpen ? (
                <InputField
                  label="Internal notes (optional)"
                  multiline
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  inputClassName="text-sm max-sm:!text-[15px]"
                />
              ) : null}

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Bill to address
                </label>
                <textarea
                  rows={4}
                  value={billTo}
                  onChange={(e) => setBillTo(e.target.value)}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:py-2.5 sm:text-sm"
                  placeholder="Billing address — printed on documents."
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Voucher narration{" "}
                  <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Short description for this voucher — included when you share, print, or export."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Terms &amp; conditions{" "}
                    <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                      (optional)
                    </span>
                  </label>
                  {termsText.trim() ? (
                    <button
                      type="button"
                      onClick={() => setTermsText("")}
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <textarea
                  rows={5}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  placeholder="Leave blank if not needed. When filled, this text can appear on printed / shared purchase documents."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:py-2.5 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <aside className="rounded-2xl border border-primary/20 bg-gradient-to-b from-emerald-50/70 via-white to-slate-50/40 p-3.5 shadow-[0_8px_30px_-12px_rgba(5,150,105,0.12)] ring-1 ring-primary/10 dark:border-primary/25 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:ring-primary/15 sm:p-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-primary dark:text-emerald-400">
                Summary
              </p>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CommonDropdown
                  searchable
                  searchPlaceholder="Search rate…"
                  label="GST on invoice"
                  options={dropdownOptions.gst}
                  value={gstRate}
                  onChange={setGstRate}
                  placeholder="GST %"
                  closeOnAdd={false}
                  renderAddModal={renderGstAddModal}
                  className="min-w-0"
                />
                <CommonDropdown
                  searchable
                  searchPlaceholder="Search terms…"
                  label="Terms"
                  options={dropdownOptions.terms}
                  value={termsPayment}
                  onChange={setTermsPayment}
                  placeholder="Payment term"
                  closeOnAdd={false}
                  renderAddModal={renderTermsAddModal}
                  className="min-w-0"
                />
              </div>
              <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40">
                <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                  <span>Taxable amount</span>
                  <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {fmtInr(lineTotals.taxable)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                  <span>
                    SGST{halfRate ? ` @${halfRate}%` : ""}
                  </span>
                  <span className="tabular-nums">{fmtInr(totalSgst)}</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-400">
                  <span>
                    CGST{halfRate ? ` @${halfRate}%` : ""}
                  </span>
                  <span className="tabular-nums">{fmtInr(totalCgst)}</span>
                </div>
                <label className="flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary accent-primary"
                    checked={roundOff}
                    onChange={(e) => setRoundOff(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                      Auto round off
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                      Snap the invoice total to the nearest whole rupee.
                    </span>
                  </span>
                </label>
                {roundOff && Math.abs(roundDelta) > 0.0001 ? (
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Rounding adjustment</span>
                    <span className="tabular-nums">
                      {roundDelta >= 0 ? "+" : ""}
                      {fmtInr(roundDelta)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Total
                  </span>
                  <span className="text-xl font-bold tabular-nums text-primary dark:text-emerald-300">
                    {fmtInr(displayGrand)}
                  </span>
                </div>
              </div>
            </aside>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.06] sm:p-4">
              <button
                type="button"
                onClick={() => setMoreDetailsOpen((o) => !o)}
                className="flex w-full flex-wrap items-center gap-0 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-[13px] font-semibold leading-snug text-primary shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 sm:inline-flex sm:w-fit sm:flex-nowrap sm:gap-1.5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:shadow-none sm:hover:bg-transparent"
              >
                {/* Mobile: single short line + chevron on the right */}
                <span className="flex min-h-0 min-w-0 flex-1 items-center justify-between gap-2 sm:hidden">
                  <span className="min-w-0 leading-snug">
                    {moreDetailsOpen ? "Hide extra options" : "Delivery, stock & more"}
                  </span>
                  {moreDetailsOpen ? (
                    <ChevronUp size={18} className="shrink-0 opacity-90" strokeWidth={2} />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 opacity-90" strokeWidth={2} />
                  )}
                </span>
                {/* Desktop: icon first, full label */}
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  {moreDetailsOpen ? (
                    <>
                      <ChevronUp size={16} className="shrink-0" strokeWidth={2} />
                      Hide — delivery, pricing &amp; stock options
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="shrink-0" strokeWidth={2} />
                      More — delivery, pricing &amp; stock options
                    </>
                  )}
                </span>
              </button>

              {moreDetailsOpen ? (
                <>
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Delivery
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <CommonDropdown
                        searchable
                        searchPlaceholder="Search…"
                        label="Transporter"
                        options={dropdownOptions.transporters}
                        value={transporter}
                        onChange={setTransporter}
                        placeholder="Select"
                        addNavigateTo="/dashboard/account"
                      />
                      <CommonDropdown
                        searchable
                        searchPlaceholder="Search…"
                        label="Delivery at"
                        options={dropdownOptions.locations}
                        value={deliveryAt}
                        onChange={setDeliveryAt}
                        placeholder="Select"
                        addNavigateTo="/dashboard/stock"
                      />
                      <CommonDropdown
                        searchable
                        searchPlaceholder="Search…"
                        label="Order by"
                        options={dropdownOptions.employees}
                        value={orderBy}
                        onChange={setOrderBy}
                        placeholder="Select"
                        addNavigateTo="/dashboard/hrm/employees"
                      />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Stock
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary accent-primary"
                        checked={stockToggle}
                        onChange={(e) => setStockToggle(e.target.checked)}
                      />
                      {stockToggleLabel}
                    </label>
                  </div>
                </>
              ) : null}
            </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
