import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getEmailProvider,
  getTransactionalFromEmail,
  isEmailConfigured,
} from "../helper/sendEmail";

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const mongoReady = mongoose.connection.readyState === 1;
  const jwtConfigured = Boolean(process.env.JWT_SECRET_KEY?.trim());
  const provider = getEmailProvider();
  const emailConfigured = isEmailConfigured();

  const ok = mongoReady && jwtConfigured;

  let emailHint: string | null = null;
  if (!emailConfigured) {
    emailHint =
      "Set SENDGRID_API_KEY (best: verify Gmail only, send to any address, no domain) or BREVO_API_KEY. Resend test mode only reaches your signup email.";
  } else if (provider === "resend") {
    emailHint =
      "Resend test sender: OTP only to your Resend account email. For any Gmail use SENDGRID_API_KEY + Single Sender verification.";
  } else if (provider === "smtp") {
    emailHint =
      "Gmail SMTP blocked on Render FREE — use SENDGRID_API_KEY instead.";
  }

  res.status(ok ? 200 : 503).json({
    ok,
    service: "jitox-api",
    checks: {
      mongo: mongoReady ? "connected" : "disconnected",
      jwt: jwtConfigured ? "configured" : "missing",
      email: emailConfigured ? "configured" : "missing",
      emailProvider: provider ?? "none",
      emailSender: getTransactionalFromEmail(),
    },
    hints: {
      email: emailHint,
      jwt: jwtConfigured ? null : "Set JWT_SECRET_KEY in environment variables.",
    },
  });
};
