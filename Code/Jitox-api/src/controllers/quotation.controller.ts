import { Request, Response } from "express";
import { Quotation, Product } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { IProductItem } from "../types/quatation.type";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

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
      items,
      paymentMode,
      dueDate,
      gstAmount,
      basePrice,
      totalAmount,
      stockDetails,
    } = req.body;

    const requiredFields = [
      "partyName",
      "voucherNo",
      "voucherDate",
      "items",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const existingVoucher = await Quotation.findOne({ voucherNo });
    if (existingVoucher) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number already exists."
      );
    }

    const existingInvoice = await Quotation.findOne({ invoiceNo });
    if (existingInvoice) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Invoice number already exists."
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

    const newQuotation = new Quotation({
      partyName,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      voucherNo,
      voucherDate,
      items,
      invoiceNo,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      dueDate,
      stockDetails,
    });

    const savedQuotation = await newQuotation.save();
    res.status(201).json({
      message: "Quotation created successfully.",
      data: savedQuotation,
    });
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

    const matchStage: any = {};

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
      "productName category group"
    );

    if (!quotations) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No quotations found.");
    }

    res.status(200).json(quotations);
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
    const updateData = req.body;

    const updatedQuotation = await Quotation.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("items.product", "productName category group");

    if (!updatedQuotation) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No quotations found.");
    }

    res.status(200).json({
      message: "Quotation updated successfully.",
      data: updatedQuotation,
    });
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

    res.status(200).json({ message: "Quotation deleted successfully." });
  } catch (error) {
    console.error("Delete Quoation Error:", error);
    throw error;
  }
};
