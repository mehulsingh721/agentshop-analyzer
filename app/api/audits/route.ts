import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { runAudit } from "@/lib/pipeline";
import { computeStepEstimates } from "@/lib/pipeline/estimates";
import { PIPELINE_VERSION } from "@/lib/pipeline/version";
import { STEP_NAMES, type AuditInput, type StepRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValid(input: unknown): input is AuditInput {
  if (!input || typeof input !== "object") return false;
  const i = input as Record<string, unknown>;
  return (
    typeof i.brand_name === "string" &&
    typeof i.brand_url === "string" &&
    typeof i.category === "string" &&
    Array.isArray(i.competitors) &&
    i.competitors.every((c) => typeof c === "string")
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isValid(body)) {
    return NextResponse.json(
      { error: "brand_name, brand_url, category, competitors[] required" },
      { status: 400 }
    );
  }

  const sb = createAdminClient();

  // Stamp ETAs onto each step using measured durations from past audits.
  // null in any slot when there's no history yet — the UI shows no estimate
  // rather than a fabricated one.
  const estimates = await computeStepEstimates(sb);
  const initialSteps: StepRecord[] = STEP_NAMES.map((name, i) => ({
    name,
    status: "pending",
    result: null,
    error: null,
    started_at: null,
    completed_at: null,
    estimated_seconds: estimates[i],
    pipeline_version: PIPELINE_VERSION,
  }));

  const { data, error } = await sb
    .from("audits")
    .insert({
      brand_name: body.brand_name,
      brand_url: body.brand_url,
      category: body.category,
      competitors: body.competitors,
      status: "pending",
      steps: initialSteps,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create audit" },
      { status: 500 }
    );
  }

  // Fire and forget — pipeline writes progress back to Supabase.
  runAudit(data.id).catch((e) => {
    console.error(`runAudit ${data.id} crashed:`, e);
  });

  return NextResponse.json({ id: data.id });
}
