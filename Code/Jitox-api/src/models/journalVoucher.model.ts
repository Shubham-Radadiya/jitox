import mongoose, { Schema } from "mongoose";
import { IJournalVoucher } from "../types/journalVoucher.type";

const journalVoucherSchema = new Schema<IJournalVoucher>(
  {
    voucherNo: { type: String, required: true, trim: true },
    date: { type: Date },
    paymentBy: { type: Schema.Types.ObjectId, ref: "Account", trim: true },
    paymentTo: { type: Schema.Types.ObjectId, ref: "Account", trim: true },
    debitAmount: { type: Number, trim: true },
    creditAmount: { type: Number, trim: true },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Paid"],
    },
  },
  {
    timestamps: true,
  }
);

const JournalVoucher = mongoose.model<IJournalVoucher>(
  "JournalVoucher",
  journalVoucherSchema
);

export default JournalVoucher;
