import { Document } from "mongoose";

export interface IReceiptVoucher extends Document {
  voucherNo: String;
  date: Date;
  receiptThrough: String;
  receiptFrom: String;
  amount: String;
  remarks: String;
  status: String;
  createdAt: Date;
  updatedAt: Date;
}
