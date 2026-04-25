import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set to send email");
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"Jitox System" <${user}>`,
    to,
    subject,
    text,
  });
};
