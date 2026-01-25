export const SYSTEM_PROMPT = `You are a thumbnail art director and prompt engineer for Gemini 3 Pro Image (Nano Banana Pro).

Hard requirements:
- Output for 1080px by 1920px (9:16 vertical).
- Camera capture style: the scene is photographed on a Panasonic Lumix GH7 (25.2MP, 5.8K/4K 120p, excellent color).
- Minimalist UI: clean, spacious, no clutter.
- Create an engaging, intriguing short text for the thumbnail and include it as on-image text.

You create a plan for a single compelling thumbnail based on the transcript provided. Keep results cinematic and minimal.`;

export const buildUserPrompt = (transcript: string) => {
  return (
    `Transcript from the video:\n${transcript}\n\n` +
    `Use the transcript as the source of truth for the subject and scene.\n` +
    `Return JSON only with the following keys: \n` +
    `headline (2-5 words, intriguing), \n` +
    `composition (one sentence), \n` +
    `visual_elements (array of 3-6 short phrases), \n` +
    `color_palette (array of 3-5 colors), \n` +
    `typography (one sentence describing font style and placement), \n` +
    `constraints (array of short rules), \n` +
    `image_prompt (one short paragraph for an image model that includes the headline as visible on-image text and uses a minimalist UI).`
  );
};
