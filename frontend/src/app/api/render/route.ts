import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, outputPath = 'out/video.mp4', inputProps = {} } = body;

    if (!compositionId) {
      return NextResponse.json(
        { error: 'Composition ID is required' },
        { status: 400 }
      );
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Bundle the Remotion project
    const bundled = await bundle(
      path.join(process.cwd(), 'src', 'remotion', 'index.ts')
    );

    // Render the video
    const result = await renderMedia({
      composition: {
        id: compositionId,
        fps: 30,
        height: 1080,
        width: 1920,
        durationInFrames: 300,
        ...inputProps,
      },
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    // Clean up the bundle
    fs.rmSync(bundled, { recursive: true });

    return NextResponse.json({
      success: true,
      outputPath,
      result,
      message: `Video rendered successfully to ${outputPath}`,
    });
  } catch (error) {
    console.error('Rendering error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}