import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateThumbnailImage = async (prompt: string) => {
  const client = getGeminiClient();
  const modelName =
    process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
  const model = client.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      imageConfig: {
        aspectRatio: "9:16",
      },
    },
  } as any);

  const parts = (result.response.candidates?.[0]?.content?.parts ??
    []) as Array<{
    inlineData?: { data: string; mimeType?: string };
  }>;
  const imagePart = parts.find((part) => Boolean(part.inlineData));
  const inlineData = imagePart?.inlineData;

  return {
    b64_json: inlineData?.data ?? null,
    mime_type: inlineData?.mimeType ?? null,
  };
};
