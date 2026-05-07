import "server-only";
import Firecrawl from "@mendable/firecrawl-js";
import { callClaudeJSON } from "./claude";

let firecrawl: Firecrawl | null = null;
function getFirecrawl(): Firecrawl {
  if (firecrawl) return firecrawl;
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("Missing FIRECRAWL_API_KEY");
  firecrawl = new Firecrawl({ apiKey });
  return firecrawl;
}

export type ValidatorCategoryKey =
  | "benefits"
  | "use_cases"
  | "faqs"
  | "comparison"
  | "reviews"
  | "schema";

export type ValidatorCategory = {
  category: ValidatorCategoryKey;
  label: string;
  score: number; // 0..100
  present: boolean;
  quality: "high" | "medium" | "low" | "none";
  observations: string;
  fix_hint: string;
};

export type SchemaSignals = {
  json_ld_types: string[];
  microdata_count: number;
  json_ld_blocks: number;
};

export type ValidationResult = {
  url: string;
  scraped_at: string;
  overall_score: number;
  summary: string;
  categories: ValidatorCategory[];
  schema_signals: SchemaSignals;
};

const CATEGORY_LABELS: Record<ValidatorCategoryKey, string> = {
  benefits: "Structured benefits",
  use_cases: "Use cases",
  faqs: "FAQs",
  comparison: "Comparison language",
  reviews: "Reviews / proof points",
  schema: "Schema markup",
};

// ---------------------------------------------------------------------------
// Schema detection — deterministic, no LLM.
// ---------------------------------------------------------------------------

function detectSchema(rawHtml: string): SchemaSignals {
  const ldBlocks = Array.from(
    rawHtml.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  );
  const microdata = (
    rawHtml.match(/itemtype=["']https?:\/\/schema\.org\/[^"']+["']/gi) ?? []
  ).length;

  const types = new Set<string>();
  for (const match of ldBlocks) {
    const body = match[1].trim();
    if (!body) continue;
    try {
      const parsed = JSON.parse(body);
      collectTypes(parsed, types);
    } catch {
      // Skip unparseable JSON-LD blocks rather than failing the whole scan.
    }
  }

  return {
    json_ld_types: Array.from(types).sort(),
    json_ld_blocks: ldBlocks.length,
    microdata_count: microdata,
  };
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  // Walk @graph wrappers
  if (Array.isArray(obj["@graph"])) {
    obj["@graph"].forEach((n) => collectTypes(n, out));
  }
  const t = obj["@type"];
  if (typeof t === "string") out.add(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
}

function scoreSchema(s: SchemaSignals): {
  score: number;
  present: boolean;
  quality: ValidatorCategory["quality"];
  observations: string;
  fix_hint: string;
} {
  const types = new Set(s.json_ld_types.map((t) => t.toLowerCase()));
  let score = 0;
  if (types.has("product")) score += 40;
  if (types.has("faqpage")) score += 20;
  if (types.has("review") || types.has("aggregaterating")) score += 20;
  if (
    s.json_ld_blocks > 0 &&
    !types.has("product") &&
    !types.has("faqpage") &&
    !types.has("review") &&
    !types.has("aggregaterating")
  ) {
    score += 10; // some other JSON-LD present (Organization, BreadcrumbList, etc.)
  }
  if (s.microdata_count > 0 && score === 0) score += 10;
  if (s.json_ld_types.length >= 3) score += 10;
  score = Math.min(100, score);

  const present = score > 0;
  const quality: ValidatorCategory["quality"] =
    score >= 80 ? "high" : score >= 50 ? "medium" : score >= 20 ? "low" : "none";

  const parts: string[] = [];
  if (s.json_ld_blocks > 0)
    parts.push(`${s.json_ld_blocks} JSON-LD block${s.json_ld_blocks === 1 ? "" : "s"}`);
  if (s.json_ld_types.length > 0)
    parts.push(`types: ${s.json_ld_types.join(", ")}`);
  if (s.microdata_count > 0)
    parts.push(`${s.microdata_count} schema.org microdata attribute${s.microdata_count === 1 ? "" : "s"}`);
  const observations = parts.length
    ? parts.join(" · ")
    : "No structured data detected on this page.";

  const missing: string[] = [];
  if (!types.has("product")) missing.push("Product");
  if (!types.has("faqpage")) missing.push("FAQPage");
  if (!types.has("review") && !types.has("aggregaterating"))
    missing.push("Review / AggregateRating");
  const fix_hint = missing.length
    ? `Add ${missing.join(", ")} JSON-LD to the page <head>.`
    : "Schema coverage is strong — keep it in sync with content.";

  return { score, present, quality, observations, fix_hint };
}

// ---------------------------------------------------------------------------
// Claude scoring for the 5 content categories.
// ---------------------------------------------------------------------------

type LLMCategory = {
  category: Exclude<ValidatorCategoryKey, "schema">;
  score: number;
  present: boolean;
  quality: ValidatorCategory["quality"];
  observations: string;
  fix_hint: string;
};

type LLMResult = {
  summary: string;
  categories: LLMCategory[];
};

async function scoreContentWithClaude(
  url: string,
  markdown: string,
  schema: SchemaSignals
): Promise<LLMResult> {
  const trimmed = markdown.slice(0, 18000);
  const system = `You assess whether a single product page is "AI-ready" — i.e. legible enough for AI shopping assistants (ChatGPT, Claude, Perplexity, Gemini) to confidently recommend the product. You score five content categories on 0-100 each. Be strict: AI-readiness means information is structured, scannable, and unambiguous, not merely present in marketing prose.`;

  const user = `Source URL: ${url}

Programmatic schema-detection result (you do NOT need to score schema markup — that's already handled deterministically):
- JSON-LD blocks: ${schema.json_ld_blocks}
- JSON-LD @types: ${schema.json_ld_types.length ? schema.json_ld_types.join(", ") : "none"}
- Microdata attrs: ${schema.microdata_count}

Score these five categories from the page content below:

1. benefits          — concrete, structured product benefits (not just adjectives)
2. use_cases         — explicit "for X scenario / Y user / Z need" statements
3. faqs              — Q&A blocks an AI can extract
4. comparison        — language that distinguishes this product from alternatives
5. reviews           — customer reviews, ratings, testimonials, proof points

For each return:
- score (0-100, integer)
- present (boolean)
- quality ("high" | "medium" | "low" | "none")
- observations (one sentence on what's actually on the page)
- fix_hint (one concrete sentence the merchant could act on)

Also write one sentence (\`summary\`) characterizing how AI-ready the page is overall.

Return JSON of shape:
{
  "summary": "...",
  "categories": [
    { "category": "benefits", "score": 60, "present": true, "quality": "medium",
      "observations": "...", "fix_hint": "..." },
    ...
  ]
}

PAGE CONTENT (markdown):
---
${trimmed}
---`;

  return callClaudeJSON<LLMResult>({
    system,
    user,
    maxTokens: 2500,
  });
}

// ---------------------------------------------------------------------------
// Main entrypoint.
// ---------------------------------------------------------------------------

export async function validatePage(url: string): Promise<ValidationResult> {
  const fc = getFirecrawl();

  type ScrapeResult = { markdown?: string; rawHtml?: string; html?: string };
  const scrape = (await fc.scrape(url, {
    formats: ["markdown", "rawHtml"],
    onlyMainContent: false, // we want <head> for JSON-LD detection
  })) as unknown as ScrapeResult;

  const markdown = scrape?.markdown ?? "";
  const rawHtml = scrape?.rawHtml ?? scrape?.html ?? "";

  const schemaSignals = detectSchema(rawHtml);
  const schemaScored = scoreSchema(schemaSignals);

  const llm = await scoreContentWithClaude(url, markdown, schemaSignals);

  const order: ValidatorCategoryKey[] = [
    "benefits",
    "use_cases",
    "faqs",
    "comparison",
    "reviews",
    "schema",
  ];
  const llmByKey = new Map(llm.categories.map((c) => [c.category, c]));

  const categories: ValidatorCategory[] = order.map((key) => {
    if (key === "schema") {
      return {
        category: "schema",
        label: CATEGORY_LABELS.schema,
        score: schemaScored.score,
        present: schemaScored.present,
        quality: schemaScored.quality,
        observations: schemaScored.observations,
        fix_hint: schemaScored.fix_hint,
      };
    }
    const c = llmByKey.get(key);
    return {
      category: key,
      label: CATEGORY_LABELS[key],
      score: clamp01_100(c?.score ?? 0),
      present: c?.present ?? false,
      quality: c?.quality ?? "none",
      observations: c?.observations ?? "Not assessed.",
      fix_hint: c?.fix_hint ?? "",
    };
  });

  const overall = Math.round(
    categories.reduce((s, c) => s + c.score, 0) / categories.length
  );

  return {
    url,
    scraped_at: new Date().toISOString(),
    overall_score: overall,
    summary: llm.summary,
    categories,
    schema_signals: schemaSignals,
  };
}

function clamp01_100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
