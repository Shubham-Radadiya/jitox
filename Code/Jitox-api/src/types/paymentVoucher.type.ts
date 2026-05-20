import mongoose, { Document } from "mongoose";

export interface IPaymentVoucher extends Document {
  voucherNo: String;
  date: Date;
  paymentThrough: String;
  paymentFrom?: String;
  paymentTo: String;
  amount: String;
  remarks: String;
  status: String;
  /** Optional back-link to a sales voucher this payment was requested for. */
  sourceSalesId?: mongoose.Schema.Types.ObjectId;
  /** Optional back-link to a purchase voucher this payment was requested for. */
  sourcePurchaseId?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
