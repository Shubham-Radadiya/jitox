import React, { useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField, CommonDropdown } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { downloadHtmlFile, escapeHtml } from "../../utils/printAndExport";
import { mergePageAddOutlineButton } from "../../utils/pageAddButton";

const INVOICE_DRAFT_KEY = "jitox_invoice_draft_v1";

const defaultLines = () => [
  { name: "Organic Fertilizer", qty: 50, rate: 400, subtotal: 20000 },
  { name: "Liquid Pesticide", qty: 10, rate: 200, subtotal: 2000 },
];

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
        issueDate: inv.invoiceDate ? dayjs(inv.invoiceDate, "DD MMM, YYYY") : dayjs(),
        client: inv.billedTo?.name || "Mr. Ramesh Mehta",
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
      client: "Mr. Ramesh Mehta",
      paymentMode: "UPI",
      reference: "INV-057",
      description: "",
      vatYes: true,
      lines,
    };
  }, [inv]);

  const [previewHidden, setPreviewHidden] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState(initial.invoiceNo);
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [client, setClient] = useState(initial.client);
  const [paymentMode, setPaymentMode] = useState(initial.paymentMode);
  const [reference, setReference] = useState(initial.reference);
  const [description, setDescription] = useState(initial.description);
  const [vatYes, setVatYes] = useState(initial.vatYes);
  const [lines, setLines] = useState(initial.lines);
  const [extraClients, setExtraClients] = useState([]);
  const previewRef = useRef(null);

  const clientOptions = useMemo(() => {
    const base = [
      { value: "Mr. Ramesh Mehta", label: "Mr. Ramesh Mehta" },
      { value: "Alpha Traders", label: "Alpha Traders" },
    ];
    return [...base, ...extraClients];
  }, [extraClients]);

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

  const buildInvoiceDownloadHtml = () => {
    const rowHtml = lines
      .map(
        (l) =>
          `<tr><td>${escapeHtml(l.name || "—")}</td><td style="text-align:center">${escapeHtml(String(l.qty))}</td><td style="text-align:right">₹${escapeHtml(String(l.rate))}</td><td style="text-align:right">₹${escapeHtml(String((l.subtotal || 0).toLocaleString("en-IN")))}</td></tr>`
      )
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${escapeHtml(invoiceNo)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;font-size:13px;}</style></head><body>
<h1 style="color:#0f766e">Jitox Agro</h1>
<p style="color:#666;font-size:12px">Sample address — Surat, Gujarat</p>
<div style="display:flex;justify-content:space-between;margin:16px 0;border-bottom:1px solid #eee;padding-bottom:12px">
<div><div style="font-size:11px;color:#666">Invoice No</div><div style="font-weight:600">${escapeHtml(invoiceNo)}</div></div>
<div style="text-align:right"><div style="font-size:11px;color:#666">Date</div><div>${escapeHtml(issueDate?.format?.("DD MMM YYYY") || "")}</div></div>
</div>
<p><strong>Billed to:</strong> ${escapeHtml(client)}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rowHtml}</tbody></table>
<p style="margin-top:16px;text-align:right"><strong>Final Payable:</strong> ₹${escapeHtml(String(finalPayable.toLocaleString("en-IN")))}</p>
</body></html>`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-dark">Create Invoice</h1>
          <div className="flex gap-2">
            <Button
              label={previewHidden ? "Show Preview" : "Hide Preview"}
              variant="outline"
              onClick={() => setPreviewHidden((v) => !v)}
            />
            <Button
              label="Review Invoice"
              variant="primary"
              onClick={() => {
                setPreviewHidden(false);
                requestAnimationFrame(() => {
                  previewRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
                toast.success("Scroll to preview");
              }}
            />
          </div>
        </div>

        <div className={`grid gap-4 ${previewHidden ? "grid-cols-1" : "lg:grid-cols-2"}`}>
          <div className="bg-white border border-light-border rounded-xl p-5 shadow-sm space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                label="Invoice Number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dark">Issue Date</label>
                <DatePicker className="w-full" value={issueDate} onChange={setIssueDate} />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[12rem]">
                  <CommonDropdown
                    label="Client Name"
                    addNavigateTo="/dashboard/account"
                    placeholder="Select client"
                    value={client}
                    onChange={setClient}
                    options={clientOptions}
                  />
                </div>
                <Button
                  label="Add customer"
                  {...mergePageAddOutlineButton({ className: "mb-0.5" })}
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
              <CommonDropdown
                label="Payment Mode"
                addNavigateTo="/dashboard/account"
                value={paymentMode}
                onChange={setPaymentMode}
                options={[
                  { value: "UPI", label: "UPI" },
                  { value: "Bank", label: "Bank" },
                  { value: "Cash", label: "Cash" },
                ]}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dark">Due Date</label>
                <DatePicker className="w-full" />
              </div>
              <InputField
                label="Reference of the Invoice"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dark">Payment Status</label>
                <div className="px-3 py-2 rounded-lg border border-light-border bg-gray-100 text-sm text-light">
                  Pending
                </div>
              </div>
              <InputField
                label="Description"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="sm:col-span-2"
              />
            </div>

            <div>
              <div className="text-sm font-medium text-dark mb-2">VAT Application</div>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={vatYes}
                    onChange={() => setVatYes(true)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!vatYes}
                    onChange={() => setVatYes(false)}
                    className="accent-primary"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            <div>
              <Button
                label="Add product line"
                {...mergePageAddOutlineButton({ className: "mb-3" })}
                onClick={() =>
                  setLines([...lines, { name: "", qty: 0, rate: 0, subtotal: 0 }])
                }
              />
              <div className="border border-light-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-headBg">
                    <tr>
                      <th className="px-3 py-2 text-left">Product Name</th>
                      <th className="px-3 py-2">QTY</th>
                      <th className="px-3 py-2">Rate (₹)</th>
                      <th className="px-3 py-2">Subtotal (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((row, idx) => (
                      <tr key={idx} className="border-t border-light-border">
                        <td className="px-2 py-2">
                          <input
                            className="w-full border border-light-border rounded px-2 py-1 text-sm"
                            value={row.name}
                            onChange={(e) => recalcLine({ ...row, name: e.target.value }, idx)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            className="w-full border border-light-border rounded px-2 py-1 text-sm text-center"
                            value={row.qty}
                            onChange={(e) => recalcLine({ ...row, qty: e.target.value }, idx)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            className="w-full border border-light-border rounded px-2 py-1 text-sm text-center"
                            value={row.rate}
                            onChange={(e) => recalcLine({ ...row, rate: e.target.value }, idx)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ₹{(row.subtotal || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3 text-sm space-y-1">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-light">Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light">Tax ({taxPct}%)</span>
                    <span>₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light">Discount</span>
                    <span>₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-light-border">
                    <span>Final Payable</span>
                    <span>₹{finalPayable.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button label="Cancel" variant="outline" onClick={() => navigate(-1)} />
              <Button
                label="Save as Draft"
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.setItem(
                      INVOICE_DRAFT_KEY,
                      JSON.stringify({
                        invoiceNo,
                        issueDate: issueDate?.format?.("YYYY-MM-DD"),
                        client,
                        paymentMode,
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
                onClick={() => {
                  downloadHtmlFile(
                    `invoice-${String(invoiceNo).replace(/#/g, "")}.html`,
                    buildInvoiceDownloadHtml()
                  );
                  toast.success(
                    "Invoice downloaded (.html). Open the file and use Print → Save as PDF for a PDF copy."
                  );
                }}
              />
            </div>
          </div>

          {!previewHidden && (
            <div
              ref={previewRef}
              className="bg-white border border-light-border rounded-xl p-4 shadow-sm text-sm"
            >
              <div className="font-bold text-lg text-primary mb-1">Jitox Agro</div>
              <p className="text-light text-xs mb-4">Sample address — Surat, Gujarat</p>
              <div className="flex justify-between border-b border-light-border pb-3 mb-3">
                <div>
                  <div className="text-xs text-light">Invoice No</div>
                  <div className="font-semibold">{invoiceNo}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-light">Date</div>
                  <div>{issueDate?.format?.("DD MMM YYYY")}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-light uppercase mb-1">Billed to</div>
                <div className="font-medium">{client}</div>
                <div className="text-light text-xs mt-1">Surat, Gujarat · +91-9876543210</div>
              </div>
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-light-border text-left">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-light-border/60">
                      <td className="py-2">{l.name || "—"}</td>
                      <td className="py-2 text-center">{l.qty}</td>
                      <td className="py-2 text-right">₹{l.rate}</td>
                      <td className="py-2 text-right">₹{(l.subtotal || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-1 text-xs">
                <div className="flex justify-end gap-4">
                  <span className="text-light">Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-light">Tax</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-light">Discount</span>
                  <span>₹{discount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-end gap-4 font-bold pt-1">
                  <span>Final Payable</span>
                  <span>₹{finalPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <p className="text-[11px] text-light mt-6">
                Please pay within 15 days of receiving this invoice.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
