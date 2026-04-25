import mongoose, { Schema } from "mongoose";
import { IReceiptVoucher } from "../types/receiptVoucher.type";

const receiptVoucherSchema = new Schema<IReceiptVoucher>(
  {
    voucherNo: { type: String, required: true, trim: true },
    date: { type: Date },
    receiptThrough: { type: String, trim: true, enum: ["Cash", "Bank"] },
    receiptFrom: { type: String, trim: true },
    amount: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Paid"],
    },
  },
  {
    timestamps: true,
  }
);

const ReceiptVoucher = mongoose.model<IReceiptVoucher>(
  "ReceiptVoucher",
  receiptVoucherSchema
);

export default ReceiptVoucher;
