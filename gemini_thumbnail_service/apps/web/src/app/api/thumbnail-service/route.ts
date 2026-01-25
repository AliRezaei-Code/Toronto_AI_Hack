import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const serviceUrl =
    process.env.THUMBNAIL_SERVICE_URL || "http://localhost:4000";

  try {
    const formData = await request.formData();
    const response = await fetch(`${serviceUrl}/thumbnail/generate`, {
      method: "POST",
      body: formData,
    });

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set(
      "content-type",
      response.headers.get("content-type") || "application/json",
    );

    return new NextResponse(buffer, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reach thumbnail service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
