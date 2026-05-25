/**
 * Standalone: seed per-user test data (GPS, visits, tasks, orders, expenses).
 * Usage: npm run seed:user-test
 */
import dotenv from "dotenv";
import path from "path";
import connectDB from "../config/db.config";
import { seedUserTestData } from "./seedUserTestData";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.join(process.cwd(), envFile) });

async function main() {
  await connectDB();
  await seedUserTestData();
  console.log("[seed-user-test] Finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-user-test] Failed:", err);
  process.exit(1);
});
