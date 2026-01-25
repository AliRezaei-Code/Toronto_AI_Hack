import path from "node:path";

export const downloadAudio = async (audioUrl: string) => {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get("content-type") || "audio/mpeg";
  const filename = inferFilename(audioUrl, mimeType);

  return { buffer, mimeType, filename };
};

const inferFilename = (audioUrl: string, mimeType: string) => {
  try {
    const url = new URL(audioUrl);
    const base = path.basename(url.pathname) || "audio";
    if (path.extname(base)) {
      return base;
    }
    return `${base}.${mimeTypeToExt(mimeType)}`;
  } catch {
    return `audio.${mimeTypeToExt(mimeType)}`;
  }
};

const mimeTypeToExt = (mimeType: string) => {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("webm")) return "webm";
  return "mp3";
};
