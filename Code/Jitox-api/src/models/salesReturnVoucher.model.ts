import mongoose, { Schema } from "mongoose";
import { ISalesItem } from "../types/salesVoucher.type";
import { ISalesReturnVoucher } from "../types/salesReturnVoucher.type";

const SalesReturnItemSchema = new Schema<ISalesItem>(
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

const SalesReturnVoucherSchema = new Schema<ISalesReturnVoucher>(
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
    shipToPartyName: { type: String, trim: true },
    shipDifferent: { type: Boolean, default: false },
    narration: { type: String, trim: true },
    returnReason: { type: String, trim: true },
    voucherNo: { type: String, required: true, trim: true, unique: true },
    voucherDate: { type: Date, required: true },
    items: [SalesReturnItemSchema],
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Credit", "Cheque", "Online"],
    },
    basePrice: { type: Number, trim: true },
    approvalStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectReason: { type: String, trim: true },
    rejectNotes: { type: String, trim: true },
    rejectProof: { type: String, trim: true },
    sourceSalesId: {
      type: Schema.Types.ObjectId,
      ref: "SalesVoucher",
    },
    sourceQuotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
    },
    /** Payment voucher created to refund the customer — gates duplicate refund button. */
    refundRequestId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentVoucher",
    },
    refundedAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Processing", "Partial", "Refunded"],
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
  { timestamps: true }
);

const SalesReturnVoucher = mongoose.model<ISalesReturnVoucher>(
  "SalesReturnVoucher",
  SalesReturnVoucherSchema
);

export default SalesReturnVoucher;
