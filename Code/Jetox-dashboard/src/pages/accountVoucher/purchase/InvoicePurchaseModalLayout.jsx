import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  FileSpreadsheet,
  Keyboard,
  Plus,
  Printer,
  ScanLine,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
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

const cell =
  "w-full min-w-0 rounded-md border border-slate-200/90 bg-white px-2 py-1.5 text-[12px] text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const thBase =
  "sticky top-0 z-[1] border-b border-slate-200 bg-slate-100/95 px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-300";
const th = `${thBase} text-left`;
const thC = `${thBase} text-center`;
const thR = `${thBase} text-right`;

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

  const totalTax = lineTotals.tax;
  const totalSgst = totalTax / 2;
  const totalCgst = totalTax / 2;

  const rawGrand = lineGrand;
  const displayGrand = Math.round(rawGrand);
  const roundDelta = roundOff ? displayGrand - rawGrand : 0;

  return (
    <div className="flex min-h-0 flex-col bg-[#eceaf3] dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 sm:px-4">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-slate-600 dark:text-slate-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
              aria-label="Close and go back"
            >
              <ArrowLeft size={19} strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                Create Purchase Invoice
              </h2>
              <p className="mt-0.5 hidden text-[11px] text-slate-500 sm:block dark:text-slate-400">
                Purchase date and line totals update as you edit below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {clock ? (
              <time
                dateTime={liveNow?.toISOString?.()}
                className="order-first w-full text-center text-[11px] font-medium tabular-nums text-slate-500 sm:order-none sm:w-auto sm:text-right sm:text-xs dark:text-slate-400"
              >
                {clock}
              </time>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                title="Keyboard shortcuts (coming soon)"
                aria-label="Keyboard shortcuts"
                onClick={() =>
                  toast("Shortcuts: Ctrl+S save — full shortcut map coming soon.")
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Keyboard size={18} />
              </button>
              <button
                type="button"
                title="Invoice settings"
                aria-label="Settings"
                onClick={() => toast("Invoice settings will open here.")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Settings size={18} />
              </button>
              <div ref={shareWrapRef} className="relative">
                <button
                  type="button"
                  title="Share or export voucher"
                  aria-expanded={shareOpen}
                  aria-haspopup="menu"
                  onClick={() => setShareOpen((o) => !o)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-900 dark:text-violet-200 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
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
                      <Copy size={16} className="shrink-0 text-violet-600" />
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
                        className="shrink-0 text-violet-600"
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
                      <Printer size={16} className="shrink-0 text-violet-600" />
                      Print bill (PDF)
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-600" aria-hidden />
              <Button
                type="button"
                label="Save & New"
                variant="outline"
                size="sm"
                className="min-h-10 border-violet-300 px-3 font-semibold text-violet-800 shadow-sm hover:bg-violet-50 dark:border-violet-600 dark:text-violet-200 dark:hover:bg-violet-950/60"
                onClick={() => onSave("new")}
              />
              <Button
                type="button"
                label="Save"
                variant="primary"
                size="sm"
                className="min-h-10 min-w-[5.5rem] bg-violet-700 px-5 font-semibold text-white shadow-md hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500"
                onClick={() => onSave("close")}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02] transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Bill from
                </span>
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                  Change party
                </span>
              </div>
              <CommonDropdown
                hideAdd
                options={dropdownOptions.parties}
                value={partyName}
                onChange={setPartyName}
                placeholder="Search or select party"
                className="w-full"
              />
              <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                {partyLabel}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Phone on file will appear when linked in Account master.
              </p>
              {partyHint ? (
                <div
                  role="status"
                  className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[11px] font-medium leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {partyHint}
                </div>
              ) : null}
            </div>

            <div
              className={`rounded-2xl border bg-white p-4 shadow-sm ring-1 transition-all dark:bg-slate-900 sm:p-5 ${
                shipDifferent
                  ? "border-violet-200 ring-violet-500/10 dark:border-violet-800 dark:ring-violet-500/20"
                  : "border-slate-200/90 ring-slate-900/[0.02] dark:border-slate-700 dark:ring-white/5"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Ship from
                </span>
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                  Change shipping
                </span>
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {partyLabel}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Same as billing unless you specify below.
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-1 hover:border-slate-100 dark:hover:border-slate-800">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 accent-violet-600 focus:ring-violet-500"
                  checked={shipDifferent}
                  onChange={(e) => setShipDifferent(e.target.checked)}
                />
                <span className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                  Different ship address
                </span>
              </label>
              {shipDifferent ? (
                <div className="mt-3">
                  <InputField
                    label="Ship to"
                    multiline
                    rows={3}
                    value={shipTo}
                    onChange={(e) => setShipTo(e.target.value)}
                    inputClassName="text-sm min-h-[4.5rem]"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Invoice details
            </h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="min-w-0">
                <InputField
                  label="Invoice prefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  inputClassName="text-sm"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Invoice no."
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  inputClassName="text-sm"
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
                  inputClassName="text-sm bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="Original inv no."
                  value={originalInvNo}
                  onChange={(e) => setOriginalInvNo(e.target.value)}
                  inputClassName="text-sm"
                  placeholder="Optional"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  label="E-Way bill no."
                  value={ewayBill}
                  onChange={(e) => setEwayBill(e.target.value)}
                  inputClassName="text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={`${thC} w-10`}>No</th>
                    <th className={`${th} min-w-[160px]`}>Items</th>
                    <th className={`${thC} w-[4.5rem]`}>HSN</th>
                    <th className={`${thC} w-24`}>Batch</th>
                    <th className={`${th} w-32`}>Exp.</th>
                    <th className={`${th} w-32`}>Mfg</th>
                    <th className={`${thR} w-24`}>MRP</th>
                    <th className={`${thR} w-20`}>Qty</th>
                    <th className={`${thR} w-28`}>Price (₹)</th>
                    <th className={`${thR} w-[5.5rem]`}>Disc %</th>
                    <th className={`${thR} w-[5.5rem]`}>Disc ₹</th>
                    <th className={`${thR} min-w-[5.5rem]`}>Tax</th>
                    <th className={`${thR} w-28`}>Amt (₹)</th>
                    <th className={`${thC} w-12`} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, idx) => {
                    const m = rowMoney(row, gstRate);
                    return (
                      <tr
                        key={row.id}
                        className="group border-b border-slate-100 transition-colors hover:bg-violet-50/[0.45] dark:border-slate-800/80 dark:hover:bg-violet-950/20"
                      >
                        <td className="px-2 py-2.5 text-center text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <CommonDropdown
                            hideAdd
                            options={dropdownOptions.products}
                            value={row.product}
                            onChange={(v) => updateProductRow(row.id, "product", v)}
                            placeholder="Select item"
                            className="text-xs"
                          />
                          <textarea
                            rows={2}
                            placeholder="Description (optional)"
                            value={row.description}
                            onChange={(e) =>
                              updateProductRow(row.id, "description", e.target.value)
                            }
                            className={`${cell} mt-1.5 min-h-[2.75rem] max-h-24 resize-y text-[12px]`}
                          />
                        </td>
                        <td className="px-2 py-2 align-top text-center">
                          <input
                            className={`${cell} text-center`}
                            value={row.hsn}
                            onChange={(e) =>
                              updateProductRow(row.id, "hsn", e.target.value)
                            }
                            placeholder="—"
                            inputMode="numeric"
                          />
                        </td>
                        <td className="px-2 py-2 align-top text-center">
                          <input
                            className={`${cell} text-center`}
                            value={row.batch}
                            onChange={(e) =>
                              updateProductRow(row.id, "batch", e.target.value)
                            }
                            placeholder="—"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            type="date"
                            className={cell}
                            value={row.expDate}
                            onChange={(e) =>
                              updateProductRow(row.id, "expDate", e.target.value)
                            }
                            title="Expiry date"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            type="date"
                            className={cell}
                            value={row.mfgDate}
                            onChange={(e) =>
                              updateProductRow(row.id, "mfgDate", e.target.value)
                            }
                            title="Manufacturing date"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            className={`${cell} text-right tabular-nums`}
                            value={row.mrp}
                            onChange={(e) =>
                              updateProductRow(row.id, "mrp", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            className={`${cell} text-right tabular-nums`}
                            value={row.qty}
                            onChange={(e) =>
                              updateProductRow(row.id, "qty", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            className={`${cell} text-right tabular-nums`}
                            value={row.rate}
                            onChange={(e) =>
                              updateProductRow(row.id, "rate", e.target.value)
                            }
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            className={`${cell} text-right tabular-nums`}
                            placeholder="%"
                            title="Discount percent of line value"
                            value={row.discountPct}
                            onChange={(e) =>
                              updateProductRow(row.id, "discountPct", e.target.value)
                            }
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input
                            className={`${cell} text-right tabular-nums`}
                            placeholder="₹"
                            title="Discount amount (takes precedence over % if set)"
                            value={row.discountAmt}
                            onChange={(e) =>
                              updateProductRow(row.id, "discountAmt", e.target.value)
                            }
                            inputMode="decimal"
                          />
                        </td>
                        <td className="px-2 py-2 text-right text-xs tabular-nums text-slate-700 dark:text-slate-200">
                          {m.gstPct ? (
                            <span className="inline-block max-w-[6.5rem] leading-tight">
                              {fmtInr(m.tax)}
                              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                ({m.gstPct}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                          {fmtInr(m.amount)}
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
                  <tr className="border-t-2 border-slate-200 bg-slate-50/95 text-sm font-semibold dark:border-slate-600 dark:bg-slate-800/90">
                    <td
                      colSpan={7}
                      className="px-3 py-3 text-right text-slate-600 dark:text-slate-400"
                    >
                      Totals
                      <span className="ml-2 text-xs font-normal tabular-nums text-slate-500 dark:text-slate-500">
                        Qty {lineQty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200" />
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200" />
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200" />
                    <td className="px-2 py-3 text-right tabular-nums text-violet-800 dark:text-violet-300">
                      {fmtInr(totalTax)}
                    </td>
                    <td className="px-2 py-3 text-right text-base tabular-nums text-violet-900 dark:text-violet-200">
                      {fmtInr(rawGrand)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button
                type="button"
                onClick={addProductRow}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 px-4 text-sm font-semibold text-violet-900 shadow-sm transition hover:border-violet-400 hover:bg-violet-100/80 active:scale-[0.99] dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-100 dark:hover:bg-violet-950/50 sm:min-w-[14rem] sm:flex-none"
              >
                <Plus size={19} strokeWidth={2.25} className="shrink-0" />
                Add item
              </button>
              <button
                type="button"
                onClick={() =>
                  toast("Connect a barcode scanner or use the device camera to scan.")
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200/80 bg-white px-4 text-sm font-semibold text-violet-900 shadow-sm transition hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-200 dark:hover:bg-violet-950/40"
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
                className="flex w-fit items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
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
                      className="text-xs font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
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
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <aside className="rounded-2xl border border-violet-100/80 bg-gradient-to-b from-violet-50/60 to-white p-4 shadow-sm ring-1 ring-violet-900/[0.04] dark:border-violet-900/40 dark:from-violet-950/40 dark:to-slate-900 dark:ring-violet-500/10 sm:p-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-900/80 dark:text-violet-300">
                Summary
              </p>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CommonDropdown
                  hideAdd
                  label="GST on invoice"
                  options={dropdownOptions.gst}
                  value={gstRate}
                  onChange={setGstRate}
                  placeholder="GST %"
                  className="min-w-0"
                />
                <CommonDropdown
                  hideAdd
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
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600"
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
                  <span className="text-base font-bold text-violet-950 dark:text-violet-100">
                    Total
                  </span>
                  <span className="text-xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
                    {fmtInr(displayGrand)}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <button
            type="button"
            onClick={() => setMoreDetailsOpen((o) => !o)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-900 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/30 dark:hover:text-violet-200"
          >
            {moreDetailsOpen ? (
              <ChevronUp size={18} className="shrink-0" />
            ) : (
              <ChevronDown size={18} className="shrink-0" />
            )}
            {moreDetailsOpen ? "Hide" : "More"} — delivery, pricing &amp; stock options
          </button>

          {moreDetailsOpen ? (
            <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
              <Card title="Delivery">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <CommonDropdown
                    label="Transporter"
                    options={dropdownOptions.transporters}
                    value={transporter}
                    onChange={setTransporter}
                    placeholder="Select"
                    addNavigateTo="/dashboard/account"
                  />
                  <CommonDropdown
                    label="Delivery at"
                    options={dropdownOptions.locations}
                    value={deliveryAt}
                    onChange={setDeliveryAt}
                    placeholder="Select"
                    addNavigateTo="/dashboard/stock"
                  />
                  <CommonDropdown
                    label="Order by"
                    options={dropdownOptions.employees}
                    value={orderBy}
                    onChange={setOrderBy}
                    placeholder="Select"
                    addNavigateTo="/dashboard/hrm/employees"
                  />
                </div>
              </Card>
              <Card title="Stock">
                <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 accent-violet-600"
                    checked={stockToggle}
                    onChange={(e) => setStockToggle(e.target.checked)}
                  />
                  Update stock when this voucher is saved
                </label>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
