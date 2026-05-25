import nodemailer from "nodemailer";
import {
  DEFAULT_OTP_SENDER_EMAIL,
  getEmailPass,
  getEmailUser,
} from "../constants/emailConfig";

export type EmailProvider = "resend" | "smtp" | null;

/** Resend HTTP API — works on Render free tier (SMTP ports 587/465 are blocked). */
export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (getEmailPass()) return "smtp";
  return null;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null;
}

function getResendFrom(): string {
  const custom = process.env.RESEND_FROM?.trim();
  if (custom) return custom;
  return `Jitox Agro <onboarding@resend.dev>`;
}

async function sendViaResend({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFrom(),
      to: [to.trim().toLowerCase()],
      subject,
      text,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    name?: string;
    id?: string;
  };

  if (!res.ok) {
    const detail =
      body.message ||
      body.name ||
      `Resend API error (${res.status})`;
    const hint =
      res.status === 403
        ? " Resend test mode only allows sending to your Resend account email until you verify a domain at resend.com/domains."
        : "";
    throw new Error(`${detail}${hint}`);
  }
}

function createSmtpTransporter() {
  const user = getEmailUser();
  const pass = getEmailPass();
  if (!pass) {
    throw new Error(
      `EMAIL_PASS must be set (Gmail app password for ${user || DEFAULT_OTP_SENDER_EMAIL})`
    );
  }

  const host = process.env.EMAIL_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure =
    process.env.EMAIL_SECURE === "true" || String(port) === "465";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 15_000,
  });
}

async function sendViaSmtp({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const fromUser = getEmailUser();
  const transporter = createSmtpTransporter();
  await transporter.sendMail({
    from: `"Jitox System" <${fromUser}>`,
    to: to.trim().toLowerCase(),
    subject,
    text,
  });
}

/** Verify configured email transport at startup. */
export async function verifyEmailTransport(): Promise<boolean> {
  const provider = getEmailProvider();
  if (!provider) {
    console.warn(
      `[jitox-api] email=MISSING — set RESEND_API_KEY (Render free) or EMAIL_PASS (paid/local SMTP) for ${getEmailUser()}`
    );
    return false;
  }

  if (provider === "resend") {
    console.log(
      `[jitox-api] email=ok provider=resend from=${getResendFrom()} (HTTPS — works on Render free)`
    );
    return true;
  }

  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    console.log(`[jitox-api] email=ok provider=smtp sender=${getEmailUser()}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[jitox-api] email=FAILED provider=smtp — Render FREE blocks ports 587/465; use RESEND_API_KEY instead:`,
      msg
    );
    return false;
  }
}

export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> => {
  const provider = getEmailProvider();
  if (!provider) {
    throw new Error("Email is not configured");
  }

  if (provider === "resend") {
    await sendViaResend({ to, subject, text });
    return;
  }

  await sendViaSmtp({ to, subject, text });
};
