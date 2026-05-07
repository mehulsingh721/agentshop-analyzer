import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  STEP_NAMES,
  type Audit,
  type StepRecord,
  type Step1Result,
  type Step2Result,
  type Step3Result,
  type Step4Result,
  type Step5Result,
} from "../types";
import { step1Prompts } from "./step1-prompts";
import { step2Simulation } from "./step2-simulation";
import { step3Score } from "./step3-score";
import { step4Catalog } from "./step4-catalog";
import { step5Enrichment } from "./step5-enrichment";
import { step6Recommendations } from "./step6-recommendations";

function emptySteps(): StepRecord[] {
  return STEP_NAMES.map((name) => ({
    name,
    status: "pending",
    result: null,
    error: null,
    started_at: null,
    completed_at: null,
    estimated_seconds: null,
    pipeline_version: null,
  }));
}

async function loadAudit(id: string): Promise<Audit> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error(`Audit ${id} not found: ${error?.message}`);
  return data;
}

async function patchAudit(id: string, patch: Partial<Audit>): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("audits")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Failed to update audit ${id}: ${error.message}`);
}

async function runStep<T>(
  auditId: string,
  steps: StepRecord[],
  index: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = () => new Date().toISOString();
  steps[index] = {
    ...steps[index],
    status: "running",
    started_at: now(),
    error: null,
  };
  await patchAudit(auditId, { steps, current_step: index + 1, status: "running" });

  try {
    const result = await fn();
    steps[index] = {
      ...steps[index],
      status: "done",
      result: result as unknown,
      completed_at: now(),
    };
    await patchAudit(auditId, { steps });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps[index] = {
      ...steps[index],
      status: "failed",
      error: msg,
      completed_at: now(),
    };
    await patchAudit(auditId, { steps });
    throw e;
  }
}

export async function runAudit(auditId: string): Promise<void> {
  const audit = await loadAudit(auditId);
  // Preserve estimated_seconds (and any other fields) seeded by POST /api/audits.
  // Fall back to a fresh empty array for legacy rows that lack a seeded steps[].
  const steps =
    audit.steps?.length === STEP_NAMES.length ? audit.steps : emptySteps();
  await patchAudit(auditId, { steps, current_step: 0, status: "running" });

  try {
    const s1 = await runStep<Step1Result>(auditId, steps, 0, () =>
      step1Prompts(audit)
    );
    const s2 = await runStep<Step2Result>(auditId, steps, 1, () =>
      step2Simulation(audit, s1)
    );
    await runStep<Step3Result>(auditId, steps, 2, async () => step3Score(s2));
    const s4 = await runStep<Step4Result>(auditId, steps, 3, () =>
      step4Catalog(audit)
    );
    const s5 = await runStep<Step5Result>(auditId, steps, 4, () =>
      step5Enrichment(audit, s4)
    );
    // Step 6 needs step 3 result; pull it from steps state.
    const s3 = steps[2].result as Step3Result;
    await runStep(auditId, steps, 5, () =>
      step6Recommendations(audit, s3, s4, s5)
    );

    await patchAudit(auditId, { status: "completed", current_step: 6 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await patchAudit(auditId, { status: "failed", error: msg });
  }
}
