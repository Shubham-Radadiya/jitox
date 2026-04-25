import mongoose, { Schema } from "mongoose";
import { IExpenseVoucher } from "../types/expenseVoucher.type";

const expenseSchema = new Schema<IExpenseVoucher>(
  {
    startDate: { type: Date, trim: true },
    expenseType: {
      type: String,
      enum: ["Fuel", "Travel", "supplies"],
      trim: true,
    },
    description: { type: String, trim: true },
    paidTo: { type: String, trim: true },
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Card", "UPI", "NEFT"],
    },
    amount: { type: Number, trim: true },
    uploadProof: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const ExpenseVoucher = mongoose.model<IExpenseVoucher>(
  "ExpenseVoucher",
  expenseSchema
);

export default ExpenseVoucher;
