import OtpRecord from "../models/otp.model";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";

export const OTP_VERIFIED = "VERIFIED";
const OTP_TTL_MS = 5 * 60 * 1000;
const VERIFIED_TTL_MS = 30 * 60 * 1000;

export async function saveOtp(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await OtpRecord.findOneAndUpdate(
    { email },
    { email, code, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function clearOtp(email: string): Promise<void> {
  await OtpRecord.deleteOne({ email });
}

export async function markOtpVerified(email: string): Promise<void> {
  await OtpRecord.findOneAndUpdate(
    { email },
    {
      code: OTP_VERIFIED,
      expiresAt: new Date(Date.now() + VERIFIED_TTL_MS),
    },
    { upsert: true }
  );
}

export async function assertOtpVerified(email: string): Promise<void> {
  const record = await OtpRecord.findOne({ email });
  if (!record || record.code !== OTP_VERIFIED) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Email not verified. Please verify the OTP sent to your email."
    );
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await clearOtp(email);
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Verification expired. Please request a new OTP."
    );
  }
}

export async function verifyOtpCode(
  email: string,
  otp: string
): Promise<void> {
  const record = await OtpRecord.findOne({ email });
  if (!record) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "No OTP found for this email. Request a new code."
    );
  }
  if (record.code === OTP_VERIFIED) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "OTP already verified. Continue registration or request a new code."
    );
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await clearOtp(email);
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "OTP expired. Please request a new one."
    );
  }
  if (record.code !== otp) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid OTP.");
  }
  await markOtpVerified(email);
}

export async function assertPasswordResetVerified(email: string): Promise<void> {
  const record = await OtpRecord.findOne({ email });
  if (!record || record.code !== OTP_VERIFIED) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "OTP not verified.");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await clearOtp(email);
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Verification expired. Please verify OTP again."
    );
  }
}
