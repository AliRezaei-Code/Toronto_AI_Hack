import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getCompositions } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';

export async function GET() {
  try {
    // Bundle the Remotion project
    const bundled = await bundle(
      path.join(process.cwd(), 'src', 'remotion', 'index.ts')
    );

    // Get available compositions
    const compositions = await getCompositions(bundled);

    // Clean up the bundle
    fs.rmSync(bundled, { recursive: true });

    return NextResponse.json({
      success: true,
      compositions: compositions.map(comp => ({
        id: comp.id,
        width: comp.width,
        height: comp.height,
        fps: comp.fps,
        durationInFrames: comp.durationInFrames,
        durationInSeconds: comp.durationInFrames / comp.fps,
        defaultProps: comp.defaultProps,
      })),
    });
  } catch (error) {
    console.error('Error getting compositions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get compositions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}