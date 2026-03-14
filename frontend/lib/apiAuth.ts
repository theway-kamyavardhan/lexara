import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the `x-api-key` header against the API_KEY env variable.
 * Returns null on success, or a 401 Response on failure.
 */
export function validateApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    // Fail-safe: if API_KEY is not configured on the server, reject all requests
    return NextResponse.json(
      { error: "API key not configured on server" },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() }
    );
  }

  return null;
}

/** Standard CORS headers for all API responses */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  };
}
