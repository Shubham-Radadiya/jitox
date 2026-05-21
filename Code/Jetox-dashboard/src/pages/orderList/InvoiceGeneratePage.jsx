import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField, CommonDropdown } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { downloadSalesInvoiceEditorPdf } from "../../utils/salesInvoiceDownload";
import { mergePageAddOutlineButton } from "../../utils/pageAddButton";
import { buildInvoiceReviewPayload } from "../../utils/voucherRowMappers";
import { partyAddressFromMap } from "../../utils/voucherPartyAddress";
import { findAccountByBusinessName } from "../../utils/accountMappers";
import { usePurchaseFormMeta } from "../../hooks/usePurchaseFormMeta";
import { accountsApi } from "../../services/api";
import InvoiceModal from "./InvoiceModal";
import {
  invoiceCompanyFields,
  INVOICE_COMPANY_PROFILE,
} from "../../constants/invoiceCompanyProfile";

function normalizePartyKey(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolvePartyDropdownValue(parties, businessName) {
  const target = normalizePartyKey(businessName);
  if (!target) return "";
  for (const p of parties) {
    const value = String(p?.value ?? "").trim();
    const label = String(p?.label ?? value).trim();
    if (
      normalizePartyKey(value) === target ||
      normalizePartyKey(label) === target
    ) {
      return value;
    }
  }
  return "";
}

const INVOICE_DRAFT_KEY = "jitox_invoice_draft_v1";

/** Avoid Ant Design / preview showing "Invalid Date" when API format varies. */
function parseSafeInvoiceDate(raw) {
  if (raw == null || raw === "") return dayjs();
  const loose = dayjs(raw);
  if (loose.isValid()) return loose;
  const strict = dayjs(raw, ["DD MMM, YYYY", "DD MMM YYYY", "YYYY-MM-DD"], true);
  return strict.isValid() ? strict : dayjs();
}

function formatInvoiceDate(d) {
  if (d && typeof d.isValid === "function" && d.isValid()) return d.format("DD MMM YYYY");
  return "—";
}

/** Muted labels, slightly larger than micro type for readability */
const INVOICE_LABEL_FIELD =
  "!mb-1 !text-xs !font-medium !leading-tight !tracking-wide text-slate-600 dark:!text-slate-400";
const INVOICE_LABEL_STATIC =
  "mb-1 text-left text-xs font-medium leading-tight tracking-wide text-slate-600 dark:text-slate-400";
const INVOICE_INPUT_TEXT =
  "!text-[13px] placeholder:!text-[12px] dark:!text-slate-100 dark:placeholder:!text-slate-500";

const defaultLines = () => [
  { name: "Organic Fertilizer", qty: 50, rate: 400, subtotal: 20000 },
  { name: "Liquid Pesticide", qty: 10, rate: 200, subtotal: 2000 },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Paid", label: "Paid" },
  { value: "Unpaid", label: "Unpaid" },
];

function normalizeInvoicePaymentMode(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "";
  const key = s.toLowerCase();
  const map = {
    credit: "Credit",
    cash: "Cash",
    online: "Online",
    cheque: "Cheque",
    upi: "UPI",
    bank: "Bank",
  };
  return map[key] || s;
}

function normalizeInvoicePaymentStatus(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "Pending";
  const hit = PAYMENT_STATUS_OPTIONS.find(
    (o) => o.value.toLowerCase() === s.toLowerCase()
  );
  return hit?.value || s;
}

function parseInvoicePaidAmount(inv) {
  const raw = inv?.paidAmount;
  if (raw == null || raw === "") return 0;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Full-page invoice editor + preview (JETOX “Invoice Generate” design).
 * Optional `location.state`: { invoice, orderId } from order details.
 */
export default function InvoiceGeneratePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const inv = state?.invoice;

  const initial = useMemo(() => {
    if (inv?.lines?.length) {
      return {
        invoiceNo: inv.invoiceNo || "#AB2324-01",
        issueDate: parseSafeInvoiceDate(inv.invoiceDate),
        client: String(inv.billedTo?.name || "").trim(),
        paymentMode: inv.paymentMode || "UPI",
        reference: inv.reference || "INV-057",
        description: "",
        vatYes: true,
        lines: (inv.lines || []).map((l) => {
          const qtyMatch = String(l.qty || "").match(/[\d.]+/);
          const qty = qtyMatch ? parseFloat(qtyMatch[0]) : 0;
          const rate = parseFloat(String(l.rate || "").replace(/[^\d.]/g, "")) || 0;
          return {
            name: l.detail || l.name || "",
            qty,
            rate,
            subtotal: qty * rate,
          };
        }),
      };
    }
    const lines = defaultLines().map((l) => ({
      ...l,
      subtotal: l.qty * l.rate,
    }));
    return {
      invoiceNo: "#AB2324-01",
      issueDate: dayjs(),
      client: "",
      paymentMode: "",
      paymentStatus: "Pending",
      reference: "INV-057",
      description: "",
      vatYes: true,
      lines,
    };
  }, [inv, state?.paymentStatus]);

  useEffect(() => {
    if (!inv) return;
    const mode = normalizeInvoicePaymentMode(inv.paymentMode);
    if (mode) setPaymentMode(mode);
    setPaymentStatus(
      normalizeInvoicePaymentStatus(
        inv.paymentStatusBadge || state?.paymentStatus
      )
    );
  }, [inv, state?.paymentStatus]);

  const [previewHidden, setPreviewHidden] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState(initial.invoiceNo);
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [client, setClient] = useState(initial.client);
  const [paymentMode, setPaymentMode] = useState(initial.paymentMode);
  const [paymentStatus, setPaymentStatus] = useState(
    initial.paymentStatus || "Pending"
  );
  const [reference, setReference] = useState(initial.reference);
  const [description, setDescription] = useState(initial.description);
  const [vatYes, setVatYes] = useState(initial.vatYes);
  const [lines, setLines] = useState(initial.lines);
  const [dueDate, setDueDate] = useState(() => dayjs().add(15, "day"));
  const [extraClients, setExtraClients] = useState([]);
  const previewRef = useRef(null);
  const autoClientSyncedRef = useRef(false);

  const {
    data: formMeta,
    isLoading: partiesLoading,
    isError: partiesError,
  } = usePurchaseFormMeta({ enabled: true });

  const partyAddresses = formMeta?.partyAddresses || {};
  const prefilledPartyName = useMemo(
    () => String(inv?.billedTo?.name || "").trim(),
    [inv]
  );

  useEffect(() => {
    if (partiesError) {
      toast.error(
        "Could not load clients from Account Master. Check your connection or refresh."
      );
    }
  }, [partiesError]);

  useEffect(() => {
    autoClientSyncedRef.current = false;
  }, [prefilledPartyName]);

  useEffect(() => {
    if (autoClientSyncedRef.current || !prefilledPartyName) return;

    const parties = Array.isArray(formMeta?.parties) ? formMeta.parties : [];
    const fromList = resolvePartyDropdownValue(parties, prefilledPartyName);
    if (fromList) {
      setClient(fromList);
      autoClientSyncedRef.current = true;
      return;
    }
    if (!parties.length) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await accountsApi.getAll({});
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.accounts)
            ? data.accounts
            : Array.isArray(data?.data)
              ? data.data
              : [];
        const acc = findAccountByBusinessName(list, prefilledPartyName);
        const name = String(acc?.businessName || acc?.name || "").trim();
        if (!name || cancelled) return;
        const resolved = resolvePartyDropdownValue(parties, name) || name;
        setClient(resolved);
        autoClientSyncedRef.current = true;
      } catch {
        if (!cancelled) setClient(prefilledPartyName);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prefilledPartyName, formMeta?.parties]);

  const clientOptions = useMemo(() => {
    const byValue = new Map();
    for (const p of Array.isArray(formMeta?.parties) ? formMeta.parties : []) {
      const value = String(p?.value ?? "").trim();
      if (!value) continue;
      byValue.set(value, {
        value,
        label: String(p?.label ?? value).trim() || value,
      });
    }
    for (const p of extraClients) {
      const value = String(p?.value ?? "").trim();
      if (!value) continue;
      byValue.set(value, {
        value,
        label: String(p?.label ?? value).trim() || value,
      });
    }
    const current = String(client || "").trim();
    if (current && !byValue.has(current)) {
      byValue.set(current, { value: current, label: current });
    }
    return Array.from(byValue.values());
  }, [formMeta?.parties, extraClients, client]);

  const selectedClientAddress = useMemo(() => {
    const fromMaster = partyAddressFromMap(partyAddresses, client);
    if (fromMaster) return fromMaster;
    return String(inv?.billedTo?.address || "").trim();
  }, [partyAddresses, client, inv]);

  const paymentModeOptions = useMemo(() => {
    const byValue = new Map();
    for (const t of Array.isArray(formMeta?.terms) ? formMeta.terms : []) {
      const value = String(t?.value ?? "").trim();
      if (!value) continue;
      byValue.set(value, {
        value,
        label: String(t?.label ?? value).trim() || value,
      });
    }
    const defaults = [
      { value: "Credit", label: "Credit" },
      { value: "Cash", label: "Cash" },
      { value: "Online", label: "Online" },
      { value: "Cheque", label: "Cheque" },
      { value: "UPI", label: "UPI" },
      { value: "Bank", label: "Bank" },
    ];
    for (const o of defaults) {
      if (!byValue.has(o.value)) byValue.set(o.value, o);
    }
    const current = normalizeInvoicePaymentMode(paymentMode);
    if (current && !byValue.has(current)) {
      byValue.set(current, { value: current, label: current });
    }
    return Array.from(byValue.values());
  }, [formMeta?.terms, paymentMode]);

  const recalcLine = (row, idx) => {
    const qty = Number(row.qty) || 0;
    const rate = Number(row.rate) || 0;
    const next = [...lines];
    next[idx] = { ...row, qty, rate, subtotal: qty * rate };
    setLines(next);
  };

  const subtotal = lines.reduce((s, l) => s + (l.subtotal || 0), 0);
  const taxPct = 10;
  const tax = vatYes ? Math.round(subtotal * (taxPct / 100)) : 0;
  const discount = 500;
  const finalPayable = subtotal + tax - discount;
  const orderId = state?.orderId || reference || "";
  const company = useMemo(() => invoiceCompanyFields(), []);

  const reviewInvoice = useMemo(
    () =>
      buildInvoiceReviewPayload({
        invoiceNo,
        issueDateLabel: formatInvoiceDate(issueDate),
        client,
        clientAddress: selectedClientAddress,
        paymentMode,
        reference,
        orderId,
        lines,
        subtotalNum: subtotal,
        taxNum: tax,
        taxPctLabel: vatYes ? `${taxPct}%` : "0%",
        discountNum: discount,
        finalPayableNum: finalPayable,
        paymentStatus,
        paidAmountNum: parseInvoicePaidAmount(inv),
        terms: description?.trim()
          ? description.trim()
          : inv?.terms,
      }),
    [
      invoiceNo,
      issueDate,
      client,
      paymentMode,
      paymentStatus,
      reference,
      orderId,
      lines,
      subtotal,
      tax,
      vatYes,
      taxPct,
      discount,
      finalPayable,
      inv,
      description,
      selectedClientAddress,
    ]
  );

  const downloadTaxInvoicePdf = async () => {
    await downloadSalesInvoiceEditorPdf({
      invoiceNo,
      issueDate,
      client,
      clientAddress: selectedClientAddress,
      paymentMode,
      reference,
      description,
      lines,
      subtotal,
      tax,
      vatYes,
      taxPct,
      discount,
      finalPayable,
    });
  };

  /* 13px picker text (default .jitox-picker-form), not value-sm */
  const datePickerClass = "w-full min-w-0 jitox-picker-form";

  /** Preview hidden: one parent grid — row2 cells line up under row1 (4× lg). Preview on: 2-col classic layout */
  const formFieldGridClass = previewHidden
    ? "grid min-w-0 grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2 sm:items-end lg:grid-cols-4 lg:items-end"
    : "grid min-w-0 grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2 sm:items-end";
  const formClientAddRowClass =
    "sm:col-span-2 grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]";
  const formDescriptionRowClass = previewHidden ? "sm:col-span-2 lg:col-span-4" : "sm:col-span-2";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-dark dark:text-slate-100 sm:text-xl">Create Invoice</h1>
          <div className="flex shrink-0 gap-2">
            <Button
              label={previewHidden ? "Show Preview" : "Hide Preview"}
              variant="outline"
              onClick={() => setPreviewHidden((v) => !v)}
            />
            <Button
              label="Review Invoice"
              variant="primary"
              className="text-white! hover:text-white!"
              onClick={() => {
                if (!lines.length || !lines.some((l) => l.name?.trim())) {
                  toast.error("Add at least one product line before reviewing.");
                  return;
                }
                if (!client?.trim()) {
                  toast.error("Select a client before reviewing the invoice.");
                  return;
                }
                setReviewModalOpen(true);
              }}
            />
          </div>
        </div>

        <div
          className={`grid min-w-0 gap-3 ${previewHidden ? "grid-cols-1" : "lg:grid-cols-2 lg:items-start lg:gap-4"}`}
        >
          <div
            className={`jitox-invoice-form min-w-0 space-y-2.5 rounded-lg border border-light-border bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)] ${
              previewHidden ? "px-4 py-3 sm:px-5" : "p-3"
            }`}
          >
            <div className={formFieldGridClass}>
              <InputField
                dense
                label="Invoice Number"
                labelClassName={INVOICE_LABEL_FIELD}
                inputClassName={INVOICE_INPUT_TEXT}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
              <div className="flex min-w-0 flex-col">
                <label className={INVOICE_LABEL_STATIC}>Issue Date</label>
                <DatePicker
                  className={datePickerClass}
                  format="DD MMM YYYY"
                  allowClear={false}
                  value={issueDate?.isValid?.() ? issueDate : dayjs()}
                  onChange={(d) => setIssueDate(d && d.isValid() ? d : dayjs())}
                />
              </div>
              <CommonDropdown
                formCompact
                label="Payment Mode"
                addNavigateTo="/dashboard/account"
                placeholder="Select payment mode"
                value={paymentMode}
                onChange={setPaymentMode}
                options={paymentModeOptions}
              />
              <div className="flex min-w-0 flex-col">
                <label className={INVOICE_LABEL_STATIC}>Due Date</label>
                <DatePicker
                  className={datePickerClass}
                  format="DD MMM YYYY"
                  allowClear={false}
                  value={dueDate?.isValid?.() ? dueDate : dayjs()}
                  onChange={(d) => setDueDate(d && d.isValid() ? d : dayjs())}
                />
              </div>
              {previewHidden ? (
                <>
                  <div className="min-w-0">
                    <CommonDropdown
                      formCompact
                      label="Client Name"
                      addNavigateTo="/dashboard/account"
                      placeholder={
                        partiesLoading
                          ? "Loading clients…"
                          : clientOptions.length
                            ? "Select client"
                            : "No clients — add in Account Master"
                      }
                      value={client}
                      onChange={setClient}
                      options={clientOptions}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-end">
                    <Button
                      label="Add customer"
                      {...mergePageAddOutlineButton({
                        className:
                          "w-full justify-center lg:w-auto lg:shrink-0 !h-9 !min-h-9 !max-h-9 !px-3 !py-0 !text-sm !gap-1.5 [&_svg]:!h-4 [&_svg]:!w-4",
                      })}
                      onClick={() => {
                        const name = window.prompt("Customer name");
                        if (!name?.trim()) return;
                        const t = name.trim();
                        setExtraClients((prev) => [...prev, { value: t, label: t }]);
                        setClient(t);
                        toast.success("Customer added");
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <InputField
                      dense
                      label="Reference of the Invoice"
                      labelClassName={INVOICE_LABEL_FIELD}
                      inputClassName={INVOICE_INPUT_TEXT}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                  <CommonDropdown
                    formCompact
                    label="Payment Status"
                    placeholder="Select status"
                    value={paymentStatus}
                    onChange={setPaymentStatus}
                    options={PAYMENT_STATUS_OPTIONS}
                  />
                </>
              ) : (
                <>
                  <div className={formClientAddRowClass}>
                    <div className="min-w-0">
                      <CommonDropdown
                        formCompact
                        label="Client Name"
                        addNavigateTo="/dashboard/account"
                        placeholder={
                          partiesLoading
                            ? "Loading clients…"
                            : clientOptions.length
                              ? "Select client"
                              : "No clients — add in Account Master"
                        }
                        value={client}
                        onChange={setClient}
                        options={clientOptions}
                      />
                    </div>
                    <Button
                      label="Add customer"
                      {...mergePageAddOutlineButton({
                        className:
                          "w-full justify-center sm:w-auto !h-9 !min-h-9 !max-h-9 !px-3 !py-0 !text-sm !gap-1.5 [&_svg]:!h-4 [&_svg]:!w-4",
                      })}
                      onClick={() => {
                        const name = window.prompt("Customer name");
                        if (!name?.trim()) return;
                        const t = name.trim();
                        setExtraClients((prev) => [...prev, { value: t, label: t }]);
                        setClient(t);
                        toast.success("Customer added");
                      }}
                    />
                  </div>
                  <InputField
                    dense
                    label="Reference of the Invoice"
                    labelClassName={INVOICE_LABEL_FIELD}
                    inputClassName={INVOICE_INPUT_TEXT}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  <CommonDropdown
                    formCompact
                    label="Payment Status"
                    placeholder="Select status"
                    value={paymentStatus}
                    onChange={setPaymentStatus}
                    options={PAYMENT_STATUS_OPTIONS}
                  />
                </>
              )}
              <InputField
                dense
                label="Description"
                labelClassName={INVOICE_LABEL_FIELD}
                multiline
                rows={2}
                inputClassName={`min-h-[4.25rem] resize-y ${INVOICE_INPUT_TEXT}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={formDescriptionRowClass}
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-light-border bg-white dark:border-slate-600 dark:bg-slate-950/40">
              <div className="flex min-w-0 flex-col gap-2 border-b border-light-border bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-800/50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
                <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    VAT application
                  </span>
                  <div className="flex shrink-0 items-center gap-4 sm:gap-5">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={vatYes}
                        onChange={() => setVatYes(true)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Yes</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={!vatYes}
                        onChange={() => setVatYes(false)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">No</span>
                    </label>
                  </div>
                </div>
                <div className="flex w-full shrink-0 justify-end sm:ml-auto sm:w-auto sm:pl-2">
                  <Button
                    label="Add product line"
                    {...mergePageAddOutlineButton({
                      className:
                        "w-full justify-center sm:w-auto sm:justify-center !h-9 !min-h-9 !max-h-9 !px-3 !py-0 !text-sm !font-semibold !gap-1.5 [&_svg]:!h-4 [&_svg]:!w-4",
                    })}
                    onClick={() =>
                      setLines([...lines, { name: "", qty: 0, rate: 0, subtotal: 0 }])
                    }
                  />
                </div>
              </div>

              <div className="overflow-x-auto dark:bg-slate-950/30">
              <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "46%", minWidth: "12rem" }} />
                  <col style={{ width: "12%", minWidth: "3.25rem" }} />
                  <col style={{ width: "22%", minWidth: "7rem" }} />
                  <col style={{ width: "20%", minWidth: "6.5rem" }} />
                </colgroup>
                <thead className="bg-headBg">
                  <tr className="border-b border-light-border dark:border-slate-600">
                    <th className="px-3 py-2.5 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Product name
                    </th>
                    <th className="px-2 py-2.5 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Qty
                    </th>
                    <th className="px-2 py-2.5 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Rate (₹)
                    </th>
                    <th className="px-3 py-2.5 text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Subtotal (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((row, idx) => (
                    <tr key={idx} className="border-t border-light-border dark:border-slate-600">
                      <td className="px-3 py-2 align-middle">
                        <input
                          className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary"
                          placeholder="Product description"
                          value={row.name}
                          onChange={(e) => recalcLine({ ...row, name: e.target.value }, idx)}
                        />
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <input
                          type="number"
                          className="invoice-num-input w-full min-w-0 rounded-md border border-slate-200 bg-white px-1.5 py-2 text-center text-sm tabular-nums text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
                          value={row.qty}
                          onChange={(e) => recalcLine({ ...row, qty: e.target.value }, idx)}
                        />
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <input
                          type="number"
                          className="invoice-num-input w-full min-w-0 rounded-md border border-slate-200 bg-white px-1.5 py-2 text-center text-sm tabular-nums text-slate-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
                          value={row.rate}
                          onChange={(e) => recalcLine({ ...row, rate: e.target.value }, idx)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right align-middle text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        ₹{(row.subtotal || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="border-t-2 border-light-border bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-900/80">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Amount summary
                </p>
                <div className="w-full space-y-2 text-sm tabular-nums">
                  <div className="flex items-center justify-between gap-6 border-b border-slate-200/90 pb-2 dark:border-slate-600/90">
                    <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6 border-b border-slate-200/90 pb-2 dark:border-slate-600/90">
                    <span className="text-slate-600 dark:text-slate-300">Tax ({taxPct}%)</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ₹{tax.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6 border-b border-slate-200/90 pb-2 dark:border-slate-600/90">
                    <span className="text-slate-600 dark:text-slate-300">Discount</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ₹{discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6 pt-1">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-50">Final payable</span>
                    <span className="text-base font-bold text-primary dark:text-emerald-300">
                      ₹{finalPayable.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-light-border pt-3 dark:border-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
              <Button
                label="Cancel"
                variant="outline"
                className="min-h-11 w-full justify-center px-4 text-sm font-semibold sm:min-h-9 sm:w-auto sm:shrink-0"
                onClick={() => navigate(-1)}
              />
              <Button
                label="Save as Draft"
                variant="outline"
                className="min-h-11 w-full justify-center px-4 text-sm font-semibold sm:min-h-9 sm:w-auto sm:shrink-0"
                onClick={() => {
                  try {
                    localStorage.setItem(
                      INVOICE_DRAFT_KEY,
                      JSON.stringify({
                        invoiceNo,
                        issueDate:
                          issueDate?.isValid?.() ? issueDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                        dueDate: dueDate?.isValid?.() ? dueDate.format("YYYY-MM-DD") : "",
                        client,
                        paymentMode,
                        paymentStatus,
                        reference,
                        description,
                        vatYes,
                        lines,
                      })
                    );
                    toast.success("Draft saved on this device");
                  } catch {
                    toast.error("Could not save draft");
                  }
                }}
              />
              <Button
                label="Download"
                variant="primary"
                className="min-h-11 w-full justify-center px-5 text-sm font-semibold text-white! hover:text-white! sm:min-h-9 sm:w-auto sm:shrink-0"
                onClick={async () => {
                  try {
                    await downloadTaxInvoicePdf();
                    toast.success("Tax invoice PDF downloaded.");
                  } catch (err) {
                    console.error(err);
                    const msg =
                      err?.message ||
                      "Could not generate PDF. Run npm install in Jetox-dashboard, then try again.";
                    toast.error(msg);
                  }
                }}
              />
            </div>
          </div>

          {!previewHidden && (
            <div
              ref={previewRef}
              className="min-w-0 rounded-xl border border-light-border bg-white p-3 text-sm text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)] sm:p-4"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3 border-b border-light-border pb-2 dark:border-slate-600">
                <div className="min-w-0">
                  <div className="text-base font-bold text-primary sm:text-lg dark:text-emerald-400">
                    {company.companyName}
                  </div>
                  <div className="mt-0.5 space-y-0.5 text-xs text-light dark:text-slate-400">
                    {company.website ? <div>{company.website}</div> : null}
                    {company.email ? <div>{company.email}</div> : null}
                    {company.phone ? <div>{company.phone}</div> : null}
                  </div>
                </div>
                <div className="max-w-[11rem] shrink-0 text-right text-[11px] leading-snug whitespace-pre-line text-light dark:text-slate-400">
                  {company.taxAddress}
                </div>
              </div>
              <div className="mb-2 flex justify-between gap-3 border-b border-light-border pb-2 dark:border-slate-600">
                <div className="min-w-0">
                  <div className="text-[11px] text-light dark:text-slate-400">Invoice No</div>
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{invoiceNo}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] text-light dark:text-slate-400">Date</div>
                  <div className="text-sm tabular-nums text-slate-900 dark:text-slate-100">
                    {formatInvoiceDate(issueDate)}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-light dark:text-slate-400">
                  Billed to
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{client}</div>
                {selectedClientAddress ? (
                  <div className="mt-0.5 text-[11px] leading-snug whitespace-pre-line text-light dark:text-slate-400">
                    {selectedClientAddress}
                  </div>
                ) : null}
              </div>
              <table className="mb-2 w-full text-[11px] text-slate-800 sm:text-xs dark:text-slate-200">
                <thead>
                  <tr className="border-b border-light-border text-left dark:border-slate-600">
                    <th className="py-1.5 text-slate-600 dark:text-slate-400">Item</th>
                    <th className="py-1.5 text-center text-slate-600 dark:text-slate-400">Qty</th>
                    <th className="py-1.5 text-right text-slate-600 dark:text-slate-400">Rate</th>
                    <th className="py-1.5 text-right text-slate-600 dark:text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-light-border/60 dark:border-slate-600/80">
                      <td className="py-1.5">{l.name || "—"}</td>
                      <td className="py-1.5 text-center tabular-nums">{l.qty}</td>
                      <td className="py-1.5 text-right tabular-nums">₹{l.rate}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        ₹{(l.subtotal || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-0.5 text-right text-[11px] text-slate-800 sm:text-xs dark:text-slate-200">
                <div className="flex justify-end gap-3">
                  <span className="text-light dark:text-slate-400">Subtotal</span>
                  <span className="w-20 tabular-nums text-slate-900 dark:text-slate-100">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <span className="text-light dark:text-slate-400">Tax</span>
                  <span className="w-20 tabular-nums text-slate-900 dark:text-slate-100">
                    ₹{tax.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-end gap-3">
                  <span className="text-light dark:text-slate-400">Discount</span>
                  <span className="w-20 tabular-nums text-slate-900 dark:text-slate-100">
                    ₹{discount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-end gap-3 pt-0.5 font-bold text-slate-900 dark:text-slate-50">
                  <span>Final Payable</span>
                  <span className="w-20 tabular-nums text-primary dark:text-emerald-400">
                    ₹{finalPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <footer className="mt-4 border-t border-light-border pt-3 dark:border-slate-600">
                <p className="mx-auto max-w-md text-center text-xs italic leading-relaxed text-slate-600 dark:text-slate-400">
                  Please pay within 15 days of receiving this invoice.
                </p>
              </footer>
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        invoice={reviewInvoice}
      />
    </DashboardLayout>
  );
}
