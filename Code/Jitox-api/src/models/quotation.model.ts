import mongoose, { Schema } from "mongoose";
import { IProductItem, IQuatationVoucher } from "../types/quatation.type";

const ProductItemSchema = new Schema<IProductItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    rateParUnit: { type: Number, required: true },
    group: { type: String, trim: true },
    category: { type: String, trim: true },
    unit: { type: String, trim: true },
    subtotal: { type: Number, trim: true },
  },
  { _id: false }
);

const quotationSchema = new Schema<IQuatationVoucher>(
  {
    partyName: { type: String, required: true, trim: true },
    voucherDate: {
      type: Date,
    },
    voucherNo: { type: String, required: true, trim: true, unique: true },
    invoiceNo: { type: String, trim: true, unique: true, required: true },
    transportDetails: { type: String, trim: true },
    deliveryAt: { type: String, trim: true },
    orderby: { type: String, trim: true },
    shipToAndBillTo: { type: String, trim: true },
    items: [ProductItemSchema],
    paymentMode: {
      type: String,
      trim: true,
      enum: ["Cash", "Credit", "Cheque", "Online"],
    },
    dueDate: { type: Date },
    gstAmount: { type: Number, trim: true },
    basePrice: { type: Number, trim: true },
    totalAmount: { type: Number, trim: true },
    stockDetails: {
      stockQuantity: { type: Boolean, default: true },
      productStatus: { type: Boolean, trim: true },
      generetePurchaseBill: { type: Boolean, default: false },
      updateStockAfterOrderPlaced: { type: Boolean, default: false },
      openingStock: { type: Number, trim: true },
      minimumReOrderLevel: { type: Number, trim: true },
    },
    /** Dashboard order list / tabs (sales quotations as orders). */
    paidAmount: { type: Number, default: 0 },
    dashboardTab: {
      type: String,
      enum: ["pending", "dispatched", "partSupply", "cancelled"],
      default: "pending",
    },
    dashboardOrderStatus: {
      type: String,
      default: "Processing",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Quotation = mongoose.model<IQuatationVoucher>(
  "Quotation",
  quotationSchema
);

export default Quotation;
