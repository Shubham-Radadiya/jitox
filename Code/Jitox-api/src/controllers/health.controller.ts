import { Request, Response } from "express";
import mongoose from "mongoose";
import { getEmailUser } from "../constants/emailConfig";
import {
  getEmailProvider,
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
      "Set RESEND_API_KEY (recommended on Render free — SMTP is blocked) or EMAIL_PASS for paid/local SMTP.";
  } else if (provider === "smtp") {
    emailHint =
      "Using Gmail SMTP. On Render FREE tier outbound SMTP is blocked — add RESEND_API_KEY from resend.com instead.";
  }

  res.status(ok ? 200 : 503).json({
    ok,
    service: "jitox-api",
    checks: {
      mongo: mongoReady ? "connected" : "disconnected",
      jwt: jwtConfigured ? "configured" : "missing",
      email: emailConfigured ? "configured" : "missing",
      emailProvider: provider ?? "none",
      emailSender: getEmailUser(),
    },
    hints: {
      email: emailHint,
      jwt: jwtConfigured ? null : "Set JWT_SECRET_KEY in environment variables.",
    },
  });
};
