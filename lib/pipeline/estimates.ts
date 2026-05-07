import "server-only";
import type { AdminClient } from "@/utils/supabase/admin";
import { STEP_NAMES, type StepRecord } from "../types";
import { durationSeconds } from "../format";
import { PIPELINE_VERSION } from "./version";

const HISTORY_LIMIT = 10;

/**
 * Computes the average measured duration of each pipeline step from the
 * most recent completed audits. Returns one number per step (seconds), or
 * `null` for any step with zero historical samples.
 *
 * The estimate is a simple mean — variance from outliers is dampened by
 * the 10-row limit. We deliberately do NOT hardcode any fallback durations:
 * if there's no history, the UI shows no ETA rather than a fabricated one.
 */
export async function computeStepEstimates(
  sb: AdminClient,
  stepCount: number = STEP_NAMES.length
): Promise<(number | null)[]> {
  const { data, error } = await sb
    .from("audits")
    .select("steps")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !data) {
    return new Array(stepCount).fill(null);
  }

  const sums = new Array(stepCount).fill(0);
  const counts = new Array(stepCount).fill(0);

  for (const row of data) {
    const steps = (row.steps ?? []) as StepRecord[];
    steps.forEach((s, i) => {
      if (i >= stepCount) return;
      if (s.status !== "done") return;
      // Skip samples from older pipeline versions — their measured durations
      // no longer represent how long the current pipeline takes.
      if (s.pipeline_version !== PIPELINE_VERSION) return;
      const dur = durationSeconds(s.started_at, s.completed_at);
      if (dur === null) return;
      sums[i] += dur;
      counts[i] += 1;
    });
  }

  return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : null));
}
