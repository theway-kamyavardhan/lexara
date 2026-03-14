import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, corsHeaders } from "@/lib/apiAuth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * POST /api/v1/ocr
 * Accepts multipart/form-data with a `file` field.
 * Validates API key, then proxies to Python backend → /ocr
 */
export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();

    const backendResponse = await fetch(`${BACKEND_URL}/ocr`, {
      method: "POST",
      body: formData,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("[/api/v1/ocr] Error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend service" },
      { status: 502, headers: corsHeaders() }
    );
  }
}

/** OPTIONS /api/v1/ocr — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
