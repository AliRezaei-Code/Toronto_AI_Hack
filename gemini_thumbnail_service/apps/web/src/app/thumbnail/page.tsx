"use client";

import { useMemo, useState } from "react";

type ThumbnailPlan = {
  headline: string;
  composition: string;
  visual_elements: string[];
  color_palette: string[];
  typography: string;
  constraints: string[];
  image_prompt: string;
};

type ThumbnailResponse = {
  transcript?: string;
  plan?: {
    plan?: ThumbnailPlan;
    rawText?: string;
    imagePrompt?: string;
  };
  image?: {
    b64_json?: string | null;
    mime_type?: string | null;
  };
  error?: string;
};

export default function ThumbnailPage() {
  const [audioUrl, setAudioUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThumbnailResponse | null>(null);

  const imageSrc = useMemo(() => {
    if (!result?.image?.b64_json) return null;
    const mime = result.image.mime_type || "image/png";
    return `data:${mime};base64,${result.image.b64_json}`;
  }, [result]);

  const plan = result?.plan?.plan ?? null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (audioUrl) {
        formData.append("audioUrl", audioUrl);
      }
      if (file) {
        formData.append("audio", file);
      }

      const response = await fetch("/api/thumbnail-service", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as ThumbnailResponse) : {};

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary-dark">
            Rententio Thumbnail Studio
          </p>
          <h1 className="text-4xl font-playfair font-bold text-pure-white md:text-5xl">
            Build cinematic 9:16 thumbnails from your script.
          </h1>
          <p className="max-w-3xl text-base font-formula text-text-secondary-dark">
            Upload audio or video, or drop a URL. We transcribe with Whisper,
            craft a Gemini-powered thumbnail plan, and generate a Nano Banana
            Pro image with on-screen headline text.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-divider-dark/50 bg-charcoal/70 p-6 shadow-xl shadow-black/40"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-formula text-text-secondary-dark">
              Audio/Video URL
              <input
                type="url"
                value={audioUrl}
                onChange={(event) => setAudioUrl(event.target.value)}
                placeholder="https://..."
                className="rounded-xl border border-divider-dark/60 bg-rich-black/70 px-4 py-3 text-pure-white focus:outline-none focus:ring-2 focus:ring-luxury-gold/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-formula text-text-secondary-dark">
              Or upload audio/video
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="rounded-xl border border-divider-dark/60 bg-rich-black/70 px-4 py-3 text-pure-white file:mr-4 file:rounded-lg file:border-0 file:bg-luxury-gold/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-luxury-gold"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-text-secondary-dark">
              Output: 1080x1920, Panasonic GH7 capture style, minimalist layout.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-luxury-gold to-muted-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-rich-black shadow-lg shadow-luxury-gold/30 transition disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Plan + Image"}
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </form>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-divider-dark/50 bg-charcoal/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-playfair font-semibold text-pure-white">
                Generated Thumbnail
              </h2>
              {imageSrc ? (
                <span className="text-xs uppercase tracking-[0.2em] text-pale-gold">
                  Ready
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-divider-dark/60 bg-rich-black/60 text-sm text-text-secondary-dark">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt="Generated thumbnail"
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : (
                <span>No image yet. Generate to preview.</span>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-2xl border border-divider-dark/50 bg-charcoal/70 p-6">
              <h2 className="text-lg font-playfair font-semibold text-pure-white">
                Plan Highlights
              </h2>
              {plan ? (
                <div className="mt-4 space-y-3 text-sm text-text-secondary-dark">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-pale-gold">
                      Headline
                    </div>
                    <div className="text-lg font-playfair text-pure-white">
                      {plan.headline}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-pale-gold">
                      Composition
                    </div>
                    <p>{plan.composition}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-pale-gold">
                      Visual Elements
                    </div>
                    <p>{plan.visual_elements?.join(" • ")}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-pale-gold">
                      Typography
                    </div>
                    <p>{plan.typography}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-text-secondary-dark">
                  Generate to see the headline, composition, and prompt summary.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-divider-dark/50 bg-charcoal/70 p-6">
              <h2 className="text-lg font-playfair font-semibold text-pure-white">
                Raw Output
              </h2>
              <pre className="mt-4 max-h-[260px] overflow-auto rounded-xl border border-divider-dark/50 bg-rich-black/60 p-4 text-xs text-soft-white">
                {result
                  ? JSON.stringify(result, null, 2)
                  : "Waiting for input."}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
