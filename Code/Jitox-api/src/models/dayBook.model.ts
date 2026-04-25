import mongoose, { Schema } from "mongoose";
import { IDayBook } from "../types/dayBook";

const daybookSchema = new Schema<IDayBook>(
  {
    voucherNumber: { type: String, required: true, unique: true },
    debitAmount: { type: String, required: true },
    creditAmount: { type: String, required: true },
    voucherType: { type: String },
    particulars: { type: String },
  },
  { timestamps: true }
);

const DayBook = mongoose.model<IDayBook>("DaybookSchema", daybookSchema);

export default DayBook;
