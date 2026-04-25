import { Document } from "mongoose";

export interface IAccount extends Document {
  businessName: string;
  accountType: string;
  gstNumber?: string;
  address?: string;
  category?: string;
  name: string;
  email: string;
  mobileNumber: string;
  /** Synced from structured address for backward compatibility */
  residentialAddress?: string;
  residentialFullAddressBackup?: string;
  streetAddress?: string;
  area?: string;
  district?: string;
  country?: string;
  pincode?: string;
  amount: number;
  // fileName: string;
  balenceType: "Credit" | "Debit";
  documentUpload?: string;
  creditLimit?: number;
  paymentTerm?: string;
  areaAssigment?: string;
  /** Extended party / billing fields */
  street?: string;
  shopNo?: string;
  city?: string;
  taluka?: string;
  state?: string;
  pinCode?: string;
  birthday?: string;
  anniversary?: string;
  partyType?: string;
  transportMode?: string;
  deliveryAt?: string;
  customerStatus?: "Active" | "Inactive";
  lastBillingAt?: Date;
}
