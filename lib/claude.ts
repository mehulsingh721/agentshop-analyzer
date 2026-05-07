import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  client = new Anthropic({ apiKey });
  return client;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function callClaudeText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const c = getClient();
  const res = await c.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  return text;
}

function extractJson(raw: string): string {
  // Strip ```json fences if Claude added them
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  // Otherwise grab first { ... } or [ ... ] block
  const firstBrace = raw.search(/[\[{]/);
  if (firstBrace === -1) return raw.trim();
  return raw.slice(firstBrace).trim();
}

export async function callClaudeJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
  retries?: number;
}): Promise<T> {
  const retries = opts.retries ?? 1;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const text = await callClaudeText({
      ...opts,
      system:
        opts.system +
        "\n\nRespond with valid JSON only. No prose, no markdown fences.",
    });
    try {
      return JSON.parse(extractJson(text)) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Claude returned invalid JSON after ${retries + 1} attempts: ${String(lastErr)}`
  );
}
