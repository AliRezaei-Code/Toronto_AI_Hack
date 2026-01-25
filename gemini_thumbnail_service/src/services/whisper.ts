import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

type TranscriptionInput = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
};

export const transcribeAudio = async ({
  buffer,
  mimeType,
  filename,
}: TranscriptionInput): Promise<string> => {
  const client = getOpenAIClient();
  const prepared = await prepareAudioBuffer({ buffer, mimeType, filename });
  const file = await toFile(prepared.buffer, prepared.filename, {
    type: prepared.mimeType,
  });
  const response = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return response.text;
};

const prepareAudioBuffer = async ({
  buffer,
  mimeType,
  filename,
}: TranscriptionInput): Promise<TranscriptionInput> => {
  if (!mimeType.startsWith("video/")) {
    return { buffer, mimeType, filename };
  }

  const base = path.parse(filename).name || "video";
  const inputPath = path.join(tmpdir(), `${base}-${randomUUID()}`);
  const outputPath = `${inputPath}.wav`;
  await writeFile(inputPath, buffer);

  try {
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      outputPath,
    ]);

    const audioBuffer = await readFile(outputPath);
    return {
      buffer: audioBuffer,
      mimeType: "audio/wav",
      filename: `${base}.wav`,
    };
  } finally {
    await rm(inputPath, { force: true });
    await rm(outputPath, { force: true });
  }
};

const runFfmpeg = (args: string[]) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });

    child.on("error", (error) => {
      reject(new Error(`ffmpeg failed to start: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
};
