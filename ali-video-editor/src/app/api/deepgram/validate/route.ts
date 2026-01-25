import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { apiKey?: string };

    if (!body.apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const dgResponse = await fetch("https://api.deepgram.com/v1/projects", {
      method: "GET",
      headers: {
        Authorization: `Token ${body.apiKey}`,
      },
    });

    if (!dgResponse.ok) {
      const text = await dgResponse.text();
      return NextResponse.json(
        { error: text || "Deepgram API key validation failed" },
        { status: dgResponse.status }
      );
    }

    const data = (await dgResponse.json()) as unknown;
    return NextResponse.json({ valid: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
