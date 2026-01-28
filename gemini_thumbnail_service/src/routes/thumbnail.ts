import express, { Request, Response } from "express";
import multer from "multer";
import { downloadAudio } from "../utils/download.js";
import { transcribeAudio } from "../services/whisper.js";
import { buildThumbnailPlan } from "../services/gemini.js";
import { generateThumbnailImage } from "../services/image.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const thumbnailRouter = express.Router();

thumbnailRouter.post(
  "/plan",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      const { buffer, mimeType, filename } = await resolveAudio(req);
      const transcript = await transcribeAudio({ buffer, mimeType, filename });
      const plan = await buildThumbnailPlan(transcript);

      res.json({
        transcript,
        plan,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

thumbnailRouter.post(
  "/generate",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      const { buffer, mimeType, filename } = await resolveAudio(req);
      const transcript = await transcribeAudio({ buffer, mimeType, filename });
      const plan = await buildThumbnailPlan(transcript);
      const image = await generateThumbnailImage(plan.imagePrompt);

      res.json({
        transcript,
        plan,
        image,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

const resolveAudio = async (req: Request) => {
  if (req.file) {
    return {
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || "audio/mpeg",
      filename: req.file.originalname || "audio.wav",
    };
  }

  const audioUrl =
    typeof req.body.audioUrl === "string" ? req.body.audioUrl : "";
  if (!audioUrl) {
    throw new Error("Provide audio file or audioUrl");
  }

  return downloadAudio(audioUrl);
};
