/** Default Gmail account used to send OTP / system mail when EMAIL_USER is unset. */
export const DEFAULT_OTP_SENDER_EMAIL = "shubhamradadiya@gmail.com";

export function getEmailUser(): string {
  return process.env.EMAIL_USER?.trim() || DEFAULT_OTP_SENDER_EMAIL;
}

/** Gmail App Password — spaces stripped if pasted with gaps. */
export function getEmailPass(): string {
  return (process.env.EMAIL_PASS?.trim() || "").replace(/\s+/g, "");
}

export function isSmtpConfigured(): boolean {
  return Boolean(getEmailPass());
}

export function getGmailClientId(): string {
  return process.env.GMAIL_CLIENT_ID?.trim() || "";
}

export function getGmailClientSecret(): string {
  return process.env.GMAIL_CLIENT_SECRET?.trim() || "";
}

export function getGmailRefreshToken(): string {
  return process.env.GMAIL_REFRESH_TOKEN?.trim() || "";
}

export type EmailTransportMode = "auto" | "smtp" | "gmail_api";

export function getEmailTransportMode(): EmailTransportMode {
  const raw = (process.env.EMAIL_TRANSPORT?.trim() || "auto").toLowerCase();
  if (raw === "smtp" || raw === "gmail_api") return raw;
  return "auto";
}

/** True when hosted on Render (SMTP ports 587/465 are blocked on free tier). */
export function isRenderHost(): boolean {
  return Boolean(process.env.RENDER?.trim());
}
