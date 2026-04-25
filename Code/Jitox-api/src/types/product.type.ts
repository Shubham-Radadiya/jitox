import { Document } from "mongoose";

export interface IProduct extends Document {
  productName: String;
  category: String;
  group: String;
  units: Number;
  billingRatePerUnit: Number;
  alternateUnits: String;
  packingStyle: String;
  where: String;
  mrpPerUnit: String;
  gstRate: String;
  hsnCode?: String;
  productDescription?: String;
  packagingType?: String;
  defaultPackSize?: String;
  batchNo: String;
  mfgDt: Date;
  expDt: Date;
  quantity: Number;
  rate: Number;
  amout: Number;
  stockQuantity: Boolean;
  minimumReorderLevel: Number;
}
