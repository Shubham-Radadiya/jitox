import { Document } from "mongoose";

export interface IPaymentVoucher extends Document {
  voucherNo: String;
  date: Date;
  paymentThrough: String;
  paymentTo: String;
  amount: String;
  remarks: String;
  status: String;
  createdAt: Date;
  updatedAt: Date;
}
