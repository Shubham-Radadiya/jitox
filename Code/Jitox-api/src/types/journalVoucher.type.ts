import { Document } from "mongoose";

export interface IJournalVoucher extends Document {
  voucherNo: String;
  date: Date;
  paymentBy: String;
  paymentTo: String;
  debitAmount: Number;
  creditAmount: Number;
  remarks: String;
  status: String;
}
