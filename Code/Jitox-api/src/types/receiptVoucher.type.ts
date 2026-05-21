import { Document } from "mongoose";
import mongoose from "mongoose";

export interface IReceiptVoucher extends Document {
  voucherNo: String;
  date: Date;
  receiptThrough: String;
  receiptFrom: String;
  receivedIn?: String;
  amount: String;
  remarks: String;
  status: String;
  sourceSalesId?: mongoose.Schema.Types.ObjectId;
  sourcePurchaseReturnId?: mongoose.Schema.Types.ObjectId;
  sourceQuotationId?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
