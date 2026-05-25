import nodemailer from "nodemailer";
import {
  DEFAULT_OTP_SENDER_EMAIL,
  getEmailPass,
  getEmailUser,
} from "../constants/emailConfig";

export function isEmailConfigured(): boolean {
  return Boolean(getEmailUser() && getEmailPass());
}

function createTransporter() {
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
  });
}

/** Call once at startup — logs whether Gmail SMTP accepts the configured credentials. */
export async function verifyEmailTransport(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[jitox-api] email=MISSING — set EMAIL_PASS (Gmail app password for ${getEmailUser()}) to send OTP emails`
    );
    return false;
  }
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log(`[jitox-api] email=ok sender=${getEmailUser()}`);
    return true;
  } catch (err) {
    console.error(
      `[jitox-api] email=FAILED sender=${getEmailUser()} — check EMAIL_PASS (use Gmail App Password, not login password):`,
      err instanceof Error ? err.message : err
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
  const fromUser = getEmailUser();
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Jitox System" <${fromUser}>`,
    to: to.trim().toLowerCase(),
    subject,
    text,
  });
};
