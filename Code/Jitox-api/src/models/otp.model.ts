import mongoose, { Schema } from "mongoose";

/** Email OTP codes — persisted so verification works across deploys/restarts (e.g. Render). */
const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, unique: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpRecord =
  mongoose.models.OtpRecord ||
  mongoose.model("OtpRecord", otpSchema);

export default OtpRecord;
