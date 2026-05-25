import nodemailer from "nodemailer";
import {
  DEFAULT_OTP_SENDER_EMAIL,
  getEmailPass,
  getEmailUser,
} from "../constants/emailConfig";

/** OTP mail is sent only via Gmail SMTP from your app (no Resend/SendGrid/etc.). */
export type EmailProvider = "gmail" | null;

export function getEmailProvider(): EmailProvider {
  return getEmailPass() ? "gmail" : null;
}

export function isEmailConfigured(): boolean {
  return Boolean(getEmailPass());
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

/** Verify Gmail SMTP credentials when the server starts. */
export async function verifyEmailTransport(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[jitox-api] email=MISSING — set EMAIL_USER and EMAIL_PASS (Gmail App Password for ${DEFAULT_OTP_SENDER_EMAIL})`
    );
    return false;
  }

  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    console.log(
      `[jitox-api] email=ok provider=gmail-smtp from=${getSenderEmail()} (direct from code, no third-party sender)`
    );
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[jitox-api] email=FAILED gmail-smtp:`, msg);
    if (/timeout|ETIMEDOUT|ECONNECTION/i.test(msg)) {
      console.error(
        "[jitox-api] Hint: Render FREE blocks SMTP ports 587/465. Upgrade Render plan or host API where SMTP is allowed."
      );
    }
    return false;
  }
}

/** Send plain-text mail from shubhamradadiya@gmail.com (or EMAIL_USER) via Gmail SMTP. */
export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> => {
  if (!isEmailConfigured()) {
    throw new Error(
      `Email not configured. Set EMAIL_PASS (Gmail App Password for ${getSenderEmail()}).`
    );
  }

  const transporter = createGmailTransporter();
  await transporter.sendMail({
    from: `"${getSenderName()}" <${getSenderEmail()}>`,
    to: to.trim().toLowerCase(),
    subject,
    text,
  });
};
