import { Request, Response } from "express";
import { Types } from "mongoose";
import { Account, Product, SalesReturnVoucher, SalesVoucher } from "../models/index";
import type { ISalesItem } from "../types/salesVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";
import {
  applyPartyLedgerDebitToAccountBalance,
} from "../utils/applyPaymentToAccountBalance";
import { applyProductStockDelta } from "../utils/applyProductStockDelta";
import { buildPartyAddressesMap } from "../utils/partyVoucherAddress.util";
import { assertSalesReturnQuantitiesAllowed } from "../utils/validateSalesReturnQty";
import {
  buildOrderFulfillment,
  syncQuotationAfterSalesReturns,
  syncQuotationNetPayableAfterReturns,
} from "../utils/salesReturnOrderSync";

const SALES_RETURN_PATCH_KEYS = [
  "partyName",
  "invoiceNo",
  "dueDate",
  "transportDetails",
  "deliveryAt",
  "orderby",
  "shipToAndBillTo",
  "billTo",
  "shipTo",
  "shipToPartyName",
  "shipDifferent",
  "narration",
  "returnReason",
  "voucherNo",
  "voucherDate",
  "items",
  "gstAmount",
  "totalAmount",
  "paymentMode",
  "basePrice",
  "stockDetails",
  "sourceSalesId",
  "sourceQuotationId",
] as const;

async function computeNextSalesReturnVoucherNo(): Promise<string> {
  const docs = await SalesReturnVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-SRT-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return `JITOX-DEMO-SRT-${String(max + 1).padStart(3, "0")}`;
}

async function resolveUniqueSalesReturnVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await SalesReturnVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextSalesReturnVoucherNo();
    const taken = await SalesReturnVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `JITOX-DEMO-SRT-${Date.now()}`;
}

function shouldUpdateStock(stockDetails: unknown): boolean {
  if (!stockDetails || typeof stockDetails !== "object") return false;
  return Boolean((stockDetails as { stockQuantity?: unknown }).stockQuantity);
}

function resolveStockDetails(stockDetails: unknown): Record<string, unknown> {
  const hasBody =
    stockDetails != null && typeof stockDetails === "object";
  const base = hasBody
    ? { ...(stockDetails as Record<string, unknown>) }
    : {};
  const cutOn =
    hasBody
      ? (base as { stockQuantity?: unknown }).stockQuantity !== false
      : true;
  return {
    generetePurchaseBill: false,
    updateStockAfterOrderPlaced: false,
    ...base,
    stockQuantity: cutOn,
  };
}

function toMongoObjectId(id: unknown): Types.ObjectId | undefined {
  if (id == null) return undefined;
  const s = String(id);
  if (!Types.ObjectId.isValid(s)) return undefined;
  return new Types.ObjectId(s);
}

function assertPending(voucher: { approvalStatus?: string }): void {
  if (String(voucher.approvalStatus || "") !== "Pending") {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Only pending sales returns can be changed."
    );
  }
}

async function resolveSaleLinks(body: Record<string, unknown>): Promise<{
  sourceSalesId?: Types.ObjectId;
  sourceQuotationId?: Types.ObjectId;
}> {
  let sourceSalesId: Types.ObjectId | undefined;
  let sourceQuotationId: Types.ObjectId | undefined;

  if (body.sourceSalesId && Types.ObjectId.isValid(String(body.sourceSalesId))) {
    const sale = await SalesVoucher.findById(body.sourceSalesId).select(
      "_id sourceQuotationId partyName"
    );
    if (!sale) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Linked sales voucher not found.");
    }
    sourceSalesId = toMongoObjectId(sale._id);
    sourceQuotationId = toMongoObjectId(sale.sourceQuotationId);
  }

  if (
    body.sourceQuotationId &&
    Types.ObjectId.isValid(String(body.sourceQuotationId))
  ) {
    sourceQuotationId = new Types.ObjectId(String(body.sourceQuotationId));
    if (!sourceSalesId) {
      const sale = await SalesVoucher.findOne({
        sourceQuotationId,
      }).select("_id");
      sourceSalesId = toMongoObjectId(sale?._id);
    }
  }

  return { sourceSalesId, sourceQuotationId };
}

/** Apply stock in + ledger reverse + day book (approve only). */
async function applyApprovedSalesReturnEffects(
  voucher: InstanceType<typeof SalesReturnVoucher>
): Promise<void> {
  const items = (voucher.items || []) as ISalesItem[];

  if (shouldUpdateStock(voucher.stockDetails)) {
    await applyProductStockDelta(items, +1);
  }

  await applyPartyLedgerDebitToAccountBalance(
    String(voucher.partyName || ""),
    voucher.totalAmount,
    "apply"
  );

  await logDayBookEntry({
    voucherNumber: voucher.voucherNo,
    voucherType: "Sales Return",
    particulars: `${voucher.partyName} — sales return${
      voucher.returnReason ? ` (${voucher.returnReason})` : ""
    }`,
    debitAmount: voucher.totalAmount,
    creditAmount: voucher.totalAmount,
  });

  if (voucher.sourceQuotationId) {
    await syncQuotationAfterSalesReturns(voucher.sourceQuotationId);
  }
}

/** Undo approve effects when deleting an approved return. */
async function reverseApprovedSalesReturnEffects(
  voucher: InstanceType<typeof SalesReturnVoucher>
): Promise<void> {
  const items = (voucher.items || []) as ISalesItem[];

  if (shouldUpdateStock(voucher.stockDetails)) {
    await applyProductStockDelta(items, -1);
  }

  await applyPartyLedgerDebitToAccountBalance(
    String(voucher.partyName || ""),
    voucher.totalAmount,
    "reverse"
  );

  await removeDayBookEntry(voucher.voucherNo);

  if (voucher.sourceQuotationId) {
    await syncQuotationAfterSalesReturns(voucher.sourceQuotationId);
  }
}

export const createSalesReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  validateAndRespond(
    body,
    ["partyName", "voucherDate", "items", "sourceSalesId"] as const,
    res
  );

  const productIds = (body.items as ISalesItem[]).map((item) => item.product);
  const validProducts = await Product.find({ _id: { $in: productIds } });
  if (validProducts.length !== productIds.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "One or more product IDs are invalid."
    );
  }

  const links = await resolveSaleLinks(body);
  if (!links.sourceSalesId) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "A linked sales voucher is required."
    );
  }

  await assertSalesReturnQuantitiesAllowed(
    links.sourceSalesId,
    body.items as ISalesItem[]
  );

  const resolvedVoucherNo = await resolveUniqueSalesReturnVoucherNo(
    String(body.voucherNo || "")
  );

  const saved = await new SalesReturnVoucher({
    partyName: body.partyName,
    invoiceNo: body.invoiceNo,
    dueDate: body.dueDate,
    transportDetails: body.transportDetails,
    deliveryAt: body.deliveryAt,
    orderby: body.orderby,
    shipToAndBillTo: body.shipToAndBillTo,
    billTo: body.billTo,
    shipTo: body.shipTo,
    shipToPartyName: body.shipToPartyName,
    shipDifferent: body.shipDifferent,
    narration: body.narration,
    returnReason: body.returnReason,
    voucherNo: resolvedVoucherNo,
    voucherDate: body.voucherDate,
    items: body.items,
    gstAmount: body.gstAmount,
    totalAmount: body.totalAmount,
    paymentMode: body.paymentMode,
    basePrice: body.basePrice,
    approvalStatus: "Pending",
    stockDetails: resolveStockDetails(body.stockDetails),
    ...(links.sourceSalesId ? { sourceSalesId: links.sourceSalesId } : {}),
    ...(links.sourceQuotationId
      ? { sourceQuotationId: links.sourceQuotationId }
      : {}),
  }).save();

  if (links.sourceQuotationId) {
    await syncQuotationAfterSalesReturns(links.sourceQuotationId);
  }

  sendCreated(
    res,
    saved,
    "Sales return saved as Pending. Approve to update stock and ledger."
  );
};

/** Save adjusted lines from approve form, then stock in + ledger + order sync. */
export const finalizeSalesReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const raw = req.body as Record<string, unknown>;
  const voucher = await SalesReturnVoucher.findById(id);
  if (!voucher) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Sales return not found.");
  }
  assertPending(voucher);

  const patch: Record<string, unknown> = {};
  for (const key of SALES_RETURN_PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      patch[key] = raw[key];
    }
  }
  if (patch.stockDetails != null) {
    patch.stockDetails = resolveStockDetails(patch.stockDetails);
  }

  voucher.set(patch);
  await voucher.save();

  await assertSalesReturnQuantitiesAllowed(
    voucher.sourceSalesId,
    voucher.items as ISalesItem[],
    voucher._id
  );

  voucher.approvalStatus = "Approved";
  voucher.approvedAt = new Date();
  voucher.rejectedAt = undefined;
  await voucher.save();

  await applyApprovedSalesReturnEffects(voucher);

  await voucher.populate({
    path: "items.product",
    select: "productName category group",
  });

  sendSuccess(
    res,
    voucher,
    "Sales return approved — stock and ledger updated."
  );
};

export const rejectSalesReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const voucher = await SalesReturnVoucher.findById(id);
  if (!voucher) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Sales return not found.");
  }
  assertPending(voucher);

  voucher.approvalStatus = "Rejected";
  voucher.rejectedAt = new Date();
  voucher.approvedAt = undefined;
  await voucher.save();

  if (voucher.sourceQuotationId) {
    await syncQuotationAfterSalesReturns(voucher.sourceQuotationId);
    await syncQuotationNetPayableAfterReturns(voucher.sourceQuotationId);
  }

  sendSuccess(res, voucher, "Sales return rejected.");
};

function mapSaleDocToReturnItems(sale: {
  items?: Array<Record<string, unknown>>;
}): ISalesItem[] {
  const rows: ISalesItem[] = [];
  for (const it of sale.items || []) {
    const qty = Number(it.quantity) || 0;
    if (qty <= 0) continue;
    const rate = Number(it.rateParUnit) || 0;
    const subtotal =
      Number(it.subtotal) > 0 ? Number(it.subtotal) : qty * rate;
    rows.push({
      product: it.product as ISalesItem["product"],
      quantity: qty,
      rateParUnit: rate,
      group: String(it.group || ""),
      category: String(it.category || ""),
      unit: String(it.unit || "Nos"),
      subtotal,
      hsn: String(it.hsn || ""),
      batch: String(it.batch || ""),
      expDate: String(it.expDate || ""),
      mfgDate: String(it.mfgDate || ""),
      mrp: String(it.mrp || ""),
    });
  }
  return rows;
}

function totalsFromReturnItems(items: ISalesItem[], sale: {
  gstAmount?: unknown;
  basePrice?: unknown;
  totalAmount?: unknown;
}) {
  const basePrice = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const saleBase = Number(sale.basePrice) || 0;
  const saleGst = Number(sale.gstAmount) || 0;
  const gstAmount =
    saleBase > 0 && saleGst >= 0
      ? Math.round((basePrice / saleBase) * saleGst)
      : 0;
  const totalAmount = basePrice + gstAmount;
  return { basePrice, gstAmount, totalAmount };
}

async function loadSaleForQuotation(quotationId: string) {
  const sale = await SalesVoucher.findOne({
    sourceQuotationId: quotationId,
  })
    .populate("items.product", "productName category group unit")
    .lean();
  if (!sale) {
    throw new AppError(
      HttpStatusCode.NOT_FOUND,
      "No sales voucher linked to this order. Create a sales voucher first."
    );
  }
  return sale;
}

/** One-click from order list: pending return row copied from sale (no form). */
export const createSalesReturnFromQuotation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quotationId } = req.params;
  if (!Types.ObjectId.isValid(String(quotationId))) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid order id.");
  }

  const sale = await loadSaleForQuotation(String(quotationId));
  const items = mapSaleDocToReturnItems(sale);
  if (!items.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Sales voucher has no returnable line items."
    );
  }

  const { basePrice, gstAmount, totalAmount } = totalsFromReturnItems(
    items,
    sale
  );
  const links = await resolveSaleLinks({
    sourceSalesId: String(sale._id),
    sourceQuotationId: quotationId,
  });

  const saved = await new SalesReturnVoucher({
    partyName: sale.partyName,
    voucherNo: await resolveUniqueSalesReturnVoucherNo(),
    voucherDate: new Date(),
    items,
    gstAmount,
    totalAmount,
    basePrice,
    paymentMode: sale.paymentMode,
    billTo: sale.billTo,
    shipTo: sale.shipTo,
    shipToPartyName: sale.shipToPartyName,
    shipDifferent: sale.shipDifferent,
    narration: `Return draft for sale ${sale.voucherNo || ""}`.trim(),
    returnReason: "",
    approvalStatus: "Pending",
    stockDetails: resolveStockDetails({ stockQuantity: true }),
    ...(links.sourceSalesId ? { sourceSalesId: links.sourceSalesId } : {}),
    ...(links.sourceQuotationId
      ? { sourceQuotationId: links.sourceQuotationId }
      : {}),
  }).save();

  if (links.sourceQuotationId) {
    await syncQuotationAfterSalesReturns(links.sourceQuotationId);
  }

  sendCreated(
    res,
    saved,
    "Sales return added (Pending). Use Approve on Sales Return list to review and confirm."
  );
};

export const getPrefillFromQuotation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { quotationId } = req.params;
  if (!Types.ObjectId.isValid(String(quotationId))) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid order id.");
  }

  const sale = await loadSaleForQuotation(String(quotationId));
  const fulfillment = await buildOrderFulfillment(quotationId);
  const nextSalesReturnVoucherNo = await computeNextSalesReturnVoucherNo();

  const lines = (sale.items || []).map((it: Record<string, unknown>) => {
    const prod = it.product as { _id?: unknown; productName?: string } | undefined;
    const pid = String(prod?._id || it.product || "");
    const f = fulfillment?.lines.find((l) => l.productId === pid);
    const sold = Number(it.quantity) || 0;
    const returned = f?.returnedQty ?? 0;
    const maxReturn = Math.max(0, sold - returned);
    return {
      product: pid,
      productName: prod?.productName || "",
      group: String(it.group || ""),
      category: String(it.category || ""),
      unit: String(it.unit || "Nos"),
      rateParUnit: Number(it.rateParUnit) || 0,
      soldQty: sold,
      returnedQty: returned,
      maxReturnQty: maxReturn,
      qty: String(maxReturn),
      hsn: String(it.hsn || ""),
      batch: String(it.batch || ""),
      expDate: String(it.expDate || ""),
      mfgDate: String(it.mfgDate || ""),
      mrp: String(it.mrp || ""),
    };
  });

  sendSuccess(res, {
    nextSalesReturnVoucherNo,
    sourceSalesId: String(sale._id),
    sourceQuotationId: String(quotationId),
    partyName: sale.partyName,
    salesVoucherNo: sale.voucherNo,
    lines,
    fulfillment,
  });
};

export const getAllSalesReturnVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { partyName, dateFrom, dateTo } = req.query;
  const matchStage: Record<string, unknown> = {};

  if (partyName) {
    matchStage.partyName = { $regex: partyName as string, $options: "i" };
  }
  if (dateFrom && dateTo) {
    matchStage.voucherDate = {
      $gte: new Date(dateFrom as string),
      $lte: new Date(dateTo as string),
    };
  } else if (dateFrom) {
    matchStage.voucherDate = { $gte: new Date(dateFrom as string) };
  } else if (dateTo) {
    matchStage.voucherDate = { $lte: new Date(dateTo as string) };
  }

  const vouchers = await SalesReturnVoucher.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "salesvouchers",
        localField: "sourceSalesId",
        foreignField: "_id",
        as: "saleDoc",
      },
    },
    {
      $project: {
        partyName: 1,
        voucherNo: 1,
        voucherDate: 1,
        totalAmount: 1,
        gstAmount: 1,
        approvalStatus: 1,
        returnReason: 1,
        narration: 1,
        items: 1,
        sourceSalesId: 1,
        sourceQuotationId: 1,
        stockDetails: 1,
        createdAt: 1,
        salesInvoiceNo: { $arrayElemAt: ["$saleDoc.voucherNo", 0] },
        salePaymentStatus: { $arrayElemAt: ["$saleDoc.paymentStatus", 0] },
        salePaidAmount: { $arrayElemAt: ["$saleDoc.paidAmount", 0] },
        refundRequestId: 1,
        refundedAmount: 1,
        refundStatus: 1,
      },
    },
  ]);

  sendSuccess(
    res,
    { count: vouchers.length, data: vouchers },
    vouchers.length ? "" : "No sales return vouchers found."
  );
};

export const getSalesReturnVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const voucher = await SalesReturnVoucher.findById(req.params.id).populate(
    "items.product",
    "productName category group"
  );
  if (!voucher) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Sales return not found.");
  }
  sendSuccess(res, voucher);
};

export const updateSalesReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const raw = req.body as Record<string, unknown>;
  const voucher = await SalesReturnVoucher.findById(id);
  if (!voucher) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Sales return not found.");
  }
  assertPending(voucher);

  const patch: Record<string, unknown> = {};
  for (const key of SALES_RETURN_PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      patch[key] = raw[key];
    }
  }
  if (patch.stockDetails != null) {
    patch.stockDetails = resolveStockDetails(patch.stockDetails);
  }

  voucher.set(patch);
  await voucher.save();

  await assertSalesReturnQuantitiesAllowed(
    voucher.sourceSalesId,
    voucher.items as ISalesItem[],
    voucher._id
  );

  await voucher.populate({
    path: "items.product",
    select: "productName category group",
  });

  sendSuccess(res, voucher, "Sales return updated.");
};

export const deleteSalesReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const voucher = await SalesReturnVoucher.findById(req.params.id);
  if (!voucher) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Sales return not found.");
  }

  if (voucher.approvalStatus === "Approved") {
    await reverseApprovedSalesReturnEffects(voucher);
  } else if (voucher.approvalStatus !== "Pending" && voucher.approvalStatus !== "Rejected") {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Cannot delete this return.");
  }

  const quotationId = voucher.sourceQuotationId;
  await SalesReturnVoucher.findByIdAndDelete(voucher._id);

  if (quotationId) {
    await syncQuotationAfterSalesReturns(quotationId);
    await syncQuotationNetPayableAfterReturns(quotationId);
  }

  sendSuccess(res, null, "Sales return deleted.");
};

export const getSalesReturnFormMeta = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const accounts = (await Account.find({
    customerStatus: { $ne: "Inactive" },
  })
    .select(
      "businessName name address residentialAddress businessStreetAddress businessArea businessCity businessTaluka businessDistrict businessState businessPincode businessCountry streetAddress street area taluka district state country pincode pinCode"
    )
    .sort({ businessName: 1 })
    .lean()) as unknown as Array<Record<string, unknown>>;

  const seen = new Set<string>();
  const parties: { value: string; label: string }[] = [];
  for (const a of accounts) {
    const name = String(a?.businessName ?? "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    parties.push({ value: name, label: name });
  }

  sendSuccess(res, {
    nextSalesReturnVoucherNo: await computeNextSalesReturnVoucherNo(),
    parties,
    partyAddresses: buildPartyAddressesMap(accounts),
  });
};
