import { Document } from "mongoose";

export interface IExpenseVoucher extends Document {
  startDate: Date;
  expenseType: String;
  description: String;
  paidTo: String;
  paymentMode: String;
  amount: Number;
  uploadProof: String;
}
