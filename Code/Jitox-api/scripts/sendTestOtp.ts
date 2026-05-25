/**
 * Send a test OTP email. Usage (from Jitox-api folder):
 *   set EMAIL_PASS=your-gmail-app-password
 *   npm run test:email
 *
 * Optional: TEST_OTP_TO=recipient@gmail.com (default: shubhamradadiya@gmail.com)
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });

import { getEmailUser } from "../src/constants/emailConfig";
import { isEmailConfigured, sendEmail } from "../src/helper/sendEmail";

const to = (
  process.env.TEST_OTP_TO?.trim() || "shubhamradadiya@gmail.com"
).toLowerCase();

const otp = String(Math.floor(100000 + Math.random() * 900000));

async function main() {
  if (!isEmailConfigured()) {
    console.error(
      `Missing EMAIL_PASS. Set Gmail app password for sender ${getEmailUser()}`
    );
    process.exit(1);
  }

  await sendEmail({
    to,
    subject: "Jitox test OTP",
    text: `Test OTP from Jitox API.\n\nCode: ${otp}\n\nSender: ${getEmailUser()}`,
  });

  console.log(`Sent test OTP ${otp} to ${to} from ${getEmailUser()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
