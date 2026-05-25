import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim()
  );
}

function createTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set to send email");
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

export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> => {
  const fromUser = process.env.EMAIL_USER?.trim();
  if (!fromUser) {
    throw new Error("EMAIL_USER is not set");
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Jitox System" <${fromUser}>`,
    to: to.trim().toLowerCase(),
    subject,
    text,
  });
};
