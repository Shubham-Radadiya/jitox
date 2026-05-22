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
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    description: { type: String, trim: true },
    hsn: { type: String, trim: true },
    batch: { type: String, trim: true },
    expDate: { type: String, trim: true },
    mfgDate: { type: String, trim: true },
    mrp: { type: String, trim: true },
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
    billTo: { type: String, trim: true },
    shipTo: { type: String, trim: true },
    shipToPartyName: { type: String, trim: true },
    shipDifferent: { type: Boolean, default: false },
    items: [ProductItemSchema],
    termsOfPayment: { type: String, trim: true },
    narration: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
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
    /** When true, quotation appears on Dashboard → Order List. */
    addedToOrder: { type: Boolean, default: false },
    /** After user picks add/remove once, hide both action buttons. */
    orderListDecisionMade: { type: Boolean, default: false },
    /** Dashboard order list / tabs (sales quotations as orders). */
    paidAmount: { type: Number, default: 0 },
    /** Total receipts / collections (not reduced by returns). */
    receivedAmount: { type: Number, default: 0 },
    /** Sum of approved sales return amounts — net due = totalAmount − returnedAmount. */
    returnedAmount: { type: Number, default: 0 },
    /** Refund payments posted against linked sales returns. */
    customerRefundedAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      trim: true,
      default: "Pending",
      enum: ["Pending", "Partial", "Paid", "Unpaid", "Refund Pending"],
    },
    /** Receipt voucher that collected payment for this order. */
    receiptRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ReceiptVoucher",
    },
    dashboardTab: {
      type: String,
      enum: ["pending", "dispatched", "partSupply", "cancelled"],
      default: "pending",
    },
    dashboardOrderStatus: {
      type: String,
      enum: [
        "Pending",
        "Dispatched",
        "Processing",
        "Cancelled",
        "Return",
        "Approved",
        "Quotation",
      ],
      default: "Pending",
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
