import mongoose, { Document, Schema } from "mongoose";
import {
  IPurchaseItem,
  IPurchaseReturnVoucher,
} from "../types/purchaseVoucher.type";

const PurchaseReturnItemSchema = new Schema<IPurchaseItem>(
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

const PurchaseReturnVoucherSchema = new Schema<IPurchaseReturnVoucher>(
  {
    partyName: { type: String, required: true, trim: true },
    transportDetails: { type: String, trim: true },
    deliveryAt: { type: String, trim: true },
    orderby: { type: String, trim: true },
    shipToAndBillTo: { type: String, trim: true },
    voucherNo: { type: String, required: true, trim: true, unique: true },
    voucherDate: { type: Date, required: true },
    items: [PurchaseReturnItemSchema],
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Credit", "Cheque", "Online"],
    },
    basePrice: { type: Number, trim: true },
    /** Receipt voucher created for supplier refund — gates duplicate refund button. */
    refundRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ReceiptVoucher",
    },
    refundedAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Partial", "Received"],
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

const PurchaseReturnVoucher = mongoose.model<IPurchaseReturnVoucher>(
  "PurchaseReturnVoucher",
  PurchaseReturnVoucherSchema
);

export default PurchaseReturnVoucher;
