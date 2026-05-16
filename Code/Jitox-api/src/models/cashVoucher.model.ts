import mongoose, { Schema } from "mongoose";
import { ICashVoucher } from "../types/cashVoucher.type";

const cashVoucherSchema = new Schema<ICashVoucher>(
  {
    voucherNumber: { type: String, required: true, unique: true },
    /** Transaction date chosen by user (optional; UI falls back to createdAt). */
    voucherDate: { type: Date },
    amount: { type: Number, required: true },
    debitFrom: { type: String, required: true },
    creditTo: { type: String, required: true },
    narration: { type: String },
    particulars: { type: String },
    attachmentsFile: { type: String },
  },
  { timestamps: true }
);

const CashVoucher = mongoose.model<ICashVoucher>(
  "CashVoucher",
  cashVoucherSchema
);

export default CashVoucher;
