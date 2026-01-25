import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts/thumbnailPrompt.js";

type ThumbnailPlan = {
  headline: string;
  composition: string;
  visual_elements: string[];
  color_palette: string[];
  typography: string;
  constraints: string[];
  image_prompt: string;
};

type ThumbnailPlanResponse = {
  plan: ThumbnailPlan | null;
  rawText: string;
  imagePrompt: string;
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const buildThumbnailPlan = async (
  transcript: string,
): Promise<ThumbnailPlanResponse> => {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3-pro-preview";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = buildUserPrompt(transcript);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const rawText = result.response.text();
  const plan = safeJsonParse<ThumbnailPlan>(rawText);
  const imagePrompt = plan?.image_prompt || rawText;

  return {
    plan,
    rawText,
    imagePrompt,
  };
};

const safeJsonParse = <T>(rawText: string): T | null => {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const slice = rawText.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
};
