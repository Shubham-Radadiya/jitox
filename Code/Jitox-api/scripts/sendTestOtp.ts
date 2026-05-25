/**
 * Send a test OTP via Gmail SMTP. From Jitox-api folder:
 *   npm run test:email
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });

import { getSenderEmail } from "../src/constants/emailConfig";
import {
  getEmailProvider,
  isEmailConfigured,
  resolveEmailTransport,
  sendEmail,
} from "../src/helper/sendEmail";

const to = (
  process.env.TEST_OTP_TO?.trim() || "shubhamradadiya00001@gmail.com"
).toLowerCase();

const otp = String(Math.floor(100000 + Math.random() * 900000));

async function main() {
  if (!isEmailConfigured()) {
    console.error(
      `Set GMAIL_* (npm run gmail:oauth) or EMAIL_PASS for ${getSenderEmail()} in .env.local`
    );
    process.exit(1);
  }

  console.log(
    `Transport: ${resolveEmailTransport()} (provider=${getEmailProvider()})`
  );

  await sendEmail({
    to,
    subject: "Jitox test OTP",
    text: `Test OTP from Jitox API (Gmail SMTP).\n\nCode: ${otp}\n\nFrom: ${getSenderEmail()}`,
  });

  console.log(`Sent test OTP ${otp} to ${to} from ${getSenderEmail()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
