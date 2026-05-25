import { Request, Response } from "express";
import mongoose from "mongoose";
import { isEmailConfigured } from "../helper/sendEmail";

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const mongoReady = mongoose.connection.readyState === 1;
  const jwtConfigured = Boolean(process.env.JWT_SECRET_KEY?.trim());
  const emailConfigured = isEmailConfigured();

  const ok = mongoReady && jwtConfigured;

  res.status(ok ? 200 : 503).json({
    ok,
    service: "jitox-api",
    checks: {
      mongo: mongoReady ? "connected" : "disconnected",
      jwt: jwtConfigured ? "configured" : "missing",
      email: emailConfigured ? "configured" : "missing",
    },
    hints: {
      email:
        emailConfigured
          ? null
          : "Set EMAIL_USER and EMAIL_PASS on Render (Gmail app password) to enable OTP emails.",
      jwt:
        jwtConfigured
          ? null
          : "Set JWT_SECRET_KEY in environment variables.",
    },
  });
};
