import mongoose, { Schema, Types } from "mongoose";

export interface IAppointmentLetter {
  employeeId?: Types.ObjectId;
  employeeName: string;
  position: string;
  department: string;
  joiningDate: Date;
  companyName: string;
  companyAddress?: string;
  documentPath?: string;
  contentHtml?: string;
}

const appointmentLetterSchema = new Schema<IAppointmentLetter>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    employeeName: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    joiningDate: { type: Date, required: true },
    companyName: { type: String, required: true, trim: true },
    companyAddress: { type: String, trim: true },
    documentPath: { type: String, trim: true },
    contentHtml: { type: String },
  },
  { timestamps: true }
);

const AppointmentLetter = mongoose.model<IAppointmentLetter>(
  "AppointmentLetter",
  appointmentLetterSchema
);
export default AppointmentLetter;
