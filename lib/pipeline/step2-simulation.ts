import "server-only";
import { callClaudeJSON } from "../claude";
import type {
  Audit,
  PromptItem,
  ShelfAnswer,
  Step1Result,
  Step2Result,
} from "../types";

async function simulateOne(
  audit: Audit,
  item: PromptItem
): Promise<ShelfAnswer> {
  const system = `You simulate the behavior of a generic AI shopping assistant. Given a shopper prompt, you (1) write what such an assistant would naturally answer, then (2) extract structured fields from your own answer.

Be realistic: do NOT artificially favor any brand. Mention the brands you genuinely believe an AI assistant would surface for this prompt today, in the natural order they would appear. If the brand wouldn't be mentioned, do not invent a mention.`;

  const user = `Target brand being audited: ${audit.brand_name}
Brand category: ${audit.category}
Known competitors: ${audit.competitors.join(", ") || "(none)"}

Shopper prompt: "${item.prompt}"
Intent type: ${item.intent_type}

Step 1: Write a realistic ~3-6 sentence answer an AI shopping assistant would give.
Step 2: From that answer, extract fields.

Return JSON of shape:
{
  "raw_answer": "<the answer you wrote>",
  "brands_mentioned": ["BrandA", "BrandB"],         // in order of appearance
  "target_brand_mentioned": true|false,
  "target_brand_rank": 1|2|3|null,                   // 1-indexed position among brands_mentioned, or null
  "competitors_mentioned": ["BrandX"],               // subset of known competitors that appeared
  "recommendation_strength": "strong"|"medium"|"weak"|"absent",
    // strong  = explicitly recommended as a top pick
    // medium  = mentioned positively
    // weak    = mentioned briefly without endorsement
    // absent  = not mentioned at all
  "citations_or_sources": ["https://..."],           // any sources/URLs the answer would cite, [] if none
  "notes": "<one sentence on why the brand was/wasn't featured>"
}`;

  type Extracted = Omit<ShelfAnswer, "prompt" | "intent_type">;
  const extracted = await callClaudeJSON<Extracted>({
    system,
    user,
    maxTokens: 1500,
  });

  return {
    prompt: item.prompt,
    intent_type: item.intent_type,
    ...extracted,
  };
}

const BATCH_SIZE = 5;

function failureAnswer(item: PromptItem, e: unknown): ShelfAnswer {
  return {
    prompt: item.prompt,
    intent_type: item.intent_type,
    raw_answer: "",
    brands_mentioned: [],
    target_brand_mentioned: false,
    target_brand_rank: null,
    competitors_mentioned: [],
    recommendation_strength: "absent",
    citations_or_sources: [],
    notes: `Simulation failed: ${e instanceof Error ? e.message : String(e)}`,
  };
}

export async function step2Simulation(
  audit: Audit,
  step1: Step1Result
): Promise<Step2Result> {
  const prompts = step1.prompts;
  const answers: ShelfAnswer[] = new Array(prompts.length);

  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((item) =>
        simulateOne(audit, item).catch((e) => failureAnswer(item, e))
      )
    );
    results.forEach((ans, j) => {
      answers[i + j] = ans;
    });
  }

  return { answers };
}
