import mongoose, { Schema } from "mongoose";

export interface IMarketingScheme extends mongoose.Document {
  schemeName: string;
  appliedProducts: string;
  schemeType: string;
  targetAudience: string;
  offerDetails: string;
  startDate: string;
  endDate: string;
}

const marketingSchemeSchema = new Schema<IMarketingScheme>(
  {
    schemeName: { type: String, required: true, trim: true },
    appliedProducts: { type: String, default: "-" },
    schemeType: { type: String, default: "Cashback", trim: true },
    targetAudience: { type: String, default: "Farmer", trim: true },
    offerDetails: { type: String, default: "-", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
  },
  { timestamps: true }
);

const MarketingScheme = mongoose.model<IMarketingScheme>(
  "MarketingScheme",
  marketingSchemeSchema
);

export default MarketingScheme;
