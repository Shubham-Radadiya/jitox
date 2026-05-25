/** Default Gmail account used to send OTP / system mail when EMAIL_USER is unset. */
export const DEFAULT_OTP_SENDER_EMAIL = "shubhamradadiya@gmail.com";

export function getEmailUser(): string {
  return process.env.EMAIL_USER?.trim() || DEFAULT_OTP_SENDER_EMAIL;
}

/** Gmail App Password — spaces stripped if pasted with gaps. */
export function getEmailPass(): string {
  return (process.env.EMAIL_PASS?.trim() || "").replace(/\s+/g, "");
}
