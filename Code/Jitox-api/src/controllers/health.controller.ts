import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getEmailProvider,
  getSenderEmail,
  isEmailConfigured,
} from "../helper/sendEmail";

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const mongoReady = mongoose.connection.readyState === 1;
  const jwtConfigured = Boolean(process.env.JWT_SECRET_KEY?.trim());
  const emailConfigured = isEmailConfigured();

  const ok = mongoReady && jwtConfigured;

  let emailHint: string | null = null;
  if (!emailConfigured) {
    emailHint =
      "Set EMAIL_USER=shubhamradadiya@gmail.com and EMAIL_PASS (Gmail App Password, 16 chars).";
  } else {
    emailHint =
      "Gmail SMTP from code. Render FREE blocks ports 587/465 — use a paid Render instance or host API elsewhere for production email.";
  }

  res.status(ok ? 200 : 503).json({
    ok,
    service: "jitox-api",
    checks: {
      mongo: mongoReady ? "connected" : "disconnected",
      jwt: jwtConfigured ? "configured" : "missing",
      email: emailConfigured ? "configured" : "missing",
      emailProvider: getEmailProvider() ?? "none",
      emailSender: getSenderEmail(),
    },
    hints: {
      email: emailHint,
      jwt: jwtConfigured ? null : "Set JWT_SECRET_KEY in environment variables.",
    },
  });
};
