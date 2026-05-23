import { Request, Response } from "express";
import {
  PurchaseVoucher,
  PurchaseReturnVoucher,
  PaymentVoucher,
  ReceiptVoucher,
  ExpenseVoucher,
  CashVoucher,
  Quotation,
  SalesReturnVoucher,
  Product,
  Account,
  Employee,
} from "../models/index";
import * as Dyn from "../services/dashboardDynamic.service";
import { uploadDocumentFile } from "../middleware/multerDocuments.middleware";
import { sendSuccess } from "../utils/apiResponse";
import { productLineAmount, resolveProductUnit } from "../utils/productUnit";
import { buildPartyAddressesMap } from "../utils/partyVoucherAddress.util";

function parseRupeeAmount(s: string): number {
  const n = Number(
    String(s)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

function parseNumericLoose(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return parseRupeeAmount(String(v));
}

async function safeDbNumber<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** `YYYY-MM-DD` for HTML date inputs (purchase invoice line fill). */
function productDateForHtmlDateInput(d: unknown): string {
  if (d == null || d === "") return "";
  const dt = new Date(d as Date);
  const t = dt.getTime();
  if (!Number.isFinite(t)) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Next purchase voucher no. in `V001` form — scans existing `V###` codes only
 * (matches UI default). Other formats (e.g. prefixed demo IDs) are ignored for sequencing.
 */
async function computeNextPurchaseVoucherNo(): Promise<string> {
  const docs = await PurchaseVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^V(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  const next = max + 1;
  const width = Math.max(3, String(next).length);
  return `V${String(next).padStart(width, "0")}`;
}

/** Next quotation voucher no. in `QT-001` form (also scans demo-prefixed codes). */
async function computeNextQuotationVoucherNo(): Promise<string> {
  const docs = await Quotation.find()
    .select("voucherNo invoiceNo")
    .lean();
  let max = 0;
  const patterns = [/^QT-(\d+)$/i, /^JITOX-DEMO-QT-(\d+)$/i];
  const bump = (raw: string) => {
    const v = String(raw ?? "").trim();
    for (const re of patterns) {
      const m = re.exec(v);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n)) max = Math.max(max, n);
      }
    }
  };
  for (const d of docs) {
    bump(String(d?.voucherNo ?? ""));
    bump(String(d?.invoiceNo ?? ""));
  }
  const next = max + 1;
  return `QT-${String(next).padStart(3, "0")}`;
}

async function sumModelField(model: any, field: string): Promise<number> {
  const rows = (await model.aggregate([
    { $group: { _id: null, t: { $sum: { $ifNull: [`$${field}`, 0] } } } },
  ])) as { t?: number }[];
  const n = Number(rows[0]?.t);
  return Number.isFinite(n) ? n : 0;
}

async function aggregateDashboardTotalsFromDb(): Promise<{
  purchaseTotal: number;
  salesTotal: number;
  purchaseReturnTotal: number;
  paymentTotal: number;
  receiptTotal: number;
  expenseTotal: number;
  cashVoucherTotal: number;
  stockValue: number;
}> {
  const sumPayments = async () => {
    const docs = await PaymentVoucher.find().select("amount").lean();
    return docs.reduce(
      (s, d: { amount?: unknown }) => s + parseNumericLoose(d.amount),
      0
    );
  };
  const sumReceipts = async () => {
    const docs = await ReceiptVoucher.find().select("amount").lean();
    return docs.reduce(
      (s, d: { amount?: unknown }) => s + parseNumericLoose(d.amount),
      0
    );
  };
  const sumStockFromProducts = async () => {
    const docs = await Product.find().lean();
    return docs.reduce(
      (s, p: Record<string, unknown>) => s + productLineAmount(p),
      0
    );
  };

  const [
    purchaseTotal,
    purchaseReturnTotal,
    expenseTotal,
    cashVoucherTotal,
    paymentTotal,
    receiptTotal,
    salesTotal,
    stockValue,
  ] = await Promise.all([
    safeDbNumber(() => sumModelField(PurchaseVoucher, "totalAmount"), 0),
    safeDbNumber(() => sumModelField(PurchaseReturnVoucher, "totalAmount"), 0),
    safeDbNumber(() => sumModelField(ExpenseVoucher, "amount"), 0),
    safeDbNumber(() => sumModelField(CashVoucher, "amount"), 0),
    safeDbNumber(sumPayments, 0),
    safeDbNumber(sumReceipts, 0),
    safeDbNumber(() => sumModelField(Quotation, "totalAmount"), 0),
    safeDbNumber(sumStockFromProducts, 0),
  ]);

  return {
    purchaseTotal,
    salesTotal,
    purchaseReturnTotal,
    paymentTotal,
    receiptTotal,
    expenseTotal,
    cashVoucherTotal,
    stockValue,
  };
}

const monthShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getOrdersSummary = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchOrdersSummary();
    res.json(data);
  } catch (e) {
    console.error("getOrdersSummary", e);
    res.status(500).json({ message: "Failed to load orders summary" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchOrdersFiltered(req.query as Record<string, unknown>);
    res.json(data);
  } catch (e) {
    console.error("getOrders", e);
    res.status(500).json({ message: "Failed to load orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const payload = await Dyn.fetchQuotationOrderPayload(req.params.id);
    if (!payload) return res.status(404).json({ message: "Order not found" });
    res.json(payload);
  } catch (e) {
    console.error("getOrderById", e);
    res.status(500).json({ message: "Failed to load order" });
  }
};

export const postOrderPay = async (req: Request, res: Response) => {
  try {
    const row = await Dyn.markQuotationPaid(req.params.id);
    if (!row) return res.status(404).json({ message: "Order not found" });
    res.json({ ok: true, order: row });
  } catch (e) {
    console.error("postOrderPay", e);
    res.status(500).json({ message: "Payment update failed" });
  }
};

export const getPayables = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchPayablesList(req.query as Record<string, unknown>);
    res.json(data);
  } catch (e) {
    console.error("getPayables", e);
    res.status(500).json({ message: "Failed to load payables" });
  }
};

export const postPayablePayment = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.applyPayablePayment(req.body || {});
    res.status(201).json(data);
  } catch (e) {
    console.error("postPayablePayment", e);
    res.status(500).json({ message: "Failed to save payment" });
  }
};

export const getStockSummary = async (_req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchStockSummary();
    res.json(data);
  } catch (e) {
    console.error("getStockSummary", e);
    res.status(500).json({ message: "Failed to load stock summary" });
  }
};

export const getStockProducts = async (req: Request, res: Response) => {
  try {
    const group = String(req.query.group || "all");
    const data = await Dyn.fetchStockProducts(group);
    res.json(data);
  } catch (e) {
    console.error("getStockProducts", e);
    res.status(500).json({ message: "Failed to load products" });
  }
};

export const postStockProduct = async (req: Request, res: Response) => {
  try {
    const row = await Dyn.createStockProductFromUi(req.body || {});
    res.status(201).json({ product: row });
  } catch (e) {
    console.error("postStockProduct", e);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const getStockGroups = async (_req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchStockGroups();
    res.json(data);
  } catch (e) {
    console.error("getStockGroups", e);
    res.status(500).json({ message: "Failed to load stock groups" });
  }
};

export const getSchemes = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchSchemesFiltered(req.query as Record<string, unknown>);
    res.json(data);
  } catch (e) {
    console.error("getSchemes", e);
    res.status(500).json({ message: "Failed to load schemes" });
  }
};

export const postScheme = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.createMarketingScheme(req.body || {});
    res.status(201).json(data);
  } catch (e) {
    console.error("postScheme", e);
    res.status(500).json({ message: "Failed to create scheme" });
  }
};

export const putScheme = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.updateMarketingScheme(
      req.params.id,
      req.body || {}
    );
    if (!data) {
      res.status(404).json({ message: "Scheme not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    console.error("putScheme", e);
    res.status(500).json({ message: "Failed to update scheme" });
  }
};

export const deleteScheme = async (req: Request, res: Response) => {
  try {
    await Dyn.deleteMarketingScheme(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteScheme", e);
    res.status(500).json({ message: "Failed to delete scheme" });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.fetchDocumentsGrid(req.query as Record<string, unknown>);
    res.json(data);
  } catch (e) {
    console.error("getDocuments", e);
    res.status(500).json({ message: "Failed to load documents" });
  }
};

export const postDocumentCategory = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.createDocumentCategory(req.body || {});
    res.status(201).json(data);
  } catch (e: any) {
    if (String(e?.message).includes("name required")) {
      return res.status(400).json({ error: "name required" });
    }
    console.error("postDocumentCategory", e);
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const postDocumentFileUpload = (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.filename) {
    res.status(400).json({ message: "file required" });
    return;
  }
  res.status(201).json({ fileUrl: `/uploads/documents/${file.filename}` });
};

export const postDocumentEntry = async (req: Request, res: Response) => {
  try {
    const entry = await Dyn.createDocumentEntry(req.body || {});
    res.status(201).json({ entry });
  } catch (e: any) {
    const m = String(e?.message || "Failed");
    if (
      m.includes("required") ||
      m.includes("Invalid") ||
      m.includes("not found")
    ) {
      return res.status(400).json({ message: m });
    }
    console.error("postDocumentEntry", e);
    res.status(500).json({ message: "Failed to create document" });
  }
};

export const patchDocumentEntry = async (req: Request, res: Response) => {
  try {
    const entry = await Dyn.updateDocumentEntry(req.params.id, req.body || {});
    res.json({ entry });
  } catch (e: any) {
    const m = String(e?.message || "Failed");
    if (m.includes("Invalid") || m.includes("not found")) {
      return res.status(m.includes("not found") ? 404 : 400).json({ message: m });
    }
    console.error("patchDocumentEntry", e);
    res.status(500).json({ message: "Failed to update document" });
  }
};

export const deleteDocumentEntry = async (req: Request, res: Response) => {
  try {
    await Dyn.deleteDocumentEntry(req.params.id);
    res.json({ ok: true });
  } catch (e: any) {
    const m = String(e?.message || "Failed");
    if (m.includes("Invalid")) {
      return res.status(400).json({ message: m });
    }
    if (m.includes("not found")) {
      return res.status(404).json({ message: m });
    }
    console.error("deleteDocumentEntry", e);
    res.status(500).json({ message: "Failed to delete document" });
  }
};

/** Dropdowns + hints for purchase voucher / invoice UI (accounts, products, employees). */
export const getPurchaseFormMeta = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const accounts = (await Account.find({
      customerStatus: { $ne: "Inactive" },
    })
      .select(
        "businessName name amount balenceType creditLimit paymentTerm deliveryAt transportMode city address residentialAddress businessStreetAddress businessArea businessCity businessTaluka businessDistrict businessState businessPincode businessCountry streetAddress street area taluka district state country pincode pinCode"
      )
      .sort({ businessName: 1 })
      .lean()) as unknown as Array<Record<string, unknown>>;

    const partyAddresses = buildPartyAddressesMap(accounts);

    const seenParty = new Set<string>();
    const parties: { value: string; label: string }[] = [];
    for (const a of accounts) {
      const name = String(a.businessName ?? a.name ?? "").trim();
      if (!name || seenParty.has(name)) continue;
      seenParty.add(name);
      parties.push({ value: name, label: name });
    }

    const partyCreditHints: Record<string, string> = {};
    for (const a of accounts) {
      const parts: string[] = [];
      if (a.creditLimit != null && Number.isFinite(Number(a.creditLimit))) {
        parts.push(
          `Credit Limit Rs. ${Number(a.creditLimit).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
      }
      if (a.amount != null && Number.isFinite(Number(a.amount))) {
        parts.push(
          `Outstanding Rs. ${Number(a.amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${a.balenceType || ""}`.trim()
        );
      }
      if (parts.length) partyCreditHints[String(a.businessName)] = parts.join(", ");
    }

    const productsRaw = await Product.find().sort({ productName: 1 }).lean();
    const products = productsRaw.map((p) => ({
      value: String(p._id),
      label: String(p.productName || "Product"),
      group: String(p.group || ""),
      category: String(p.category || ""),
      unit: p.alternateUnits
        ? String(p.alternateUnits)
        : p.units != null
          ? String(p.units)
          : "",
      hsn: p.hsnCode != null ? String(p.hsnCode) : "",
      gstRate: p.gstRate != null ? String(p.gstRate) : "",
      defaultRate: Number(p.billingRatePerUnit ?? p.rate ?? 0) || 0,
      batchNo: p.batchNo != null ? String(p.batchNo).trim() : "",
      mrpPerUnit: p.mrpPerUnit != null ? String(p.mrpPerUnit).trim() : "",
      quantity:
        p.quantity != null && Number.isFinite(Number(p.quantity))
          ? String(p.quantity)
          : "",
      mfgDt: productDateForHtmlDateInput(p.mfgDt),
      expDt: productDateForHtmlDateInput(p.expDt),
    }));

    const groupSet = new Set<string>();
    const unitSet = new Set<string>();
    for (const p of productsRaw) {
      if (p.group) groupSet.add(String(p.group));
      const u =
        resolveProductUnit(p.units) ||
        (p.alternateUnits ? String(p.alternateUnits) : "");
      if (u) unitSet.add(u);
    }
    const groups = [...groupSet]
      .sort()
      .map((label) => ({ value: label, label }));
    const units = [...unitSet]
      .sort()
      .map((label) => ({ value: label, label }));

    const locSet = new Set<string>();
    const transSet = new Set<string>();
    for (const a of accounts) {
      if (a.deliveryAt) locSet.add(String(a.deliveryAt).trim());
      if (a.transportMode) transSet.add(String(a.transportMode).trim());
    }
    if (locSet.size === 0) {
      ["Main warehouse", "Pune depot", "Nashik godown"].forEach((x) =>
        locSet.add(x)
      );
    }
    if (transSet.size === 0) {
      ["Road", "Courier", "Self pickup"].forEach((x) => transSet.add(x));
    }
    const locations = [...locSet]
      .sort()
      .map((l) => ({ value: l, label: l }));
    const transporters = [...transSet]
      .sort()
      .map((t) => ({ value: t, label: t }));

    const termSet = new Set(["Cash", "Credit", "Online", "Cheque"]);
    for (const a of accounts) {
      if (a.paymentTerm) termSet.add(String(a.paymentTerm).trim());
    }
    const terms = [...termSet]
      .sort()
      .map((t) => ({ value: t, label: t }));

    const emps = await Employee.find({ status: "Active" })
      .select("name")
      .sort({ name: 1 })
      .lean();
    const seenEmp = new Set<string>();
    const employees: { value: string; label: string }[] = [];
    for (const e of emps) {
      const name = String(e.name || "").trim();
      if (!name || seenEmp.has(name)) continue;
      seenEmp.add(name);
      employees.push({ value: name, label: name });
    }

    const gst = ["0", "5", "12", "18"].map((v) => ({
      value: v,
      label: `${v}%`,
    }));

    let nextPurchaseVoucherNo = "V001";
    try {
      nextPurchaseVoucherNo = await computeNextPurchaseVoucherNo();
    } catch (e) {
      console.error("computeNextPurchaseVoucherNo", e);
    }

    let nextQuotationVoucherNo = "QT-001";
    try {
      nextQuotationVoucherNo = await computeNextQuotationVoucherNo();
    } catch (e) {
      console.error("computeNextQuotationVoucherNo", e);
    }

    sendSuccess(res, {
      parties,
      partyAddresses,
      partyCreditHints,
      products,
      groups,
      units,
      locations,
      transporters,
      employees,
      terms,
      gst,
      nextPurchaseVoucherNo,
      nextQuotationVoucherNo,
    });
  } catch (e) {
    console.error("getPurchaseFormMeta", e);
    res.status(500).json({ message: "Failed to load purchase form meta" });
  }
};

export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const data = await Dyn.listEmployeesForTracking();
    res.json(data);
  } catch (e) {
    console.error("getEmployees", e);
    res.status(500).json({ message: "Failed to load employees" });
  }
};

export const getEmployeeTracking = async (req: Request, res: Response) => {
  try {
    const data = await Dyn.buildEmployeeTrackingRows(
      req.params.id,
      req.query as Record<string, unknown>
    );
    if (!data) return res.status(404).json({ message: "Employee not found" });
    res.json(data);
  } catch (e) {
    console.error("getEmployeeTracking", e);
    res.status(500).json({ message: "Failed to load tracking" });
  }
};

async function topStockItemsForDashboard(limit: number) {
  const products = await Product.find()
    .sort({ quantity: -1 })
    .limit(limit)
    .lean();
  return products.map((p) => ({
    name: p.productName,
    qty: String(p.quantity ?? 0),
    changePct: 0,
  }));
}

export const getDashboardOverview = async (_req: Request, res: Response) => {
  try {
    const recentOrders = await Dyn.recentOrdersFormatted(10);
    const payData = await Dyn.fetchPayablesList({});
    const payablesListedTotal = Number(payData.totalPayables) || 0;

    const quotations = await Quotation.find({ addedToOrder: true }).lean();
    const salesFromOrders = quotations.reduce(
      (s, o) => s + (Number(o.totalAmount) || 0),
      0
    );

    const dbTotals = await aggregateDashboardTotalsFromDb();
    const receivablesListedTotal =
      Number(dbTotals.receiptTotal) ||
      (await Dyn.totalReceiptVouchersAmount());
    const receivablesPayables =
      await Dyn.buildReceivablesPayablesMonthlyChart();

    const formatRsStat = (n: number) =>
      `Rs : ${Math.round(n).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;

    const purchaseAmt = Math.round(dbTotals.purchaseTotal);
    const salesAmt = Math.round(
      dbTotals.salesTotal > 0 ? dbTotals.salesTotal : salesFromOrders
    );
    const salesReturnAmt = await safeDbNumber(async () => {
      const rows = (await SalesReturnVoucher.aggregate([
        { $match: { approvalStatus: "Approved" } },
        {
          $group: {
            _id: null,
            t: { $sum: { $ifNull: ["$totalAmount", 0] } },
          },
        },
      ])) as { t?: number }[];
      const n = Number(rows[0]?.t);
      return Number.isFinite(n) ? n : 0;
    }, 0);
    const cashBankAmt = Math.round(
      dbTotals.receiptTotal -
        dbTotals.paymentTotal +
        dbTotals.cashVoucherTotal
    );
    const orderListTotal = Math.round(salesFromOrders);

    const stockItems = await topStockItemsForDashboard(9);

    res.json({
      monthlySales: {
        label: "Monthly Sales",
        value: `₹${salesAmt.toLocaleString("en-IN")}`,
        changePct: 6.2,
      },
      monthlyPurchase: {
        label: "Monthly Purchase",
        value: `₹${purchaseAmt.toLocaleString("en-IN")}`,
        changePct: 4.1,
      },
      kpis: [
        {
          key: "purchase",
          label: "PURCHASE",
          value: formatRsStat(purchaseAmt),
          accent: "red",
        },
        {
          key: "sales",
          label: "SALES",
          value: formatRsStat(salesAmt),
          accent: "green",
        },
        {
          key: "purchaseReturn",
          label: "PURCHASE RETURN",
          value: formatRsStat(Math.round(dbTotals.purchaseReturnTotal)),
          accent: "maroon",
        },
        {
          key: "salesReturn",
          label: "SALES RETURN",
          value: formatRsStat(Math.round(salesReturnAmt)),
          accent: "darkGreen",
        },
        {
          key: "payments",
          label: "PAYMENTS",
          value: formatRsStat(Math.round(dbTotals.paymentTotal)),
          accent: "orange",
        },
        {
          key: "receipt",
          label: "RECEIPT",
          value: formatRsStat(Math.round(dbTotals.receiptTotal)),
          accent: "sky",
        },
        {
          key: "expense",
          label: "EXPENSE",
          value: formatRsStat(Math.round(dbTotals.expenseTotal)),
          accent: "violet",
        },
        {
          key: "cashBank",
          label: "CASH / BANK BALANCE",
          value: formatRsStat(cashBankAmt),
          accent: "navy",
        },
        {
          key: "payable",
          label: "PAYABLE",
          value: formatRsStat(Math.round(payablesListedTotal)),
          accent: "slate",
        },
        {
          key: "receivable",
          label: "RECEIVABLE",
          value: formatRsStat(Math.round(receivablesListedTotal)),
          accent: "blue",
        },
        {
          key: "stock",
          label: "STOCK",
          value: formatRsStat(Math.round(dbTotals.stockValue)),
          accent: "amber",
        },
        {
          key: "order",
          label: "ORDER",
          value: formatRsStat(orderListTotal),
          accent: "ink",
        },
      ],
      customers: {
        totalPct: 73.3,
        segments: [
          { label: "Sales", pct: 45, color: "#22c55e" },
          { label: "Visitors", pct: 28.3, color: "#3b82f6" },
        ],
        dailyGrowthPct: 30,
        weeklyGrowthPct: 20,
      },
      receivablesPayables,
      recentOrders,
      salesTarget: {
        targetAmount: 50000000,
        achievedAmount: Math.min(231032444, Math.max(salesAmt, 0)),
        targetLabel: "Sales Target",
        secondaryTarget: 100000,
        secondaryAchieved: 78000,
        secondaryLabel: "Total Achieve",
        revenueTrendPct: 3.6,
        txnTrendPct: 8.1,
        totalRevenueAmount: salesAmt || 212340,
        revenueTrendLabel: "From last week",
        revenueSparkline: [38, 42, 40, 48, 45, 52, 49, 58, 55, 61, 59, 64, 68, 65],
      },
      actions: [
        {
          title: "Purchases",
          subtitle: "Purchase / PO",
          count: 200,
          path: "/dashboard/accounting-voucher/purchase",
        },
        {
          title: "Sales",
          subtitle: "Orders & dispatch",
          count: quotations.length || 250,
          path: "/dashboard/order-list",
        },
        {
          title: "Payments",
          subtitle: "Payment voucher",
          count: 1200,
          path: "/dashboard/accounting-voucher/payment",
        },
        {
          title: "Receivables",
          subtitle: "Receipts & payables",
          count: 1300,
          path: "/dashboard/receivable",
        },
      ],
      stockItems:
        stockItems.length > 0
          ? stockItems
          : [
              { name: "Stock", qty: "0", changePct: 0 },
            ],
      attendance: { present: 50, absent: 12, lateIn: 5, earlyOut: 0 },
      userDistribution: {
        totalPct: 90.2,
        rings: [
          { label: "Managers", pct: 75, color: "#22c55e" },
          { label: "Dealers", pct: 60, color: "#0ea5e9" },
          { label: "Users", pct: 45, color: "#a855f7" },
        ],
      },
    });
  } catch (e) {
    console.error("getDashboardOverview", e);
    res.status(500).json({ message: "Failed to load overview" });
  }
};

export const getReportsPage = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").toLowerCase();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();
    const party = String(req.query.party || "").toLowerCase();
    const product = String(req.query.product || "").toLowerCase();

    const { orders: allRows } = await Dyn.fetchOrdersFiltered({
      tab: "all",
      clientName: "",
      orderStatus: "all",
      paymentStatus: "all",
      managerName: "",
      orderId: "",
      dateFrom: "",
      dateTo: "",
    });
    let rows = allRows;
    if (q) {
      rows = rows.filter(
        (r) =>
          String(r["Order ID"]).toLowerCase().includes(q) ||
          String(r["Client Name"]).toLowerCase().includes(q) ||
          String(r["Manager Name"]).toLowerCase().includes(q)
      );
    }
    if (from) rows = rows.filter((r) => String(r.Date || "") >= from);
    if (to) rows = rows.filter((r) => String(r.Date || "") <= to);
    if (party) {
      rows = rows.filter((r) =>
        String(r["Client Name"] || "")
          .toLowerCase()
          .includes(party)
      );
    }
    if (product) {
      rows = rows.filter((r) =>
        String(r["Products"] || "")
          .toLowerCase()
          .includes(product)
      );
    }

    res.json({
      attendance: {
        totalLabel: "930 Total Employees",
        segments: [
          { label: "Present", pct: 62, color: "#22c55e" },
          { label: "Late In", pct: 12, color: "#f59e0b" },
          { label: "On Leave", pct: 18, color: "#3b82f6" },
          { label: "Absent", pct: 8, color: "#ef4444" },
        ],
      },
      productSales: {
        months: monthShort,
        values: [40, 48, 42, 55, 50, 62, 58, 64, 60, 70, 68, 75],
      },
      salesTrend: {
        months: monthShort,
        revenue: [32, 38, 35, 42, 40, 48, 45, 52, 50, 58, 55, 62],
        expenses: [22, 25, 24, 28, 26, 30, 29, 32, 31, 34, 33, 36],
      },
      paymentAnalytics: {
        totalLabel: "₹70K Total Payments",
        gaugePct: 72,
        legend: [
          { label: "Completed", color: "#22c55e" },
          { label: "Pending", color: "#f59e0b" },
          { label: "Failed", color: "#ef4444" },
        ],
      },
      leadConversion: {
        months: monthShort.slice(0, 6),
        campaign: [42, 45, 48, 44, 50, 52],
        referral: [28, 30, 32, 29, 33, 35],
        user: [18, 20, 22, 21, 23, 25],
      },
      areaWiseSales: [
        { city: "Ahmedabad", value: 92 },
        { city: "Surat", value: 78 },
        { city: "Vadodara", value: 65 },
        { city: "Rajkot", value: 54 },
        { city: "Bhavnagar", value: 41 },
      ],
      bankStatements: {
        totalLabel: "₹70K Total Income",
        incomePct: 58,
        outgoingPct: 42,
      },
      targetVsAchievement: [
        { label: "Collections", current: 118000, max: 150000 },
        { label: "Visits", current: 92000, max: 150000 },
        { label: "Sales", current: 134000, max: 150000 },
      ],
      orders: rows,
    });
  } catch (e) {
    console.error("getReportsPage", e);
    res.status(500).json({ message: "Failed to load reports" });
  }
};

/** @deprecated — use getTargetIncentivePayload in targetAchievement.controller */
export const getTargetIncentive = async (req: Request, res: Response) => {
  const { getTargetIncentivePayload } = await import(
    "./targetAchievement.controller"
  );
  return getTargetIncentivePayload(req, res);
};
