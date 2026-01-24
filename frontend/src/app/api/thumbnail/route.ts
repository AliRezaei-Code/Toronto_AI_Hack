import { NextRequest, NextResponse } from 'next/server';
import { renderStill } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { compositionId, frame = 0, outputPath = 'out/thumbnail.png', inputProps = {} } = body;

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

    // Render the still image
    await renderStill({
      composition: {
        id: compositionId,
        fps: 30,
        height: 1080,
        width: 1920,
        durationInFrames: 300,
        ...inputProps,
      },
      serveUrl: bundled,
      outputLocation: outputPath,
      inputProps,
    });

    // Clean up the bundle
    fs.rmSync(bundled, { recursive: true });

    return NextResponse.json({
      success: true,
      outputPath,
      frame,
      message: `Thumbnail rendered successfully to ${outputPath}`,
    });
  } catch (error) {
    console.error('Thumbnail rendering error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}