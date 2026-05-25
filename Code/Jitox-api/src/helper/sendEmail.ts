import nodemailer from "nodemailer";
import {
  DEFAULT_OTP_SENDER_EMAIL,
  getEmailPass,
  getEmailTransportMode,
  getEmailUser,
  isRenderHost,
  isSmtpConfigured,
} from "../constants/emailConfig";
import {
  isGmailApiConfigured,
  sendEmailViaGmailApi,
  verifyGmailApiTransport,
} from "./gmailApi";

export type EmailProvider = "gmail_api" | "gmail_smtp" | null;
export type ActiveEmailTransport = "gmail_api" | "gmail_smtp";

export function isEmailConfigured(): boolean {
  return isSmtpConfigured() || isGmailApiConfigured();
}

/** Which transport will send the next email. */
export function resolveEmailTransport(): ActiveEmailTransport | null {
  if (!isEmailConfigured()) return null;

  const mode = getEmailTransportMode();
  if (mode === "smtp") {
    return isSmtpConfigured() ? "gmail_smtp" : null;
  }
  if (mode === "gmail_api") {
    return isGmailApiConfigured() ? "gmail_api" : null;
  }

  // auto
  if (isRenderHost() && isGmailApiConfigured()) return "gmail_api";
  if (isGmailApiConfigured() && !isSmtpConfigured()) return "gmail_api";
  if (isSmtpConfigured() && !isGmailApiConfigured()) return "gmail_smtp";
  if (isGmailApiConfigured() && isSmtpConfigured()) {
    return isRenderHost() ? "gmail_api" : "gmail_smtp";
  }
  return null;
}

export function getEmailProvider(): EmailProvider {
  return resolveEmailTransport();
}

export function getSenderEmail(): string {
  return getEmailUser();
}

function getSenderName(): string {
  return process.env.EMAIL_SENDER_NAME?.trim() || "Jitox Agro";
}

function createGmailTransporter() {
  const user = getEmailUser();
  const pass = getEmailPass();
  if (!pass) {
    throw new Error(
      `EMAIL_PASS is required (Gmail App Password for ${user}). Create one at https://myaccount.google.com/apppasswords`
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
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 25_000,
  });
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const transporter = createGmailTransporter();
  await transporter.sendMail({
    from: `"${getSenderName()}" <${getSenderEmail()}>`,
    to: opts.to.trim().toLowerCase(),
    subject: opts.subject,
    text: opts.text,
  });
}

/** Verify the active email transport on startup. */
export async function verifyEmailTransport(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[jitox-api] email=MISSING — set Gmail API (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) for Render, or EMAIL_PASS for local SMTP (${DEFAULT_OTP_SENDER_EMAIL})`
    );
    return false;
  }

  const transport = resolveEmailTransport();
  if (!transport) {
    console.warn(
      `[jitox-api] email=MISSING — EMAIL_TRANSPORT=${getEmailTransportMode()} but required credentials are not set`
    );
    return false;
  }

  if (transport === "gmail_api") {
    return verifyGmailApiTransport();
  }

  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    console.log(
      `[jitox-api] email=ok provider=gmail-smtp from=${getSenderEmail()}`
    );
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[jitox-api] email=FAILED gmail-smtp:`, msg);
    if (/timeout|ETIMEDOUT|ECONNECTION/i.test(msg)) {
      console.error(
        "[jitox-api] Hint: Render blocks SMTP. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN and EMAIL_TRANSPORT=gmail_api (or auto)."
      );
    }
    return false;
  }
}

/** Send OTP / system mail from shubhamradadiya@gmail.com (no Resend/SendGrid). */
export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> => {
  const transport = resolveEmailTransport();
  if (!transport) {
    throw new Error(
      `Email not configured. On Render set GMAIL_* OAuth vars; locally set EMAIL_PASS or GMAIL_* for ${getSenderEmail()}.`
    );
  }

  if (transport === "gmail_api") {
    await sendEmailViaGmailApi({
      to,
      subject,
      text,
      fromName: getSenderName(),
    });
    return;
  }

  await sendViaSmtp({ to, subject, text });
};
