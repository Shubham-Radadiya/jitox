import mongoose, { Schema } from "mongoose";
import { IReceiptVoucher } from "../types/receiptVoucher.type";

const receiptVoucherSchema = new Schema<IReceiptVoucher>(
  {
    voucherNo: { type: String, required: true, trim: true },
    date: { type: Date },
    receiptThrough: { type: String, trim: true, enum: ["Cash", "Bank"] },
    receiptFrom: { type: String, trim: true },
    /** Bank or cash-in-hand account where money was received (Tally-style). */
    receivedIn: { type: String, trim: true },
    amount: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Paid"],
    },
    /** Optional back-link to the sales voucher this collection is against. */
    sourceSalesId: {
      type: Schema.Types.ObjectId,
      ref: "SalesVoucher",
    },
    /** Back-link when refunding a purchase return (supplier pays you back). */
    sourcePurchaseReturnId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseReturnVoucher",
    },
    /** Order list quotation this receipt collects against. */
    sourceQuotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
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
