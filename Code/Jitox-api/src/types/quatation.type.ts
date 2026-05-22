import mongoose, { Document } from "mongoose";

export interface IProductItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  rateParUnit: number;
  amount: number;
  group: string;
  unit: string;
  category: string;
  subtotal: number;
  discountPct?: number;
  discountAmt?: number;
  description?: string;
  hsn?: string;
  batch?: string;
  expDate?: string;
  mfgDate?: string;
  mrp?: string;
}

export interface IQuatationVoucher extends Document {
  partyName: string;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipToPartyName?: string;
  shipDifferent?: boolean;
  voucherNo: string;
  invoiceNo: string;
  voucherDate: Date;
  supplierName: string;
  supplierAddress?: string;
  supplierGstNo?: string;
  items: IProductItem[];
  termsOfPayment?: string;
  narration?: string;
  termsAndConditions?: string;
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  dueDate: Date;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock: Number;
    minimumReOrderLevel: Number;
  };
  addedToOrder?: boolean;
  orderListDecisionMade?: boolean;
  paidAmount?: number;
  receivedAmount?: number;
  returnedAmount?: number;
  customerRefundedAmount?: number;
  paymentStatus?:
    | "Pending"
    | "Partial"
    | "Paid"
    | "Unpaid"
    | "Refund Pending";
  receiptRequestId?: mongoose.Schema.Types.ObjectId;
  dashboardTab?: "pending" | "dispatched" | "partSupply" | "cancelled";
  dashboardOrderStatus?:
    | "Pending"
    | "Dispatched"
    | "Processing"
    | "Cancelled"
    | "Return"
    | "Approved"
    | "Quotation";
  createdAt?: Date;
  updatedAt?: Date;
}
