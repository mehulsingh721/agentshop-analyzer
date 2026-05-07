import "server-only";
import Firecrawl from "@mendable/firecrawl-js";
import { callClaudeJSON } from "../claude";
import type { Audit, Step4Result } from "../types";

let firecrawl: Firecrawl | null = null;
function getFirecrawl(): Firecrawl {
  if (firecrawl) return firecrawl;
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("Missing FIRECRAWL_API_KEY");
  firecrawl = new Firecrawl({ apiKey });
  return firecrawl;
}

const REQUIRED_FIELDS = [
  "Product title",
  "Category",
  "Price",
  "Key benefits",
  "Materials / ingredients",
  "Who it is for",
  "Use cases",
  "Differentiators",
  "Reviews or proof points",
  "FAQs",
  "Comparison content",
  "Schema markup",
  "Shipping / returns / subscription info",
  "Safety, compliance, or claims language",
];

export async function step4Catalog(audit: Audit): Promise<Step4Result> {
  const fc = getFirecrawl();

  type ScrapeResult = {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
  const scrape = (await fc.scrape(audit.brand_url, {
    formats: ["markdown"],
    onlyMainContent: true,
  })) as unknown as ScrapeResult;

  const markdown = scrape?.markdown ?? "";
  // Cap to keep token usage reasonable
  const trimmed = markdown.slice(0, 18000);

  const system = `You are an AI catalog readiness auditor. You assess whether the brand's website surfaces the structured information an AI shopping assistant would need to confidently recommend its products.`;

  const user = `Brand: ${audit.brand_name}
Category: ${audit.category}
Source URL: ${audit.brand_url}

Below is the homepage content (markdown). Audit each required field. If a field is genuinely impossible to assess from the homepage, mark present="partial" and quality="low" rather than fabricating.

Required fields to audit (use these exact names):
${REQUIRED_FIELDS.map((f) => `- ${f}`).join("\n")}

For each field return:
- present: "yes" | "partial" | "no"
- quality: "high" | "medium" | "low" | "none"
- notes: one short sentence explaining the rating from an AI-readability perspective (e.g. "benefits are written for humans, not structured for AI extraction")

Also write a 2-3 sentence overall_summary characterizing how AI-ready the catalog is.

Return JSON of shape:
{
  "fields": [ { "field": "...", "present": "...", "quality": "...", "notes": "..." } ],
  "overall_summary": "..."
}

PAGE CONTENT (markdown):
---
${trimmed}
---`;

  type Extracted = { fields: Step4Result["fields"]; overall_summary: string };
  const extracted = await callClaudeJSON<Extracted>({
    system,
    user,
    maxTokens: 3500,
  });

  return {
    source_url: audit.brand_url,
    fields: extracted.fields,
    overall_summary: extracted.overall_summary,
  };
}
