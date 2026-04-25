/**
 * Standalone: load demo data without starting HTTP server.
 * Usage: npm run seed:demo
 */
import dotenv from "dotenv";
import path from "path";
import connectDB from "../config/db.config";
import { ensureDefaultUsers } from "./ensureDefaultUsers";
import { seedDemoData } from "./seedDemoData";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.join(process.cwd(), envFile) });

async function main() {
  await connectDB();
  await ensureDefaultUsers();
  await seedDemoData();
  console.log("[seed-demo] Finished.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-demo] Failed:", err);
  process.exit(1);
});
