import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/apiAuth";

/** GET /api/v1/health — public, no auth required */
export async function GET() {
  return NextResponse.json(
    { status: "API running" },
    { headers: corsHeaders() }
  );
}

/** OPTIONS /api/v1/health — CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
