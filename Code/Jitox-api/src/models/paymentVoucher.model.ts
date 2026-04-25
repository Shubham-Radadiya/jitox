import mongoose, { Schema } from "mongoose";
import { IPaymentVoucher } from "../types/paymentVoucher.type";

const paymentVoucherSchema = new Schema<IPaymentVoucher>(
  {
    voucherNo: { type: String, required: true, trim: true },
    date: { type: Date },
    paymentThrough: { type: String, trim: true, enum: ["Cash", "Bank"] },
    paymentTo: { type: String, trim: true },
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

const PaymentVoucher = mongoose.model<IPaymentVoucher>(
  "PaymentVoucher",
  paymentVoucherSchema
);

export default PaymentVoucher;
