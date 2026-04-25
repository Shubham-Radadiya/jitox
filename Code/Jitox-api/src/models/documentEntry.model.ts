import mongoose, { Schema } from "mongoose";

export interface IDocumentEntry extends mongoose.Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  admin: string;
  type: string;
  dateIso: string;
  /** Public path e.g. `/uploads/documents/xyz.pdf` */
  fileUrl?: string;
}

const documentEntrySchema = new Schema<IDocumentEntry>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentCategory",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    admin: { type: String, default: "Admin", trim: true },
    type: { type: String, default: "pdf", trim: true },
    dateIso: { type: String, required: true },
    fileUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const DocumentEntry = mongoose.model<IDocumentEntry>(
  "DocumentEntry",
  documentEntrySchema
);

export default DocumentEntry;
