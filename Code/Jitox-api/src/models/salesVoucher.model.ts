import mongoose, { Schema } from "mongoose";
import { ISalesItem, ISalesVoucher } from "../types/salesVoucher.type";

const SalesItemSchema = new Schema<ISalesItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    rateParUnit: { type: Number, required: true },
    group: { type: String, trim: true },
    category: { type: String, trim: true },
    unit: { type: String, trim: true },
    subtotal: { type: Number, required: true },
    remarks: { type: String, trim: true },
    hsn: { type: String, trim: true },
    batch: { type: String, trim: true },
    expDate: { type: String, trim: true },
    mfgDate: { type: String, trim: true },
    mrp: { type: String, trim: true },
  },
  { _id: false }
);

const SalesVoucherSchema = new Schema<ISalesVoucher>(
  {
    partyName: { type: String, required: true, trim: true },
    invoiceNo: { type: String, trim: true },
    dueDate: { type: Date },
    transportDetails: { type: String, trim: true },
    deliveryAt: { type: String, trim: true },
    orderby: { type: String, trim: true },
    shipToAndBillTo: { type: String, trim: true },
    billTo: { type: String, trim: true },
    shipTo: { type: String, trim: true },
    shipDifferent: { type: Boolean, default: false },
    narration: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    voucherNo: { type: String, required: true, trim: true, unique: true },
    voucherDate: { type: Date, required: true },
    items: [SalesItemSchema],
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Credit", "Cheque", "Online"],
    },
    basePrice: { type: Number, trim: true },
    /** How much of totalAmount has been collected so far. */
    paidAmount: { type: Number, default: 0 },
    /** Payment Voucher created from this sale — non-null disables the "Send Payment Request" row button. */
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentVoucher",
    },
    /** "Pending" until a Receipt voucher reconciles it; flips to "Paid" after. */
    paymentStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Partial", "Paid"],
    },
    /** Pipeline status mirrors the dashboard orders module so the two stay aligned. */
    orderStatus: {
      type: String,
      trim: true,
      default: "Processing",
      enum: ["Processing", "Dispatched", "Completed", "Cancelled"],
    },
    stockDetails: {
      stockQuantity: { type: Boolean, default: true },
      productStatus: { type: Boolean, trim: true },
      generetePurchaseBill: { type: Boolean, default: false },
      updateStockAfterOrderPlaced: { type: Boolean, default: false },
      openingStock: { type: Number, trim: true },
      minimumReOrderLevel: { type: Number, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

const SalesVoucher = mongoose.model<ISalesVoucher>(
  "SalesVoucher",
  SalesVoucherSchema
);

export default SalesVoucher;
