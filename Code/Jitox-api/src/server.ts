import express, { Express } from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import connectDB from "./config/db.config";
import { ensureDefaultUsers } from "./seed/ensureDefaultUsers";
import { seedDemoData } from "./seed/seedDemoData";
import { setupRoutes } from "./routes";
import { globalErrorHandler } from "./common/errors/globalError";
import { initSocketIO } from "./socket/io";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: envFile });

const app: Express = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

setupRoutes(app);
app.use(globalErrorHandler);

const httpServer = http.createServer(app);
initSocketIO(httpServer);

const start = async () => {
  await connectDB();
  if (process.env.NODE_ENV === "development") {
    await ensureDefaultUsers();
    if (process.env.SEED_DEMO_DATA !== "false") {
      try {
        await seedDemoData();
      } catch (e) {
        console.error("[seed-demo] Failed:", e);
      }
    }
  }
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
