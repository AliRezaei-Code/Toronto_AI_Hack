import { createReadStream, existsSync, statSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

/**
 * Serve a previously downloaded YouTube video file
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      );
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Create read stream for the file
    const fileStream = createReadStream(filePath);

    // Get file stats for content length
    const stats = statSync(filePath);
    const fileSize = stats.size;

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.m4a' ? 'audio/mp4' 
      : ext === '.mp3' ? 'audio/mpeg'
      : ext === '.webm' ? 'video/webm'
      : 'video/mp4';

    // Set appropriate headers for media stream
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileSize.toString());
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');

    // Return stream response
    return new NextResponse(fileStream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[Serve Video] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
}
