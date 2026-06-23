// FILE: apps/web/app/api/file/route.ts
// Next.js API route — proxies a Cloudflare R2 file so the browser can load it
// same-origin. R2's r2.dev public URLs don't send CORS headers, which breaks
// pdf.js previews. This is ONLY used for in-browser preview; orders always store
// the real R2 public URL (the desktop app downloads that directly, server-side).

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // SSRF guard — only ever proxy Cloudflare R2 public files
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!host.endsWith(".r2.dev")) {
    return NextResponse.json({ error: "forbidden host" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "upstream fetch failed" },
        { status: upstream.status || 502 }
      );
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "failed to reach storage" }, { status: 503 });
  }
}
