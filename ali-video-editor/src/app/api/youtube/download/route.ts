import { logError, logInfo } from "@/lib/logger";
import { existsSync } from "fs";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { platform } from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { create } from "youtube-dl-exec";
import { validateRequestBody, youtubeDownloadSchema } from "../../../../lib/security/api-schemas";

/**
 * Detects the yt-dlp binary path based on the operating system.
 * Prefers system-installed yt-dlp (has proper SSL certs) over bundled binary.
 */
function findYtDlpPath(): string {
  const os = platform();

  // OS-specific system paths to check (preferred - has proper SSL certificates)
  const systemPaths: Record<string, string[]> = {
    darwin: [
      "/opt/homebrew/bin/yt-dlp", // macOS ARM (Apple Silicon)
      "/usr/local/bin/yt-dlp", // macOS Intel (Homebrew)
    ],
    linux: [
      "/usr/local/bin/yt-dlp", // Linux local install
      "/usr/bin/yt-dlp", // Linux system package
      "/snap/bin/yt-dlp", // Linux Snap package
    ],
    win32: [
      "C:\\Program Files\\yt-dlp\\yt-dlp.exe",
      "C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe", // Chocolatey
      path.join(
        process.env.LOCALAPPDATA || "",
        "Microsoft",
        "WinGet",
        "Packages",
        "yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe",
        "yt-dlp.exe"
      ), // WinGet
    ],
  };

  // Try system paths first (preferred - proper SSL certificates)
  const pathsToCheck = systemPaths[os] || [];
  for (const p of pathsToCheck) {
    if (existsSync(p)) {
      return p;
    }
  }

  // Fallback to bundled binary in node_modules
  const bundledPath = path.join(
    process.cwd(),
    "node_modules",
    "youtube-dl-exec",
    "bin",
    os === "win32" ? "yt-dlp.exe" : "yt-dlp"
  );

  if (existsSync(bundledPath)) {
    return bundledPath;
  }

  // Return 'yt-dlp' to try PATH as last resort
  return "yt-dlp";
}

/**
 * Returns OS-specific installation instructions for yt-dlp.
 */
function getInstallInstructions(): string {
  const os = platform();

  switch (os) {
    case "darwin":
      return "yt-dlp not found. Install with: brew install yt-dlp";
    case "linux":
      return "yt-dlp not found. Install with: sudo apt install yt-dlp OR sudo pip install yt-dlp OR sudo snap install yt-dlp";
    case "win32":
      return "yt-dlp not found. Install with: winget install yt-dlp OR choco install yt-dlp OR download from https://github.com/yt-dlp/yt-dlp/releases";
    default:
      return "yt-dlp not found. Please install yt-dlp from https://github.com/yt-dlp/yt-dlp#installation";
  }
}

// Create ytdl instance with detected yt-dlp path
const ytdlPath = findYtDlpPath();
const ytdl = create(ytdlPath);
logInfo(`[YouTube Download] Using yt-dlp at: ${ytdlPath}`, "youtube-download");

interface DownloadResponse {
  success: boolean;
  filePath?: string;
  filename?: string;
  duration?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  title?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequestBody(youtubeDownloadSchema, body);
    if (!validation.success) {
      return NextResponse.json<DownloadResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const videoId = extractVideoId(url);
    const filename = `youtube_${videoId}_${uuidv4()}.mp4`;
    const filePath = path.join(uploadsDir, filename);

    logInfo("[YouTube Download] Starting download: " + url, "youtube-download");
    logInfo("[YouTube Download] Output path: " + filePath, "youtube-download");

    // Download video at max 720p resolution (reduces file size significantly)
    // Format: best video up to 720p + best audio, merged to mp4
    // Example: 4K video (333MB) → 720p (~50MB)
    const MAX_HEIGHT = 720;
    await ytdl.exec(url, {
      output: filePath,
      format: `bestvideo[height<=${MAX_HEIGHT}]+bestaudio/best[height<=${MAX_HEIGHT}]/best`,
      mergeOutputFormat: "mp4",
      noWarnings: true,
      noPlaylist: true,
      ignoreErrors: true,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ageLimit: 100, // Set age limit to 100 years to bypass age-gated videos
    });

    logInfo("[YouTube Download] Download complete", "youtube-download");

    // Get file stats
    const stats = await fs.stat(filePath);

    // Get video metadata from youtube-dl (includes duration, dimensions, etc.)
    const videoInfoResult = await ytdl.exec(url, {
      dumpSingleJson: true,
      noWarnings: true,
    });

    // Parse the JSON output
    let duration = 0;
    let width = 0;
    let height = 0;
    let title = "";

    try {
      const videoInfo = JSON.parse(videoInfoResult.stdout || "{}");
      duration = videoInfo.duration || 0;
      width = videoInfo.width || 0;
      height = videoInfo.height || 0;
      title = videoInfo.title || videoInfo.fulltitle || "";
    } catch (e) {
      logInfo("[YouTube Download] Could not parse video info, using defaults", "youtube-download");
    }

    logInfo("[YouTube Download] Metadata extracted", "youtube-download", {
      duration,
      width,
      height,
      title,
      fileSize: stats.size,
    });

    return NextResponse.json<DownloadResponse>({
      success: true,
      filePath,
      filename,
      duration,
      width,
      height,
      title,
      fileSize: stats.size,
    });
  } catch (error: unknown) {
    logError(error instanceof Error ? error : new Error(String(error)), "youtube-download");

    // Extract useful error information
    const err = error as {
      message?: string;
      stderr?: string;
      code?: string;
      spawnargs?: string[];
    };

    const errorMessage = err.message || String(error);
    const stderr = err.stderr || "";

    // Check if yt-dlp binary was not found (ENOENT specifically on the binary path)
    const isNotFoundError = (errorMessage.includes("ENOENT") && !stderr) || err.code === "ENOENT";

    // Check for SSL certificate errors (common with bundled yt-dlp)
    const isSSLError = stderr.includes("SSL") || stderr.includes("CERTIFICATE_VERIFY_FAILED");

    let userError: string;

    if (isNotFoundError) {
      userError = getInstallInstructions();
    } else if (isSSLError) {
      userError = `SSL certificate error. ${getInstallInstructions()} (System-installed version has proper SSL certificates)`;
    } else if (stderr) {
      // Use yt-dlp's stderr which has the actual error message
      const stderrLines = stderr.split("\n").filter((line: string) => line.startsWith("ERROR:"));
      const firstError = stderrLines[0];
      userError = firstError ? firstError.replace("ERROR: ", "") : stderr.slice(0, 200);
    } else {
      userError = errorMessage || "Failed to download video";
    }

    return NextResponse.json<DownloadResponse>(
      {
        success: false,
        error: userError,
      },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}
