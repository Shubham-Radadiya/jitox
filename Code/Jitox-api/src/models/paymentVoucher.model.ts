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
    /**
     * Back-link to the sales voucher this payment was requested from. Set by
     * `createPaymentVoucher` when the request originates from the sales list;
     * used on `update` (to flip the sale's paymentStatus when this is paid)
     * and on `delete` (to clear the sale's `paymentRequestId`).
     */
    sourceSalesId: {
      type: Schema.Types.ObjectId,
      ref: "SalesVoucher",
    },
    /** Back-link when this payment was requested from a purchase voucher row. */
    sourcePurchaseId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseVoucher",
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
