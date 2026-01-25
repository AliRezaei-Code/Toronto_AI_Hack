/**
 * API Route: Extract YouTube Chapters
 * Extracts chapter timestamps from YouTube videos using yt-dlp
 */

import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { platform } from "os";
import path from "path";
import { create } from "youtube-dl-exec";
import { logInfo, logError } from "@/lib/logger";

/**
 * Detects the yt-dlp binary path based on the operating system
 */
function findYtDlpPath(): string {
  const os = platform();

  // OS-specific system paths to check
  const systemPaths: Record<string, string[]> = {
    darwin: ["/opt/homebrew/bin/yt-dlp", "/usr/local/bin/yt-dlp"],
    linux: ["/usr/local/bin/yt-dlp", "/usr/bin/yt-dlp", "/snap/bin/yt-dlp"],
    win32: [
      "C:\\Program Files\\yt-dlp\\yt-dlp.exe",
      "C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe",
      path.join(
        process.env.LOCALAPPDATA || "",
        "Microsoft",
        "WinGet",
        "Packages",
        "yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe",
        "yt-dlp.exe"
      ),
    ],
  };

  // Try system paths first
  const pathsToCheck = systemPaths[os] || [];
  for (const p of pathsToCheck) {
    try {
      fs.accessSync(p);
      return p;
    } catch {
      continue;
    }
  }

  // Fallback to bundled binary
  const bundledPath = path.join(
    process.cwd(),
    "node_modules",
    "youtube-dl-exec",
    "bin",
    os === "win32" ? "yt-dlp.exe" : "yt-dlp"
  );

  return bundledPath;
}

interface Chapter {
  title: string;
  start: number;
  end: number;
}

interface ChaptersResponse {
  success: boolean;
  chapters?: Chapter[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json<ChaptersResponse>(
        { success: false, error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
      return NextResponse.json<ChaptersResponse>(
        { success: false, error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Create ytdl instance
    const ytdlPath = findYtDlpPath();
    const ytdl = create(ytdlPath);

    logInfo("[YouTube Chapters] Extracting chapters from " + url, "youtube-chapters");

    // Get video info with chapters
    const videoInfoResult = await ytdl.exec(url, {
      dumpSingleJson: true,
      noWarnings: true,
    });

    // Parse the JSON output
    let chapters: Chapter[] = [];

    try {
      const videoInfo = JSON.parse(videoInfoResult.stdout || "{}");

      // Extract chapters from video info
      if (videoInfo.chapters && Array.isArray(videoInfo.chapters)) {
        chapters = videoInfo.chapters.map((chapter: { title?: string; start_time?: number; end_time?: number }, index: number) => ({
          title: chapter.title || `Chapter ${index + 1}`,
          start: chapter.start_time || 0,
          end:
            chapter.end_time ||
            videoInfo.chapters[index + 1]?.start_time ||
            videoInfo.duration ||
            0,
        }));
      } else {
        // Try to extract from description if no chapters metadata
        const description = videoInfo.description || "";
        const chapterRegex = /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)(?=\n\d{1,2}:\d{2}|\n\n|$)/g;
        const matches = [...description.matchAll(chapterRegex)];

        if (matches.length > 0) {
          chapters = matches.map((match, _index) => {
            const timeParts = match[1].split(":").map(Number);
            const seconds =
              timeParts.length === 3
                ? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
                : timeParts[0] * 60 + timeParts[1];

            return {
              title: match[2].trim(),
              start: seconds,
              end: 0, // Will be calculated later
            };
          });

          // Calculate end times
          chapters.forEach((chapter, idx) => {
            if (idx < chapters.length - 1) {
              const nextChapter = chapters[idx + 1];
              if (nextChapter) {
                chapter.end = nextChapter.start;
              }
            } else {
              chapter.end = videoInfo.duration || 0;
            }
          });
        }
      }
    } catch (e) {
      logInfo("[YouTube Chapters] Could not parse video info for chapters", "youtube-chapters");
    }

    logInfo(`[YouTube Chapters] Extracted ${chapters.length} chapters`, "youtube-chapters");

    return NextResponse.json<ChaptersResponse>({
      success: true,
      chapters,
    });
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error(String(error)), "youtube-chapters");

    const err = error as {
      message?: string;
      stderr?: string;
      code?: string;
    };

    const errorMessage = err.message || String(error);
    const stderr = err.stderr || "";

    // Check if yt-dlp binary was not found
    const isNotFoundError = (errorMessage.includes("ENOENT") && !stderr) || err.code === "ENOENT";

    let userError: string;

    if (isNotFoundError) {
      userError =
        "yt-dlp not found. Install with: brew install yt-dlp (macOS) or pip install yt-dlp";
    } else if (stderr) {
      const stderrLines = stderr.split("\n").filter((line: string) => line.startsWith("ERROR:"));
      const firstError = stderrLines[0];
      userError = firstError ? firstError.replace("ERROR: ", "") : stderr.slice(0, 200);
    } else {
      userError = errorMessage || "Failed to extract chapters";
    }

    return NextResponse.json<ChaptersResponse>(
      {
        success: false,
        error: userError,
      },
      { status: 500 }
    );
  }
}
