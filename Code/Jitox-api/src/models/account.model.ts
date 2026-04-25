import mongoose, { Schema } from "mongoose";
import { IAccount } from "../types/account.type";

const accountSchema = new Schema<IAccount>({
  businessName: { type: String, trim: true, required: true },
  accountType: { type: String, trim: true, required: true },
  gstNumber: { type: String, trim: true },
  address: { type: String, trim: true },
  category: { type: String, trim: true },
  name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, required: true },
  mobileNumber: { type: String, trim: true, required: true },
  residentialAddress: { type: String, trim: true },
  residentialFullAddressBackup: { type: String, trim: true },
  streetAddress: { type: String, trim: true },
  area: { type: String, trim: true },
  country: { type: String, trim: true },
  pincode: { type: String, trim: true },
  district: { type: String, trim: true },
  amount: { type: Number, required: true },
  balenceType: {
    type: String,
    trim: true,
    required: true,
    enum: ["Credit", "Debit"],
  },
  // fileName: { type: String, trim: true },
  documentUpload: { type: String, trim: true },
  creditLimit: { type: Number },
  paymentTerm: { type: String, trim: true },
  areaAssigment: { type: String, trim: true },
  street: { type: String, trim: true },
  shopNo: { type: String, trim: true },
  city: { type: String, trim: true },
  taluka: { type: String, trim: true },
  state: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  birthday: { type: String, trim: true },
  anniversary: { type: String, trim: true },
  partyType: { type: String, trim: true },
  transportMode: { type: String, trim: true },
  deliveryAt: { type: String, trim: true },
  customerStatus: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  lastBillingAt: { type: Date },
});

const Account = mongoose.model<IAccount>("Account", accountSchema);

export default Account;
