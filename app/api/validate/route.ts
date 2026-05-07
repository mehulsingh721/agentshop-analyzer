import { NextResponse } from "next/server";
import { validatePage } from "@/lib/validator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Single Firecrawl scrape + one Claude call ~ 10-15s. Bump the default
// route timeout so longer pages don't hit 504s on slower hosts.
export const maxDuration = 60;

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = (body as { url?: unknown })?.url;
  if (typeof url !== "string" || !isHttpUrl(url)) {
    return NextResponse.json(
      { error: "Provide a valid http(s) URL in the `url` field." },
      { status: 400 }
    );
  }

  try {
    const result = await validatePage(url);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("validatePage failed:", msg);
    return NextResponse.json(
      { error: `Validation failed: ${msg}` },
      { status: 500 }
    );
  }
}
