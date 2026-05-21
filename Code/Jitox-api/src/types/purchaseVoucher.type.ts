import mongoose, { Document } from "mongoose";

export interface IPurchaseItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  rateParUnit: number;
  amount: number;
  group: string;
  unit: string;
  category: string;
  subtotal: Number;
  discountPct?: number;
  discountAmt?: number;
  remarks?: string;
  hsn?: string;
  batch?: string;
  expDate?: string;
  mfgDate?: string;
  mrp?: string;
}

export interface IPurchaseVoucher extends Document {
  partyName: string;
  invoiceNo?: string;
  invoicePrefix?: string;
  invoiceNumber?: string;
  originalInvNo?: string;
  ewayBill?: string;
  termsOfPayment?: string;
  dueDate?: Date;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipToPartyName?: string;
  shipDifferent?: boolean;
  narration?: string;
  termsAndConditions?: string;
  voucherNo: string;
  voucherDate: Date;
  supplierName: string;
  supplierAddress?: string;
  supplierGstNo?: string;
  items: IPurchaseItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  paidAmount?: number;
  paymentStatus?: string;
  paymentRequestId?: mongoose.Schema.Types.ObjectId;
  basePrice?: number;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock?: number;
    minimumReOrderLevel?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/** Purchase return voucher — shared item shape; fewer fields than full purchase. */
export interface IPurchaseReturnVoucher extends Document {
  partyName: string;
  invoiceNo?: string;
  dueDate?: Date;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipToPartyName?: string;
  shipDifferent?: boolean;
  voucherNo: string;
  voucherDate: Date;
  items: IPurchaseItem[];
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  refundRequestId?: mongoose.Schema.Types.ObjectId;
  refundedAmount?: number;
  refundStatus?: string;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock?: number;
    minimumReOrderLevel?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
