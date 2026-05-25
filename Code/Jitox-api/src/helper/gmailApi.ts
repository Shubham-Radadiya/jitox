import {
  getEmailUser,
  getGmailClientId,
  getGmailClientSecret,
  getGmailRefreshToken,
} from "../constants/emailConfig";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function isGmailApiConfigured(): boolean {
  return Boolean(
    getGmailClientId() && getGmailClientSecret() && getGmailRefreshToken()
  );
}

async function fetchAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGmailClientId(),
      client_secret: getGmailClientSecret(),
      refresh_token: getGmailRefreshToken(),
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    const detail = data.error_description || data.error || res.statusText;
    throw new Error(`Gmail API auth failed: ${detail}`);
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

function encodeMimeForGmail(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage(opts: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
}): string {
  const lines = [
    `From: "${opts.fromName}" <${opts.fromEmail}>`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    opts.text,
  ];
  return lines.join("\r\n");
}

/** Send mail via Gmail REST API (HTTPS) — works on Render Free where SMTP is blocked. */
export async function sendEmailViaGmailApi(opts: {
  to: string;
  subject: string;
  text: string;
  fromName: string;
}): Promise<void> {
  const accessToken = await fetchAccessToken();
  const fromEmail = getEmailUser();
  const raw = buildMimeMessage({
    fromName: opts.fromName,
    fromEmail,
    to: opts.to.trim().toLowerCase(),
    subject: opts.subject,
    text: opts.text,
  });

  const res = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodeMimeForGmail(raw) }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Gmail API send failed (${res.status}): ${body.slice(0, 300)}`
    );
  }
}

/** Verify refresh token can obtain an access token. */
export async function verifyGmailApiTransport(): Promise<boolean> {
  if (!isGmailApiConfigured()) return false;
  try {
    await fetchAccessToken();
    console.log(
      `[jitox-api] email=ok provider=gmail-api from=${getEmailUser()} (HTTPS, works on Render Free)`
    );
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[jitox-api] email=FAILED gmail-api:`, msg);
    return false;
  }
}

export { GMAIL_SEND_SCOPE };
