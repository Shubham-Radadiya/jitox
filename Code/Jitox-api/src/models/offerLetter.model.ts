import mongoose, { Schema } from "mongoose";

export interface IOfferLetter {
  candidateName: string;
  position: string;
  salary: number;
  joiningDate: Date;
  companyName: string;
  companyAddress?: string;
  documentPath?: string;
  contentHtml?: string;
}

const offerLetterSchema = new Schema<IOfferLetter>(
  {
    candidateName: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    companyName: { type: String, required: true, trim: true },
    companyAddress: { type: String, trim: true },
    documentPath: { type: String, trim: true },
    contentHtml: { type: String },
  },
  { timestamps: true }
);

const OfferLetter = mongoose.model<IOfferLetter>(
  "OfferLetter",
  offerLetterSchema
);
export default OfferLetter;
