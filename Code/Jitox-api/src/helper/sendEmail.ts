import nodemailer from "nodemailer";
import {
  DEFAULT_OTP_SENDER_EMAIL,
  getEmailPass,
  getEmailUser,
} from "../constants/emailConfig";

export type EmailProvider = "sendgrid" | "brevo" | "resend" | "smtp" | null;

/** Verified Gmail as sender — no custom domain required (SendGrid / Brevo). */
export function getTransactionalFromEmail(): string {
  return (
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    getEmailUser()
  );
}

/**
 * Pick email backend. Default order (first match wins):
 * sendgrid → brevo → resend → smtp
 * Override with EMAIL_PROVIDER=sendgrid|brevo|resend|smtp
 */
export function getEmailProvider(): EmailProvider {
  const forced = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (forced === "sendgrid" && process.env.SENDGRID_API_KEY?.trim()) {
    return "sendgrid";
  }
  if (forced === "brevo" && process.env.BREVO_API_KEY?.trim()) {
    return "brevo";
  }
  if (forced === "resend" && process.env.RESEND_API_KEY?.trim()) {
    return "resend";
  }
  if (forced === "smtp" && getEmailPass()) {
    return "smtp";
  }

  if (process.env.SENDGRID_API_KEY?.trim()) return "sendgrid";
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
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

function getSenderName(): string {
  return process.env.EMAIL_SENDER_NAME?.trim() || "Jitox Agro";
}

/** SendGrid — verify one Gmail via Single Sender (no domain). Sends to any address. */
async function sendViaSendGrid({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) throw new Error("SENDGRID_API_KEY is not set");

  const fromEmail = getTransactionalFromEmail();
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to.trim().toLowerCase() }] }],
      from: { email: fromEmail, name: getSenderName() },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = raw || `SendGrid error (${res.status})`;
    try {
      const parsed = JSON.parse(raw) as {
        errors?: Array<{ message?: string }>;
      };
      if (parsed.errors?.length) {
        detail = parsed.errors.map((e) => e.message).filter(Boolean).join("; ");
      }
    } catch {
      /* use raw */
    }
    throw new Error(
      `${detail} — Verify ${fromEmail} under SendGrid → Sender Authentication → Single Sender.`
    );
  }
}

/** Brevo — verify sender email only (no domain). Sends to any address. */
async function sendViaBrevo({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const fromEmail = getTransactionalFromEmail();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: getSenderName(), email: fromEmail },
      to: [{ email: to.trim().toLowerCase() }],
      subject,
      textContent: text,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new Error(
      body.message ||
        `Brevo error (${res.status}) — verify sender ${fromEmail} in Brevo → Senders.`
    );
  }
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
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

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
  };

  if (!res.ok) {
    const detail = body.message || body.name || `Resend API error (${res.status})`;
    const hint =
      res.status === 403
        ? " Use SendGrid/Brevo (single Gmail verification, no domain) or verify a domain in Resend."
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
    from: `"${getSenderName()}" <${fromUser}>`,
    to: to.trim().toLowerCase(),
    subject,
    text,
  });
}

export async function verifyEmailTransport(): Promise<boolean> {
  const provider = getEmailProvider();
  if (!provider) {
    console.warn(
      `[jitox-api] email=MISSING — set SENDGRID_API_KEY or BREVO_API_KEY (no domain; verify Gmail only) or RESEND_API_KEY for ${getEmailUser()}`
    );
    return false;
  }

  const from = getTransactionalFromEmail();

  if (provider === "sendgrid") {
    console.log(
      `[jitox-api] email=ok provider=sendgrid from=${from} (single-sender — any recipient)`
    );
    return true;
  }

  if (provider === "brevo") {
    console.log(
      `[jitox-api] email=ok provider=brevo from=${from} (verified sender — any recipient)`
    );
    return true;
  }

  if (provider === "resend") {
    console.log(
      `[jitox-api] email=ok provider=resend from=${getResendFrom()} (test sender — limited recipients)`
    );
    return true;
  }

  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    console.log(`[jitox-api] email=ok provider=smtp sender=${from}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[jitox-api] email=FAILED provider=smtp — Render FREE blocks SMTP; use SENDGRID_API_KEY:`,
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

  switch (provider) {
    case "sendgrid":
      await sendViaSendGrid({ to, subject, text });
      break;
    case "brevo":
      await sendViaBrevo({ to, subject, text });
      break;
    case "resend":
      await sendViaResend({ to, subject, text });
      break;
    case "smtp":
      await sendViaSmtp({ to, subject, text });
      break;
    default:
      throw new Error("Unknown email provider");
  }
};
