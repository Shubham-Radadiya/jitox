import mongoose, { Document } from "mongoose";

export interface ISalesItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  rateParUnit: number;
  group?: string;
  unit?: string;
  category?: string;
  subtotal: number;
  remarks?: string;
  hsn?: string;
  batch?: string;
  expDate?: string;
  mfgDate?: string;
  mrp?: string;
}

export interface ISalesVoucher extends Document {
  partyName: string;
  invoiceNo?: string;
  dueDate?: Date;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipDifferent?: boolean;
  narration?: string;
  termsAndConditions?: string;
  voucherNo: string;
  voucherDate: Date;
  items: ISalesItem[];
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  paymentStatus?: string;
  orderStatus?: string;
  /** How much of `totalAmount` has been collected so far. */
  paidAmount?: number;
  /** Payment Voucher created from this sale (used to gate the Pay-Request button). */
  paymentRequestId?: mongoose.Schema.Types.ObjectId;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock?: number;
    minimumReOrderLevel?: number;
  };
  createdByUserId?: mongoose.Types.ObjectId;
  territoryId?: mongoose.Types.ObjectId;
  managerUserId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
