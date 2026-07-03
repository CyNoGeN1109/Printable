// FILE: apps/web/app/api/orders/group/[groupId]/route.ts
// Next.js API route — proxies GET /api/orders/group/:groupId to the Express backend.
// The track page polls this so a split order (B&W + colour) shows as one job.

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  try {
    const res = await fetch(`${BACKEND}/orders/group/${groupId.toUpperCase()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 503 });
  }
}
