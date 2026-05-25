import express, { Express } from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import connectDB from "./config/db.config";
import { ensureDefaultUsers } from "./seed/ensureDefaultUsers";
import { ensureDefaultTerritories } from "./seed/ensureDefaultTerritories";
import { seedDemoData } from "./seed/seedDemoData";
import { seedUserTestData } from "./seed/seedUserTestData";
import { setupRoutes } from "./routes";
import { globalErrorHandler } from "./common/errors/globalError";
import { initSocketIO } from "./socket/io";
import { getHealth } from "./controllers/health.controller";
import { getEmailUser } from "./constants/emailConfig";
import {
  getEmailProvider,
  isEmailConfigured,
  verifyEmailTransport,
} from "./helper/sendEmail";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const app: Express = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "jitox-api" });
});

app.get("/health", getHealth);

app.use(cors());

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

setupRoutes(app);
app.use(globalErrorHandler);

const httpServer = http.createServer(app);
initSocketIO(httpServer);

const start = async () => {
  console.log(
    `[jitox-api] starting NODE_ENV=${process.env.NODE_ENV} PORT=${PORT} MONGO_URI=${process.env.MONGO_URI ? "set" : "MISSING"}`
  );
  await connectDB();

  console.log(
    `[jitox-api] email sender=${getEmailUser()} provider=${getEmailProvider() ?? "none"} configured=${isEmailConfigured()} jwt=${process.env.JWT_SECRET_KEY?.trim() ? "ok" : "MISSING"}`
  );
  await verifyEmailTransport();

  const isDev = process.env.NODE_ENV === "development";
  const allowBootstrap = process.env.ALLOW_BOOTSTRAP_USERS === "true";

  if (isDev || allowBootstrap) {
    await ensureDefaultTerritories();
    await ensureDefaultUsers();
    if (isDev && process.env.SEED_DEMO_DATA !== "false") {
      try {
        await seedDemoData();
      } catch (e) {
        console.error("[seed-demo] Failed:", e);
      }
    }
    if (isDev && process.env.SEED_USER_TEST_DATA !== "false") {
      try {
        await seedUserTestData();
      } catch (e) {
        console.error("[seed-user-test] Failed:", e);
      }
    }
  }
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
