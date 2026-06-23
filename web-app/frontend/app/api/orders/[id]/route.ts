// FILE: apps/web/app/api/orders/[id]/route.ts
// Next.js API route — proxies GET /api/orders/:id to the Express backend
// This is needed because the track page calls /api/orders/:id internally (same origin)

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/orders/${id.toUpperCase()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 503 }
    );
  }
}
