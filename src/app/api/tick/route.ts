import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processTick } from "@/lib/tick/processTick";

export async function POST(req: NextRequest) {
  // Authenticate via TICK_SECRET header or query param
  const secret = req.headers.get("x-tick-secret") ?? req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.TICK_SECRET;

  // Allow in development without secret, require in production
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Find all active sessions
    const { data: sessions, error } = await admin
      .from("game_sessions")
      .select("id")
      .eq("status", "active");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: { sessionId: string; ok: boolean; error?: string }[] = [];

    // Process each session
    for (const session of (sessions ?? [])) {
      const result = await processTick(session.id);
      results.push({ sessionId: session.id, ...result });
    }

    const processed = results.filter((r) => r.ok).length;
    const errors = results.filter((r) => !r.ok).map((r) => `${r.sessionId}: ${r.error}`);

    return NextResponse.json({
      processed,
      total: results.length,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET(req: NextRequest) {
  return POST(req);
}
