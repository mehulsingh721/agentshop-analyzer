import "server-only";
import { callClaudeJSON } from "../claude";
import type { Audit, Step1Result } from "../types";

export async function step1Prompts(audit: Audit): Promise<Step1Result> {
  const system = `You are an AI shopping research analyst. Generate realistic prompts a real shopper would type into ChatGPT, Claude, Perplexity, or Gemini when researching a purchase.`;

  const user = `Brand: ${audit.brand_name}
Category: ${audit.category}
Competitors: ${audit.competitors.join(", ") || "(none provided)"}

Generate 18-22 distinct shopping prompts. Cover ALL of these intent types (at least 2 of each):
- category_discovery (e.g. "Best filtered showerhead for hard water")
- comparison (e.g. "Jolie vs Canopy shower filter")
- problem_aware (e.g. "Why is my skin dry after showering?")
- occasion_use_case (e.g. "Best wellness gift for someone moving apartments")
- budget (e.g. "Best shower filter under $200")
- ingredient_material (e.g. "Best shower filter for chlorine and heavy metals")

For each, also pick a funnel_stage in {"awareness","consideration","decision"} and a one-sentence why_it_matters.

Return JSON of shape:
{
  "prompts": [
    { "prompt": "...", "intent_type": "...", "funnel_stage": "...", "why_it_matters": "..." }
  ]
}`;

  return callClaudeJSON<Step1Result>({
    system,
    user,
    maxTokens: 4096,
  });
}
