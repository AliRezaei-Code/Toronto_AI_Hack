import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { apiKey?: string };

    if (!body.apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${body.apiKey}`,
      {
        method: "GET",
      }
    );

    if (!geminiResponse.ok) {
      const text = await geminiResponse.text();
      return NextResponse.json(
        { error: text || "Gemini API key validation failed" },
        { status: geminiResponse.status }
      );
    }

    const data = (await geminiResponse.json()) as unknown;
    return NextResponse.json({ valid: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}