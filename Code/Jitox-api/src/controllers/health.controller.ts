import { Request, Response } from "express";
import mongoose from "mongoose";
import { getEmailTransportMode, isRenderHost } from "../constants/emailConfig";
import {
  getEmailProvider,
  getSenderEmail,
  isEmailConfigured,
  resolveEmailTransport,
} from "../helper/sendEmail";
import { isGmailApiConfigured } from "../helper/gmailApi";

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const mongoReady = mongoose.connection.readyState === 1;
  const jwtConfigured = Boolean(process.env.JWT_SECRET_KEY?.trim());
  const emailConfigured = isEmailConfigured();

  const ok = mongoReady && jwtConfigured;

  const activeTransport = resolveEmailTransport();
  const onRender = isRenderHost();
  const gmailApiReady = isGmailApiConfigured();

  let emailHint: string | null = null;
  if (!emailConfigured) {
    emailHint =
      "Set EMAIL_USER=shubhamradadiya@gmail.com plus GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN (npm run gmail:oauth). Or EMAIL_PASS for local SMTP only.";
  } else if (onRender && activeTransport === "gmail_smtp") {
    emailHint =
      "Render blocks SMTP (587/465). Add GMAIL_* OAuth vars (npm run gmail:oauth) — mail still sends from your Gmail via HTTPS.";
  } else if (onRender && !gmailApiReady) {
    emailHint =
      "On Render, EMAIL_PASS (SMTP) will timeout. Run npm run gmail:oauth and set GMAIL_REFRESH_TOKEN on Render.";
  } else if (activeTransport === "gmail_api") {
    emailHint = "Gmail API (HTTPS) — works on Render Free. Sender: your Gmail account.";
  } else {
    emailHint = "Gmail SMTP — use locally; on Render prefer Gmail API (GMAIL_* vars).";
  }

  res.status(ok ? 200 : 503).json({
    ok,
    service: "jitox-api",
    checks: {
      mongo: mongoReady ? "connected" : "disconnected",
      jwt: jwtConfigured ? "configured" : "missing",
      email: emailConfigured ? "configured" : "missing",
      emailProvider: getEmailProvider() ?? "none",
      emailTransport: activeTransport ?? "none",
      emailTransportMode: getEmailTransportMode(),
      emailSender: getSenderEmail(),
      renderHost: onRender,
      gmailApiConfigured: gmailApiReady,
    },
    hints: {
      email: emailHint,
      jwt: jwtConfigured ? null : "Set JWT_SECRET_KEY in environment variables.",
    },
  });
};
