import { Request, Response } from "express";
import { PurchaseReturnVoucher, Product } from "../models/index";
import { IPurchaseItem } from "../types/purchaseVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

export const createPurchaseReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      voucherNo,
      voucherDate,
      items,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      stockDetails,
    } = req.body;

    const requiredFields = [
      "partyName",
      "voucherNo",
      "voucherDate",
      "items",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const existingVoucher = await PurchaseReturnVoucher.findOne({ voucherNo });
    if (existingVoucher) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number already exists."
      );
      return;
    }

    const productIds = items.map((item: IPurchaseItem) => item.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "One or more product IDs are invalid."
      );
    }

    const newVoucher = new PurchaseReturnVoucher({
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      voucherNo,
      voucherDate,
      items,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      stockDetails,
    });

    const savedVoucher = await newVoucher.save();
    res.status(201).json({
      message: "Purchase return voucher created successfully.",
      data: savedVoucher,
    });
  } catch (error) {
    console.error("Create Purchase return voucher Error:", error);
    throw error;
  }
};

export const getAllPurchaseReturnVouchers = async (
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
      matchStage.dueDate = new Date(dueDate as string);
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

    const vouchers = await PurchaseReturnVoucher.aggregate([
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
          totalAmount: 1,
          invoiceNo: 1,
          dueDate: 1,
          stockDetails: 1,
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
      { count: vouchers.length, data: vouchers },
      vouchers.length ? "" : "No purchase return vouchers found."
    );
  } catch (error) {
    console.error("Get All Purchase return vouchers Error:", error);
    throw error;
  }
};

export const getPurchaseReturnVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await PurchaseReturnVoucher.findById(id).populate(
      "items.product",
      "productName category group"
    );

    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Purchase return voucher by ID Error:", error);
    throw error;
  }
};

export const updatePurchaseReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingVoucher = await PurchaseReturnVoucher.findOne({
      voucherNo: updateData?.voucherNo,
    });
    if (existingVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    const updatedVoucher = await PurchaseReturnVoucher.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("items.product", "productName category group");

    if (!updatedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    res.status(200).json({
      message: "Purchase return voucher updated successfully.",
      data: updatedVoucher,
    });
  } catch (error) {
    console.error("Update Purchase return voucher Error:", error);
    throw error;
  }
};

export const deletePurchaseReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVoucher = await PurchaseReturnVoucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    res
      .status(200)
      .json({ message: "Purchase return voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Purchase return voucher Error:", error);
    throw error;
  }
};
