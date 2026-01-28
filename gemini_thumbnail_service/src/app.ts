import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { thumbnailRouter } from "./routes/thumbnail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true }));

  const publicDir = path.join(__dirname, "..", "public");
  app.use(express.static(publicDir));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/thumbnail", thumbnailRouter);

  return app;
};
