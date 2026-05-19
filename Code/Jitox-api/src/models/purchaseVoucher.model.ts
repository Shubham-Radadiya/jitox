import mongoose, { Document, Schema } from "mongoose";
import { IPurchaseItem, IPurchaseVoucher } from "../types/purchaseVoucher.type";

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    rateParUnit: { type: Number, required: true },
    group: { type: String, trim: true },
    category: { type: String, trim: true },
    unit: { type: String, trim: true },
    subtotal: { type: Number, required: true },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    hsn: { type: String, trim: true },
    batch: { type: String, trim: true },
    expDate: { type: String, trim: true },
    mfgDate: { type: String, trim: true },
    mrp: { type: String, trim: true },
  },
  { _id: false }
);

const PurchaseVoucherSchema = new Schema<IPurchaseVoucher>(
  {
    partyName: { type: String, required: true, trim: true },
    invoiceNo: { type: String, trim: true },
    invoicePrefix: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    originalInvNo: { type: String, trim: true },
    ewayBill: { type: String, trim: true },
    termsOfPayment: { type: String, trim: true },
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
    items: [PurchaseItemSchema],
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Credit", "Cheque", "Online"],
    },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Paid", "Unpaid"],
    },
    /** Payment voucher created from this purchase — disables duplicate pay requests. */
    paymentRequestId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentVoucher",
    },

    basePrice: { type: Number, trim: true },
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

const PurchaseVoucher = mongoose.model<IPurchaseVoucher>(
  "PurchaseVoucher",
  PurchaseVoucherSchema
);

export default PurchaseVoucher;
