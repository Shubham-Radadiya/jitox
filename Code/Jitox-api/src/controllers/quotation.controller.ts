import { Request, Response } from "express";
import { Quotation, Product } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { IProductItem } from "../types/quatation.type";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import {
  dashboardTabForOrderStatus,
  normalizeOrderStatus,
} from "../constants/orderStatus";

async function computeNextQuotationVoucherNo(): Promise<string> {
  const docs = await Quotation.find().select("voucherNo").lean();
  let max = 0;
  const patterns = [/^QT-(\d+)$/i, /^JITOX-DEMO-QT-(\d+)$/i, /^V(\d+)$/i];
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    for (const re of patterns) {
      const m = re.exec(v);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n)) max = Math.max(max, n);
      }
    }
  }
  const next = max + 1;
  return `QT-${String(next).padStart(3, "0")}`;
}

async function resolveUniqueQuotationVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await Quotation.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextQuotationVoucherNo();
    const taken = await Quotation.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `QT-${Date.now()}`;
}

async function resolveUniqueInvoiceNo(
  requested: string | undefined,
  voucherNo: string
): Promise<string> {
  let candidate = String(requested || "").trim();
  if (!candidate) candidate = `${voucherNo}-INV`;
  for (let i = 0; i < 40; i++) {
    const taken = await Quotation.findOne({ invoiceNo: candidate });
    if (!taken) return candidate;
    candidate = `${voucherNo}-INV-${i + 2}`;
  }
  return `${voucherNo}-INV-${Date.now()}`;
}

function normalizeQuotationItems(items: IProductItem[]): IProductItem[] {
  return items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const rateParUnit = Number(item.rateParUnit) || 0;
    const discountPct = Number(item.discountPct) || 0;
    const discountAmt = Number(item.discountAmt) || 0;
    const subtotal =
      Number(item.subtotal) || quantity * rateParUnit;
    const amount = Number(item.amount) || subtotal;
    return {
      product: item.product,
      quantity,
      rateParUnit,
      amount,
      group: item.group || "",
      category: item.category || "",
      unit: item.unit || "Nos",
      subtotal,
      discountPct,
      discountAmt,
      description: String(item.description ?? "").trim(),
      hsn: String(item.hsn ?? "").trim(),
      batch: String(item.batch ?? "").trim(),
      expDate: String(item.expDate ?? "").trim(),
      mfgDate: String(item.mfgDate ?? "").trim(),
      mrp: String(item.mrp ?? "").trim(),
    };
  });
}

const QUOTATION_PRODUCT_POPULATE =
  "productName category group units hsnCode batchNo mrpPerUnit quantity mfgDt expDt billingRatePerUnit productDescription";

export const createQuotation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      partyName,
      voucherDate,
      voucherNo,
      invoiceNo,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      billTo,
      shipTo,
      shipToPartyName,
      shipDifferent,
      items,
      termsOfPayment,
      narration,
      termsAndConditions,
      paymentMode,
      dueDate,
      gstAmount,
      basePrice,
      totalAmount,
      stockDetails,
    } = req.body;

    const requiredFields = ["partyName", "voucherDate", "items"] as const;

    validateAndRespond(req.body, requiredFields, res);

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "At least one line item is required."
      );
    }

    const productIds = items.map((item: IProductItem) => item.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "One or more product IDs are invalid."
      );
    }

    const resolvedVoucherNo = await resolveUniqueQuotationVoucherNo(voucherNo);
    const resolvedInvoiceNo = await resolveUniqueInvoiceNo(
      invoiceNo,
      resolvedVoucherNo
    );
    const normalizedItems = normalizeQuotationItems(items);

    const newQuotation = new Quotation({
      partyName,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      billTo,
      shipTo,
      shipToPartyName,
      shipDifferent,
      voucherNo: resolvedVoucherNo,
      voucherDate,
      items: normalizedItems,
      invoiceNo: resolvedInvoiceNo,
      termsOfPayment: String(termsOfPayment ?? "").trim(),
      narration: String(narration ?? "").trim(),
      termsAndConditions: String(termsAndConditions ?? "").trim(),
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      dueDate,
      stockDetails,
      addedToOrder: false,
      orderListDecisionMade: false,
      paidAmount: 0,
      dashboardTab: "pending",
      dashboardOrderStatus: "Pending",
    });

    const savedQuotation = await newQuotation.save();
    sendCreated(res, savedQuotation, "Quotation created successfully.");
  } catch (error) {
    console.error("Create Quoation Error:", error);
    throw error;
  }
};

export const getAllQuotations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { partyName, dueDate, dateFrom, dateTo } = req.query;

    const matchStage: Record<string, unknown> = {};

    if (partyName) {
      matchStage.partyName = { $regex: partyName as string, $options: "i" };
    }

    if (dueDate) {
      matchStage.voucherDate = new Date(dueDate as string);
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

    const quotations = await Quotation.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      {
        $project: {
          _id: 1,
          partyName: 1,
          voucherNo: 1,
          voucherDate: 1,
          invoiceNo: 1,
          totalAmount: 1,
          stockDetails: 1,
          dueDate: 1,
          gstAmount: 1,
          paymentMode: 1,
          basePrice: 1,
          paidAmount: 1,
          addedToOrder: 1,
          orderListDecisionMade: 1,
          dashboardTab: 1,
          dashboardOrderStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          "productDetails.productName": 1,
          "productDetails.category": 1,
          "productDetails.group": 1,
        },
      },
    ]);

    sendSuccess(
      res,
      { count: quotations.length, data: quotations },
      quotations.length ? "" : "No quotations found."
    );
  } catch (error) {
    console.error("Get All Quoation Error:", error);
    throw error;
  }
};

export const getQuotationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const quotations = await Quotation.findById(id).populate(
      "items.product",
      QUOTATION_PRODUCT_POPULATE
    );

    if (!quotations) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No quotations found.");
    }

    sendSuccess(res, quotations);
  } catch (error) {
    console.error("Get Quoation by ID Error:", error);
    throw error;
  }
};

export const updateQuotation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (Array.isArray(updateData.items)) {
      updateData.items = normalizeQuotationItems(updateData.items);
    }

    if (updateData.voucherNo) {
      const clash = await Quotation.findOne({
        voucherNo: updateData.voucherNo,
        _id: { $ne: id },
      });
      if (clash) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Voucher number already exists."
        );
      }
    }

    if (updateData.invoiceNo) {
      const clash = await Quotation.findOne({
        invoiceNo: updateData.invoiceNo,
        _id: { $ne: id },
      });
      if (clash) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Invoice number already exists."
        );
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "addedToOrder")) {
      const rawFlag = updateData.addedToOrder;
      const added =
        rawFlag === true ||
        rawFlag === 1 ||
        String(rawFlag).trim().toLowerCase() === "true";
      updateData.addedToOrder = added;
      updateData.orderListDecisionMade = true;
      if (added) {
        const st =
          normalizeOrderStatus(
            String(updateData.dashboardOrderStatus || "")
          ) || "Pending";
        updateData.dashboardOrderStatus = st;
        updateData.dashboardTab = dashboardTabForOrderStatus(st);
      } else {
        updateData.dashboardOrderStatus = "Pending";
        updateData.dashboardTab = "pending";
      }
    }

    if (
      updateData.dashboardOrderStatus != null &&
      !Object.prototype.hasOwnProperty.call(updateData, "addedToOrder")
    ) {
      const normalized = normalizeOrderStatus(
        String(updateData.dashboardOrderStatus)
      );
      if (!normalized) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Invalid order status. Use Pending, Dispatched, Processing, Cancelled, Return, Approved, or Quotation."
        );
      }
      updateData.dashboardOrderStatus = normalized;
      const docBefore = await Quotation.findById(id).select("addedToOrder").lean();
      if (docBefore?.addedToOrder !== false) {
        updateData.dashboardTab = dashboardTabForOrderStatus(normalized);
      }
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("items.product", QUOTATION_PRODUCT_POPULATE);

    if (!updatedQuotation) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No quotations found.");
    }

    sendSuccess(res, updatedQuotation, "Quotation updated successfully.");
  } catch (error) {
    console.error("Update Quoation Error:", error);
    throw error;
  }
};

export const deleteQuotation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedQuotation = await Quotation.findByIdAndDelete(id);
    if (!deletedQuotation) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No quotations found.");
    }

    sendSuccess(res, { ok: true }, "Quotation deleted successfully.");
  } catch (error) {
    console.error("Delete Quoation Error:", error);
    throw error;
  }
};
