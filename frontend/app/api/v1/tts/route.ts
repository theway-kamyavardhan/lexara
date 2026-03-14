import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, corsHeaders } from "@/lib/apiAuth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * POST /api/v1/tts
 * Accepts JSON: { text: string, language?: string }
 * Validates API key, then proxies to Python backend → /api/tts
 */
export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: body.text,
        language: body.language ?? "en",
      }),
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("[/api/v1/tts] Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend service" },
      { status: 502, headers: corsHeaders() }
    );
  }
}

/** OPTIONS /api/v1/tts — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
