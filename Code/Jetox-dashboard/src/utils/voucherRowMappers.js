import dayjs from "dayjs";

export function fmtRupee(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₹${x.toLocaleString("en-IN")}`;
}

export function parseRupeeCell(s) {
  if (s == null || s === "—") return 0;
  const n = Number(String(s).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function mapPurchaseAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate
    ? dayjs(v.voucherDate).format("YYYY-MM-DD")
    : "";
  const debit =
    v.totalAmount != null
      ? fmtRupee(v.totalAmount)
      : "—";
  return {
    _id: id,
    _raw: v,
    Date: date,
    "Party Name": v.partyName || "—",
    "Voucher No.": v.voucherNo || "—",
    "Debit Amount": debit,
    "Credit Amount": "—",
    "Due Date": v.dueDate
      ? dayjs(v.dueDate).format("DD MMM YY")
      : "—",
    "Payment Status": v.paymentMode || "Pending",
  };
}

export function mapPurchaseReturnAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate
    ? dayjs(v.voucherDate).format("YYYY-MM-DD")
    : "";
  return {
    _id: id,
    _raw: v,
    Date: date,
    "Party Name": v.partyName || "—",
    "Voucher No.": v.voucherNo || "—",
    "Debit Amount":
      v.totalAmount != null ? fmtRupee(v.totalAmount) : "—",
  };
}

export function mapDashboardOrderRow(r) {
  return {
    _id: r._id,
    _raw: r,
    "Invoice No.": r["Order ID"] || r.orderId || "—",
    Date: r.Date || "—",
    "Party Name": r["Client Name"] || "—",
    Qty: r.Products || "—",
    Amount: r["Total Amount"] || "—",
    "Payment Status": r["Payment Status"] || "—",
    "Order Status": r["Order Status"] || "—",
  };
}

export function mapPaymentVoucherRow(v) {
  const mode = String(v.paymentThrough || "").toLowerCase();
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    Party: v.paymentTo || "—",
    Mode: mode === "bank" ? "bank" : mode === "cash" ? "cash" : mode || "—",
    Amount: v.amount != null ? fmtRupee(parseFloat(String(v.amount))) : "—",
    Status: v.status || "Pending",
  };
}

export function mapAccountingReceiptRow(v) {
  const paid = String(v.status || "").toLowerCase() === "paid";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    "Receipt Through": v.receiptThrough || "—",
    "Receipt Form": v.receiptFrom || "—",
    "Amount (₹)":
      v.amount != null
        ? Number(String(v.amount).replace(/,/g, "")).toLocaleString("en-IN")
        : "—",
    Narration: v.remarks || "—",
    Status: paid ? "Received" : "Pending",
  };
}

export function mapExpenseRow(v) {
  return {
    _id: v._id,
    _raw: v,
    Date: v.startDate
      ? dayjs(v.startDate).format("YYYY-MM-DD")
      : "—",
    "Expense Type": v.expenseType || "—",
    Description: v.description || "—",
    "Paid To": v.paidTo || "—",
    Amount: v.amount != null ? fmtRupee(v.amount) : "—",
    Mode: v.paymentMode || "—",
    Proof: v.uploadProof ? "view" : "-",
  };
}

export function mapCashVoucherRow(v) {
  const amt = v.amount != null ? fmtRupee(v.amount) : "—";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNumber || "—",
    Date: v.createdAt
      ? dayjs(v.createdAt).format("YYYY-MM-DD")
      : "—",
    Particulars: v.particulars || v.narration || "—",
    "Debit (Outflow)": amt,
    "Credit (Inflow)": v.creditTo || v.debitFrom || "—",
    Balance: "—",
  };
}

export function mapBankVoucherRow(v) {
  const amt = v.amount != null ? fmtRupee(v.amount) : "—";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNumber || "—",
    Date: v.createdAt
      ? dayjs(v.createdAt).format("YYYY-MM-DD")
      : "—",
    Particulars: v.particulars || v.narration || "—",
    "Debit From": v.debitFrom || "—",
    "Credit (Outflow)": v.creditTo || "—",
    Balance: amt,
  };
}

export function mapJournalRow(v) {
  return {
    _id: v._id,
    _raw: v,
    "Entry No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    Description: v.remarks || "—",
    Debit: v.debitAmount != null ? fmtRupee(v.debitAmount) : "—",
    Credit: v.creditAmount != null ? fmtRupee(v.creditAmount) : "—",
  };
}

export function mapQuotationRow(q) {
  return {
    _id: q._id,
    _raw: q,
    "Quote No": q.voucherNo || "—",
    Date: q.voucherDate
      ? dayjs(q.voucherDate).format("YYYY-MM-DD")
      : "—",
    Client: q.partyName || "—",
    Amount: q.totalAmount != null ? fmtRupee(q.totalAmount) : "—",
    Status: "—",
  };
}

/** Shape expected by PurchaseDetails drawer */
export function purchaseDocToDetailShape(doc) {
  const d = doc;
  if (!d) return null;
  const products = (d.items || []).map((it, i) => {
    const p = it.product;
    const name =
      p && typeof p === "object" && p.productName
        ? p.productName
        : String(p || `Item ${i + 1}`);
    return {
      name,
      qty: String(it.quantity ?? ""),
      rate: fmtRupee(it.rateParUnit),
      gst: "—",
      subtotal: fmtRupee(it.subtotal),
    };
  });
  const ta = d.totalAmount;
  const totalLabel = ta != null ? fmtRupee(ta) : "—";
  return {
    voucherNo: d.voucherNo || "—",
    status: d.paymentMode || "—",
    purchaseDate: d.voucherDate
      ? dayjs(d.voucherDate).format("DD MMM YYYY")
      : "—",
    narration: d.narration || d.remarks || "",
    customer: [],
    party: [
      { label: "Party Name", value: d.partyName || "—" },
      { label: "Invoice No", value: d.invoiceNo || "—" },
    ],
    products:
      products.length > 0
        ? products
        : [
            {
              name: "—",
              qty: "—",
              rate: "—",
              gst: "—",
              subtotal: "—",
            },
          ],
    totals: {
      totalAmount: totalLabel,
      tax: d.gstAmount != null ? fmtRupee(d.gstAmount) : "—",
      discount: "—",
      paid: "—",
      due: "—",
      finalPayable: totalLabel,
      reference: d.transportDetails || "",
    },
  };
}

/** Map GET /dashboard-ui/orders/:id → PurchaseDetails shape */
export function salesOrderResponseToPurchaseDetail(payload) {
  const order = payload?.order;
  const detail = payload?.detail;
  if (!order) return null;
  if (detail?.invoice) {
    const inv = detail.invoice;
    const products = (inv.lines || []).map((line) => ({
      name: line.detail || "—",
      qty: line.qty || "—",
      rate: line.rate || "—",
      gst: "—",
      subtotal: line.amount || "—",
    }));
    return {
      voucherNo: inv.invoiceNo || order.orderId || "—",
      status: order.paymentStatus || "—",
      purchaseDate: inv.invoiceDate || order.date || "—",
      narration: inv.notes || order.notes || "",
      customer: [],
      party: [
        {
          label: "Client",
          value: order.clientName || inv.billedTo?.name || "—",
        },
      ],
      products:
        products.length > 0
          ? products
          : [{ name: order.products || "—", qty: "—", rate: "—", gst: "—", subtotal: "—" }],
      totals: {
        totalAmount: inv.invoiceTotalLabel || order.totalAmount || "—",
        tax: inv.taxAmount || "—",
        discount: inv.discount || "—",
        paid: inv.paidAmount || order.paid || "—",
        due: inv.outstanding || order.due || "—",
        finalPayable: inv.finalPayable || order.totalAmount || "—",
        reference: inv.reference || "",
      },
    };
  }
  return {
    voucherNo: order.orderId || "—",
    status: order.paymentStatus || "—",
    purchaseDate: order.date || "—",
    narration: order.notes || "",
    customer: [],
    party: [{ label: "Client", value: order.clientName || "—" }],
    products: [
      {
        name: order.products || "—",
        qty: "—",
        rate: "—",
        gst: "—",
        subtotal: order.totalAmount || "—",
      },
    ],
    totals: {
      totalAmount: order.totalAmount || "—",
      tax: "—",
      discount: "—",
      paid: order.paid || "—",
      due: order.due || "—",
      finalPayable: order.totalAmount || "—",
      reference: "",
    },
  };
}
