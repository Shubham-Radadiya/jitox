import { Document } from "mongoose";

export interface IDayBook extends Document {
  voucherNumber: String;
  amount: Number;
  debitAmount: String;
  creditAmount: String;
  narration: String;
  voucherType: String;
  particulars: String;
}
