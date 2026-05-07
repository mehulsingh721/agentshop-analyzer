import "server-only";
import { callClaudeJSON } from "../claude";
import type { Audit, Step4Result, Step5Result } from "../types";

export async function step5Enrichment(
  audit: Audit,
  step4: Step4Result
): Promise<Step5Result> {
  const fieldNotes = step4.fields
    .map((f) => `- ${f.field} [${f.present}/${f.quality}]: ${f.notes}`)
    .join("\n");

  const system = `You convert messy human-facing brand/product copy into structured fields that an AI shopping assistant can use to match products to buyer intent. Be specific and grounded — do not invent claims that aren't supported by the brand's category and known positioning.`;

  const user = `Brand: ${audit.brand_name}
Category: ${audit.category}
Brand URL: ${audit.brand_url}
Competitors: ${audit.competitors.join(", ") || "(none)"}

Catalog readiness summary: ${step4.overall_summary}

Field-level notes from the catalog audit:
${fieldNotes}

Produce a structured product profile that an AI assistant could rely on. Return JSON of shape:
{
  "product_name": "...",
  "category": "...",
  "primary_benefits": ["..."],          // 3-5 concrete benefits
  "best_for": ["..."],                  // 3-5 buyer types or situations
  "not_best_for": ["..."],              // 1-3 honest exclusions
  "comparison_claims": ["..."],         // 2-4 differentiators vs alternatives
  "ai_safe_description": "..."          // 1-2 sentence, factual, AI-friendly
}`;

  return callClaudeJSON<Step5Result>({
    system,
    user,
    maxTokens: 1500,
  });
}
