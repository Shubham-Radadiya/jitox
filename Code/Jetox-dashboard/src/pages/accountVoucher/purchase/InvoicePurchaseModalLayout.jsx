import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { fmtInr, parseNum } from "./voucherFormConstants";
import {
  buildPurchasePayloadShareText,
  downloadPurchasePayloadCsv,
  printPurchasePayloadBill,
  shareOrCopyText,
} from "../../../utils/voucherShare";

/** Line-items grid — flat fields; centered text so placeholders align (not hugging one edge) */
const cellTable =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[13px] leading-tight text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/25";
/** Numeric line cells — centered like placeholders; tabular nums for digits */
const cellNum = `${cellTable} tabular-nums`;
const thBase =
  "sticky top-0 z-[1] bg-slate-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400";
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
  dropdownOptions,
  liveNow,
  onClose,
  onSave,
  partyLabel,
  partyName,
  setPartyName,
  partyHint,
  billTo,
  setBillTo,
  shipDifferent,
  setShipDifferent,
  shipTo,
  setShipTo,
  purchaseDate,
  handleDateChange,
  invoicePrefix,
  setInvoicePrefix,
  invoiceNumber,
  setInvoiceNumber,
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
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [roundOff, setRoundOff] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareWrapRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return undefined;
    const onDoc = (e) => {
      const el = shareWrapRef.current;
      if (el && !el.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [shareOpen]);

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

  const shipSummaryPrimary =
    shipDifferent && String(shipTo || "").trim()
      ? String(shipTo).trim()
      : partyLabel;

  const totalTax = lineTotals.tax;
  const totalSgst = totalTax / 2;
  const totalCgst = totalTax / 2;

  const rawGrand = lineGrand;
  const displayGrand = Math.round(rawGrand);
  const roundDelta = roundOff ? displayGrand - rawGrand : 0;

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
                Purchase invoice
              </p>
              <h2 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                Create Purchase Invoice
              </h2>
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
                {shareOpen ? (
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
                          `Purchase ${snap.voucherNo || ""}`,
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
                      onClick={() => {
                        setShareOpen(false);
                        const snap =
                          typeof getShareSnapshot === "function"
                            ? getShareSnapshot()
                            : null;
                        if (!snap) {
                          toast.error("Nothing to print yet.");
                          return;
                        }
                        const ok = printPurchasePayloadBill(snap);
                        if (ok) {
                          toast.success(
                            "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
                          );
                        } else {
                          toast.error("Allow downloads in your browser to save the bill.");
                        }
                      }}
                    >
                      <Printer size={16} className="shrink-0 text-primary" />
                      Print bill (PDF)
                    </button>
                  </div>
                ) : null}
              </div>
              </div>
              <div
                className="hidden h-6 w-px shrink-0 bg-slate-200 sm:block dark:bg-slate-600"
                aria-hidden
              />
              <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-2">
              <Button
                type="button"
                label="Save & New"
                variant="outline"
                size="sm"
                className="min-h-11 w-full justify-center border-primary/35 px-2 font-semibold text-primary shadow-sm hover:bg-emerald-50 sm:min-h-10 sm:w-auto sm:px-3 dark:border-primary/45 dark:text-emerald-300 dark:hover:bg-primary/15"
                onClick={() => onSave("new")}
              />
              <Button
                type="button"
                label="Save"
                variant="primary"
                size="sm"
                className="min-h-11 w-full justify-center bg-primary px-3 font-semibold text-white shadow-md hover:bg-primary/90 sm:min-h-10 sm:min-w-[5.5rem] sm:w-auto sm:px-5 dark:bg-primary dark:hover:bg-primary/85"
                onClick={() => onSave("close")}
              />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[1200px] flex flex-col">
          <div className="-mx-3 flex flex-col gap-5 sm:-mx-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.02] transition-shadow hover:shadow-md hover:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 sm:p-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-primary dark:text-emerald-400" aria-hidden />
                  Bill from
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
                onChange={setPartyName}
                placeholder="Search or select party"
                className="w-full"
              />
              <div className="mt-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/35">
                <p className="text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-50">
                  {partyLabel}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  Phone on file when linked in Account master.
                </p>
              </div>
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
              className={`flex h-full min-h-0 flex-col rounded-2xl border bg-white p-3 shadow-sm ring-1 transition-all dark:bg-slate-900 sm:p-4 ${
                shipDifferent
                  ? "border-primary/35 ring-primary/15 dark:border-primary/40 dark:ring-primary/25"
                  : "border-slate-200/90 ring-slate-900/[0.02] dark:border-slate-700 dark:ring-white/5"
              }`}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                  Ship from
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-primary dark:text-emerald-400">
                  Change shipping
                </span>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/35">
                <p className="whitespace-pre-wrap text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-50">
                  {shipSummaryPrimary}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  {shipDifferent
                    ? "Edit ship-to below if needed."
                    : "Same as billing unless different ship address."}
                </p>
              </div>
              <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-0 py-0.5 hover:border-slate-100 dark:hover:border-slate-800">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary accent-primary focus:ring-primary"
                  checked={shipDifferent}
                  onChange={(e) => setShipDifferent(e.target.checked)}
                />
                <span className="text-[12px] font-medium leading-snug text-slate-700 dark:text-slate-300">
                  Different ship address
                </span>
              </label>
              {shipDifferent ? (
                <div className="mt-2">
                  <InputField
                    label="Ship to"
                    multiline
                    rows={2}
                    value={shipTo}
                    onChange={(e) => setShipTo(e.target.value)}
                    inputClassName="!text-[13px] min-h-[3.25rem]"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 sm:p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <Receipt
                className="h-4 w-4 shrink-0 text-primary dark:text-emerald-400"
                strokeWidth={2}
                aria-hidden
              />
              Invoice details
            </h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 [&_input]:!text-[13px] [&_input]:!leading-tight [&_textarea]:!text-[13px] [&_textarea]:!leading-tight">
              <div className="min-w-0">
                <InputField
                  label="Invoice prefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  inputClassName="!text-[13px] !leading-tight"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Invoice no."
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  inputClassName="!text-[13px] !leading-tight"
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1312px] table-fixed border-collapse text-[13px]">
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
                        <td className="px-3 py-2.5 text-center text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="min-w-0 max-w-52 px-2 py-2 align-middle">
                          <div className="w-full min-w-0 max-w-full">
                            <CommonDropdown
                              hideAdd
                              searchable
                              searchPlaceholder="Search item…"
                              options={dropdownOptions.products}
                              value={row.product}
                              onChange={(v) => updateProductRow(row.id, "product", v)}
                              placeholder="Select item"
                              className="w-full min-w-0 text-[13px]"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
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
                        <td className="px-2 py-2 align-middle text-center">
                          <input
                            className={cellTable}
                            value={row.batch}
                            onChange={(e) =>
                              updateProductRow(row.id, "batch", e.target.value)
                            }
                            placeholder="—"
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
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
                        <td className="px-2 py-2 align-middle">
                          <input
                            className={cellNum}
                            placeholder="₹"
                            title="Discount amount (takes precedence over % if set)"
                            value={row.discountAmt}
                            onChange={(e) =>
                              updateProductRow(row.id, "discountAmt", e.target.value)
                            }
                            inputMode="decimal"
                          />
                        </td>
                        <td className="bg-slate-50/70 px-1.5 py-2 text-center text-xs tabular-nums text-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                          {m.gstPct ? (
                            <span className="inline-block w-full max-w-full leading-tight">
                              {fmtInr(m.tax)}
                              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                ({m.gstPct}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="bg-slate-50/70 px-2 py-2 text-center text-sm font-semibold tabular-nums text-slate-900 dark:bg-slate-800/40 dark:text-slate-50">
                          {fmtInr(m.amount)}
                        </td>
                        <td className="min-w-0 max-w-56 px-2 py-2 align-middle">
                          <textarea
                            rows={1}
                            placeholder="Optional note"
                            value={row.description}
                            onChange={(e) =>
                              updateProductRow(row.id, "description", e.target.value)
                            }
                            className={`${cellTable} box-border h-10 min-h-10 max-h-10 w-full min-w-0 resize-none overflow-y-auto text-left`}
                          />
                        </td>
                        <td className="px-1 py-2 text-center align-middle">
                          <button
                            type="button"
                            disabled={productRows.length === 1}
                            onClick={() => removeProductRow(row.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-35 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                            title="Remove line"
                          >
                            <Trash2 size={17} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-100/95 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800">
                    <td
                      colSpan={7}
                      className="px-4 py-3 text-right text-slate-700 dark:text-slate-300"
                    >
                      Totals
                    </td>
                    <td className="w-20 whitespace-nowrap px-2 py-3 text-center align-middle text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      <span className="font-normal">Qty : </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {lineQty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums text-slate-500 dark:text-slate-500" />
                    <td className="px-2 py-3 text-center tabular-nums text-slate-500 dark:text-slate-500" />
                    <td className="px-2 py-3 text-center tabular-nums text-slate-500 dark:text-slate-500" />
                    <td className="px-2 py-3 text-center tabular-nums text-primary dark:text-emerald-300">
                      {fmtInr(totalTax)}
                    </td>
                    <td className="px-2 py-3 text-center text-base tabular-nums text-slate-900 dark:text-slate-50">
                      {fmtInr(rawGrand)}
                    </td>
                    <td className="px-2 py-3 dark:bg-slate-800" />
                    <td className="px-2 py-3 dark:bg-slate-800" />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-3 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:flex-wrap sm:items-stretch sm:px-6">
              <button
                type="button"
                onClick={addProductRow}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-emerald-50/70 px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary hover:bg-emerald-50 active:scale-[0.99] dark:border-primary/50 dark:bg-primary/10 dark:text-emerald-100 dark:hover:bg-primary/15 sm:min-w-56 sm:flex-none"
              >
                <Plus size={19} strokeWidth={2.25} className="shrink-0 text-primary dark:text-emerald-400" />
                Add item
              </button>
              <button
                type="button"
                onClick={() =>
                  toast("Connect a barcode scanner or use the device camera to scan.")
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/35 hover:bg-emerald-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-primary/40 dark:hover:bg-primary/10"
              >
                <ScanLine size={19} strokeWidth={2} className="shrink-0" />
                Scan barcode
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
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
                  inputClassName="text-sm"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-5">
            <aside className="rounded-2xl border border-primary/20 bg-gradient-to-b from-emerald-50/70 via-white to-slate-50/40 p-4 shadow-[0_8px_30px_-12px_rgba(5,150,105,0.12)] ring-1 ring-primary/10 dark:border-primary/25 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:ring-primary/15 sm:p-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-primary dark:text-emerald-400">
                Summary
              </p>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CommonDropdown
                  hideAdd
                  searchable
                  searchPlaceholder="Search rate…"
                  label="GST on invoice"
                  options={dropdownOptions.gst}
                  value={gstRate}
                  onChange={setGstRate}
                  placeholder="GST %"
                  className="min-w-0"
                />
                <CommonDropdown
                  hideAdd
                  searchable
                  searchPlaceholder="Search terms…"
                  label="Terms"
                  options={dropdownOptions.terms}
                  value={termsPayment}
                  onChange={setTermsPayment}
                  placeholder="Payment term"
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

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
              <button
                type="button"
                onClick={() => setMoreDetailsOpen((o) => !o)}
                className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
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
                      Update stock when this voucher is saved
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
