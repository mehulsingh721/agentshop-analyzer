import "server-only";
import { callClaudeJSON } from "../claude";
import type {
  Audit,
  Step3Result,
  Step4Result,
  Step5Result,
  Step6Result,
} from "../types";

export async function step6Recommendations(
  audit: Audit,
  step3: Step3Result,
  step4: Step4Result,
  step5: Step5Result
): Promise<Step6Result> {
  const fieldGaps = step4.fields
    .filter((f) => f.present !== "yes" || f.quality === "low")
    .map((f) => `- ${f.field}: ${f.notes}`)
    .join("\n");

  const system = `You are an AI visibility consultant. Given a brand's AI Product Shelf Score, catalog gaps, and structured product profile, recommend concrete, prioritized actions to improve recommendation rates from AI shopping assistants.`;

  const user = `Brand: ${audit.brand_name}
Category: ${audit.category}
Top competitor (if any): ${step3.top_competitor ?? "n/a"}
Score: ${step3.score}/100
Mention rate: ${(step3.mention_rate * 100).toFixed(0)}%
Strong-recommendation rate: ${(step3.strong_recommendation_rate * 100).toFixed(0)}%
Citation coverage: ${(step3.citation_coverage * 100).toFixed(0)}%

Catalog gaps:
${fieldGaps || "(no major gaps)"}

Enriched product profile:
${JSON.stringify(step5, null, 2)}

Produce 6-9 prioritized recommendations. Each should be specific to this brand and category — avoid generic SEO advice. Return JSON of shape:
{
  "recommendations": [
    {
      "recommendation": "...",                 // concrete action
      "why_it_helps": "...",                   // why an AI assistant will recommend the brand more
      "effort": "low" | "medium" | "high",
      "expected_impact": "low" | "medium" | "high"
    }
  ]
}`;

  return callClaudeJSON<Step6Result>({
    system,
    user,
    maxTokens: 2500,
  });
}
