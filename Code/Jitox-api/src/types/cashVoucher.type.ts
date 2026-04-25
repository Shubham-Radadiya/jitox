import { Document } from "mongoose";

export interface ICashVoucher extends Document {
  voucherNumber: String;
  amount: Number;
  debitFrom: String;
  creditTo: String;
  narration: String;
  attachmentsFile: String;
  particulars: String;
}
