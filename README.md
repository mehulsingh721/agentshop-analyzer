# agentShop — AI Product Shelf Audit

A Next.js app that audits how AI shopping assistants (ChatGPT, Claude,
Perplexity, Gemini) are likely to recommend an ecommerce brand, scores
its "AI Product Shelf" footprint, audits catalog AI-readiness, and ships
a prioritized recommendation list a merchant could see in an onboarding
call.

It ships two surfaces:

- **`/`** — the full audit: a 6-step background pipeline against a
  brand input, producing a tabbed, shareable report.
- **`/validator`** — a standalone AI-Ready Catalog Validator: paste any
  product URL, get a 0-100 readiness score across six signals in
  ~10-15s.

A shared sticky navbar moves between the two.

---

## Why this exists

Shoppers don't only browse product grids anymore — they ask AI
assistants what to buy:

- "Best filtered showerhead for hard water?"
- "Jolie vs Canopy shower filter?"
- "Best wellness gift for someone moving apartments?"

If a brand isn't *legible* to those assistants, it doesn't get
recommended. agentShop measures that legibility and produces a concrete
plan to improve it.

---

## What it produces

Once you click **Run audit**, the report fills in across six tabs:

| # | Tab            | Contents                                                                                 |
|---|----------------|------------------------------------------------------------------------------------------|
| 1 | Prompts        | 18-22 realistic shopper prompts spanning 6 intent types, with funnel-stage tags         |
| 2 | Simulation     | Per-prompt simulated AI answer + extracted brands, rank, recommendation strength        |
| 3 | Score          | 0-100 AI Product Shelf Score with metric tiles and a weighted-component breakdown       |
| 4 | Catalog        | 14-field AI-readiness audit of the brand homepage with quality bars                     |
| 5 | Profile        | Structured AI-safe product profile (benefits, best_for, not_best_for, comparison_claims) |
| 6 | Recommendations| 6-9 prioritized actions sorted by expected impact, with effort/impact pills              |

The tab bar auto-advances to the latest completed step until the user
manually picks one. Each tab shows a placeholder with a live spinner
while its underlying step is still running.

---

## How it works

```
Browser (zustand)             Next.js server                  Supabase
─────────────────             ──────────────                  ────────
                                                            
 [AuditForm]    POST /api/audits ──▶  insert row,           audits row
                                       fire runAudit() ─────────────▶ steps[]
                                                            (JSONB)   ▲
                                                                      │
                                       step 1 → write ─────────────────┤
                                       step 2 → write ─────────────────┤
                                       ...                              │
                                       step 6 → write ─────────────────┘
                                                                       │
 GET /api/audits/[id]  ◀─── poll every 2s ──────────────────────────────┘
 [ProgressBar]         (zustand store)                          
 [ReportView]                                                   
```

- The pipeline is **server-side and persistent** — kicking off an audit
  returns an id, the server runs all six steps writing progress back to
  the `audits` row, and the client polls every 2 seconds.
- Every audit gets a UUID. Switching tabs, refreshing, or sharing the
  `/?id=<uuid>` URL all resume polling against the same row.

---

## Stack

- **Next.js 16** App Router, React 19, Tailwind v4 (CSS-first `@theme`)
- **Anthropic SDK** with `claude-sonnet-4-6` for all LLM calls (Step 1, 2, 4, 5, 6)
- **`@mendable/firecrawl-js`** for the brand homepage scrape (Step 4)
- **Supabase** — single `audits` table, JSONB step results, server-only secret key
- **Zustand** for client state, **axios** for HTTP, **framer-motion** + **lucide-react** for UI

---

## Quick start

1. **Install:**
   ```sh
   pnpm install
   ```

2. **Provision Supabase:** create a project and run [sql/schema.sql](sql/schema.sql) in the SQL editor. The schema is a single `audits` table with a JSONB `steps` column — no migrations needed when step records gain new fields.

3. **Create `.env.local`** (copy `.env.local.example`):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   FIRECRAWL_API_KEY=fc-...

   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
   `SUPABASE_SECRET_KEY` is the new-style key (`sb_secret_...`) Supabase introduced in late 2025; the legacy `SUPABASE_SERVICE_ROLE_KEY` JWT is still accepted as a fallback. Either one is server-only — it bypasses RLS and is never exposed to the browser. The publishable key is browser-safe and reserved for any future client-side reads.

4. **Run:**
   ```sh
   pnpm dev
   ```

5. Open <http://localhost:3000>. The form is prefilled with the Jolie example. Click **Run audit**.

---

## Configuration

### Brand input

The default brand is a constant at the top of [app/page.tsx](app/page.tsx):

```ts
const DEFAULT_INPUT: AuditInput = {
  brand_name: "Jolie",
  brand_url: "https://jolieskinco.com",
  category: "filtered showerheads",
  competitors: ["Canopy", "Hello Klean", "Aquasana", "Sprite Showers"],
};
```

The form fields are also editable in the UI before running.

### Environment variables

| Var                                   | Required | Used by                                |
|---------------------------------------|----------|----------------------------------------|
| `ANTHROPIC_API_KEY`                   | yes      | All LLM calls in [lib/claude.ts](lib/claude.ts) |
| `FIRECRAWL_API_KEY`                   | yes      | Step 4 scrape in [lib/pipeline/step4-catalog.ts](lib/pipeline/step4-catalog.ts) |
| `NEXT_PUBLIC_SUPABASE_URL`            | yes      | Server admin client (`SUPABASE_URL` also accepted) |
| `SUPABASE_SECRET_KEY`                 | yes      | Server-only writes (`SUPABASE_SERVICE_ROLE_KEY` also accepted) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| no       | Reserved for future client-side reads  |

---

## The audit pipeline

The orchestrator [lib/pipeline/index.ts](lib/pipeline/index.ts) runs six
steps sequentially. After each step, the result is written into
`audits.steps[i]` along with `started_at` / `completed_at`, and
`current_step` is incremented — so the client's polling sees progress in
real time. A failure in any step marks the audit `failed` and stops.

### Step 1 — Prompt set

[lib/pipeline/step1-prompts.ts](lib/pipeline/step1-prompts.ts) — a
single Claude call that generates 18-22 prompts covering all six intent
types (category discovery, comparison, problem-aware,
occasion/use case, budget, ingredient/material). Each prompt also
carries an `intent_type`, `funnel_stage`, and one-sentence
`why_it_matters`.

### Step 2 — Shelf simulation

[lib/pipeline/step2-simulation.ts](lib/pipeline/step2-simulation.ts) —
for each prompt, asks Claude to (a) write a realistic AI-assistant
answer, then (b) extract structured fields:

```ts
{
  brands_mentioned: string[],
  target_brand_mentioned: boolean,
  target_brand_rank: number | null,
  competitors_mentioned: string[],
  recommendation_strength: "strong" | "medium" | "weak" | "absent",
  citations_or_sources: string[],
  notes: string,
}
```

Prompts are processed in **batches of 5 concurrently** (`Promise.all`
inside a chunked loop), preserving original order via index slotting
into a pre-sized array. One prompt's failure produces a `failureAnswer`
for that row only; the rest of the batch continues.

### Step 3 — AI Product Shelf Score

[lib/pipeline/step3-score.ts](lib/pipeline/step3-score.ts) —
deterministic JS computation from Step 2's output. The score is a
weighted blend on 0-100:

```
30% mention rate
20% rank component (rank 1 → 1.0, rank ≥ 5 → 0)
20% recommendation strength (strong=1.0, medium=0.6, weak=0.3, absent=0)
15% competitor dominance penalty (1 − share of answers featuring top competitor)
15% citation coverage (share of answers with cited sources)
```

The breakdown is shown in the Score tab as animated component bars so
users can see *which* component dragged the score down.

### Step 4 — Catalog readiness

[lib/pipeline/step4-catalog.ts](lib/pipeline/step4-catalog.ts) —
Firecrawl scrapes the brand homepage as markdown, then a single Claude
call audits 14 fields (Product title, Category, Price, Key benefits,
Materials, Who it is for, Use cases, Differentiators, Reviews, FAQs,
Comparison content, Schema markup, Shipping/returns, Safety/compliance)
on `present` (yes/partial/no) and `quality` (high/medium/low/none),
plus a 2-3 sentence overall summary.

### Step 5 — Smart attribute enrichment

[lib/pipeline/step5-enrichment.ts](lib/pipeline/step5-enrichment.ts) —
turns Step 4 + brand context into a structured AI-safe product profile:

```ts
{
  product_name, category,
  primary_benefits: string[],     // 3-5 concrete benefits
  best_for: string[],             // 3-5 buyer types/situations
  not_best_for: string[],         // 1-3 honest exclusions
  comparison_claims: string[],    // 2-4 differentiators
  ai_safe_description: string,    // 1-2 factual sentences
}
```

### Step 6 — Recommendations

[lib/pipeline/step6-recommendations.ts](lib/pipeline/step6-recommendations.ts)
— Claude synthesizes 6-9 recommendations grounded in Steps 3-5,
each with `recommendation`, `why_it_helps`, `effort` (low/medium/high),
and `expected_impact` (low/medium/high). The UI sorts by impact.

---

## AI-Ready Catalog Validator (`/validator`)

A standalone, single-shot tool for scoring **one product page** without
running the full audit pipeline. Useful when you just want a quick read
on a PDP — "is this page legible enough for AI assistants to recommend
the product?".

It scores six signals on 0-100 each, then averages them:

| Signal              | How it's scored                                      |
|---------------------|------------------------------------------------------|
| Structured benefits | Claude — concrete, structured benefits (not adjectives) |
| Use cases           | Claude — explicit "for X scenario / Y user" framing |
| FAQs                | Claude — Q&A blocks an AI can extract               |
| Comparison language | Claude — copy that distinguishes vs alternatives    |
| Reviews / proof     | Claude — customer reviews, ratings, testimonials    |
| **Schema markup**   | **Deterministic** — JSON-LD `@type` regex on rawHtml |

Schema is the one signal scored without an LLM:
[lib/validator.ts](lib/validator.ts) regexes every
`<script type="application/ld+json">` block, JSON-parses each (walking
`@graph` arrays), and weights by detected types — `Product` (+40),
`FAQPage` (+20), `Review`/`AggregateRating` (+20), other JSON-LD or
microdata (+10), 3+ distinct types completeness bonus (+10), capped at
100. The schema-detection result is also passed into Claude's prompt as
context so it doesn't try to re-judge it.

**Synchronous flow** — no Supabase row, no polling. The browser POSTs
to `/api/validate`, awaits ~10-15s (one Firecrawl scrape + one Claude
call), and renders:

- A score hero with an animated gradient ring dial
- A schema-evidence chip row showing the detected `@type` values
- A 1/2/3-col grid of category cards: score, gradient progress bar,
  present/quality pills, observations, and a one-line `fix_hint`

Implementation: [lib/validator.ts](lib/validator.ts),
[app/api/validate/route.ts](app/api/validate/route.ts), and
[app/validator/page.tsx](app/validator/page.tsx).

---

## Sharing reports

Audits are keyed by UUID, and `GET /api/audits/[id]` is unauthenticated.
After kicking off a run, the URL becomes `/?id=<uuid>` and a Copy-link
input appears next to the report headline.

Recipients opening that URL see a **viewer-mode** page: the configure
form is hidden, the hero shows "You're viewing a shared audit for
{brand} · {category}", and the progress + report render exactly as the
owner sees them. A small "Run your own audit →" link clears `?id=` and
returns the configure form.

Implementation: [components/ShareLink.tsx](components/ShareLink.tsx) and
the `viewerMode` state in [app/page.tsx](app/page.tsx).

---

## ETAs grounded in real timing history

To prevent the "is it stuck?" feeling on a 1-3 minute run, every step
shows:

| State    | Right-hand metadata                                    |
|----------|--------------------------------------------------------|
| pending  | `est. ~32s` (or empty if no history)                  |
| running  | `0:14 / ~0:32` — live elapsed clock vs. estimate       |
| done     | `12s` — actual measured duration                       |
| failed   | `failed at 18s`                                        |

Plus a top-line summary: `0:14 elapsed · ~1:47 left`.

**No fabricated numbers.** Estimates come exclusively from
[lib/pipeline/estimates.ts](lib/pipeline/estimates.ts), which queries
the last 10 completed audits and averages each step's measured
`(completed_at − started_at)` duration. The `POST /api/audits` handler
calls it before insert and stamps the result onto each seeded step's
`estimated_seconds` field. If a step has no history, it stays `null`
and the UI hides the ETA rather than guessing.

### Pipeline versioning

When a step's runtime characteristics change (e.g. Step 2 batching),
old measurements stop being representative. Each step record is tagged
with the current `PIPELINE_VERSION` (see
[lib/pipeline/version.ts](lib/pipeline/version.ts)) at audit-creation
time. `computeStepEstimates` filters historical samples to the current
version, so:

- Bumping `PIPELINE_VERSION` invalidates *all* prior data automatically.
- The very next audit shows no ETAs; after a couple of fresh runs, the
  per-step numbers reflect the new reality.
- No SQL migration needed — `pipeline_version` lives inside the
  existing `steps` JSONB.

---

## Project layout

```
app/
  page.tsx                             # / — form + progress + tabbed report
  layout.tsx                           # fonts, metadata, mounts <Navbar />
  globals.css                          # design tokens (@theme inline)
  validator/
    page.tsx                           # /validator — single-shot PDP scorer
  api/
    audits/route.ts                    # POST /api/audits  (creates row, fires runAudit)
    audits/[id]/route.ts               # GET  /api/audits/:id  (poll target)
    validate/route.ts                  # POST /api/validate  (sync; returns score)

lib/
  claude.ts                            # Anthropic client + callClaudeJSON<T> helper
  store.ts                             # zustand: startAudit, resumePolling
  types.ts                             # Audit, StepRecord, per-step result types
  format.ts                            # formatDuration, durationSeconds
  cn.ts                                # className join
  validator.ts                         # validatePage(): scrape + schema regex + Claude
  pipeline/
    index.ts                           # runAudit orchestrator
    version.ts                         # PIPELINE_VERSION constant + log
    estimates.ts                       # historical ETAs from past audits
    step1-prompts.ts ... step6-recommendations.ts

utils/supabase/
  admin.ts                             # service-role admin client (server-only)
  database.types.ts                    # Database type for typed queries

components/
  Navbar.tsx                           # sticky glass navbar with active-route underline
  AuditForm.tsx                        # 4-field configure form
  ProgressBar.tsx                      # progress bar + per-step rows + live ETA
  ReportView.tsx                       # animated tabs that auto-advance
  ShareLink.tsx                        # URL field + copy button
  sections/                            # one component per report tab
  ui/
    Button.tsx                         # primary gradient + outline + ghost
    Card.tsx                           # standard / interactive / featured
    SectionLabel.tsx                   # mono-uppercase pill with optional pulsing dot
    Tabs.tsx                           # animated underline via framer-motion layoutId

sql/schema.sql                         # single `audits` table
```

---

## API surface

### `POST /api/audits`

```jsonc
// request body
{
  "brand_name": "Jolie",
  "brand_url": "https://jolieskinco.com",
  "category": "filtered showerheads",
  "competitors": ["Canopy", "Hello Klean", "Aquasana"]
}

// response
{ "id": "8f3...uuid" }
```

Side-effects: inserts an `audits` row with `status: "pending"`, seeds
the steps array with `estimated_seconds` and `pipeline_version`, then
fires `runAudit(id)` server-side and returns immediately.

### `GET /api/audits/[id]`

Returns the full `audits` row (no auth). The client polls this every
2 seconds. Stops when `status === "completed" | "failed"`.

### `POST /api/validate`

```jsonc
// request body
{ "url": "https://example.com/products/your-product" }

// response (abbreviated)
{
  "url": "...",
  "scraped_at": "2026-05-08T12:34:56.000Z",
  "overall_score": 72,
  "summary": "Page surfaces benefits and reviews well, but FAQs and schema are thin.",
  "categories": [
    { "category": "benefits",   "score": 80, "present": true, "quality": "high",   "observations": "...", "fix_hint": "..." },
    { "category": "use_cases",  "score": 60, "present": true, "quality": "medium", "observations": "...", "fix_hint": "..." },
    { "category": "faqs",       "score": 30, "present": true, "quality": "low",    "observations": "...", "fix_hint": "..." },
    { "category": "comparison", "score": 50, "present": true, "quality": "medium", "observations": "...", "fix_hint": "..." },
    { "category": "reviews",    "score": 90, "present": true, "quality": "high",   "observations": "...", "fix_hint": "..." },
    { "category": "schema",     "score": 70, "present": true, "quality": "medium", "observations": "...", "fix_hint": "..." }
  ],
  "schema_signals": {
    "json_ld_types": ["Product", "Organization"],
    "json_ld_blocks": 2,
    "microdata_count": 0
  }
}
```

Synchronous — one Firecrawl scrape + one Claude call. Returns 400 for
missing/invalid URLs and 500 with a passthrough message on scrape or
LLM failure.

---

## Limitations & trade-offs

- **Step 2 is Claude-as-proxy.** A single LLM (Claude) simulates what a
  generic AI shopping assistant would say — directional, not a real
  multi-LLM panel. To upgrade, swap the simulation in
  [lib/pipeline/step2-simulation.ts](lib/pipeline/step2-simulation.ts)
  for real per-assistant API calls or paste-in answers.
- **Background execution is fire-and-forget.** Works on any
  self-hosted Node process (including `pnpm dev`). On Vercel
  serverless, the request handler may terminate before the pipeline
  finishes — replace with `after()` from `next/server` or move to a
  proper queue.
- **Catalog audit reads only the homepage.** Adding a PDP fetch is a
  small extension to [step4-catalog.ts](lib/pipeline/step4-catalog.ts):
  discover a product link from the homepage HTML and scrape one more
  page.
- **Concurrency limit on Step 2.** Hardcoded at 5 concurrent
  simulations. Bump `BATCH_SIZE` in
  [step2-simulation.ts](lib/pipeline/step2-simulation.ts) if your
  Anthropic tier permits.
- **No RLS.** The `audits` table is written with the secret key from
  the server only; the table has no row-level policies. Anyone with a
  UUID can read the audit (intentional, for sharing) — don't put PII
  in inputs.

---

## Costs

A typical 20-prompt audit runs ~22 Claude calls and one Firecrawl
scrape:

| Source     | Calls          | Approx. cost (USD) |
|------------|----------------|--------------------|
| Step 1     | 1              | ~$0.005            |
| Step 2     | 18-22          | $0.03-0.10         |
| Step 3     | 0 (pure JS)    | —                  |
| Step 4     | 1 + 1 scrape   | ~$0.01-0.02        |
| Step 5, 6  | 2              | ~$0.01             |
| **Total**  |                | **~$0.05-0.20**    |

Most tokens go to Step 2; trimming `step1`'s prompt count or shrinking
Step 2's `maxTokens` are the biggest knobs.

A standalone `/validator` run is **one Firecrawl scrape + one Claude
call**, costing ~$0.01-0.02 per page. Schema scoring is free
(deterministic regex).

---

## Extending

Common changes and where they live:

| You want to…                                | Edit                                                              |
|---------------------------------------------|-------------------------------------------------------------------|
| Change the default brand input              | `DEFAULT_INPUT` in [app/page.tsx](app/page.tsx)                   |
| Tweak the score formula                     | [lib/pipeline/step3-score.ts](lib/pipeline/step3-score.ts)        |
| Add or rename audit fields                  | `REQUIRED_FIELDS` in [step4-catalog.ts](lib/pipeline/step4-catalog.ts) |
| Change the LLM model                        | `DEFAULT_MODEL` in [lib/claude.ts](lib/claude.ts)                 |
| Adjust Step 2 concurrency                   | `BATCH_SIZE` in [step2-simulation.ts](lib/pipeline/step2-simulation.ts) |
| Bump the pipeline version (rolls history)   | `PIPELINE_VERSION` in [lib/pipeline/version.ts](lib/pipeline/version.ts) |
| Add a new step                              | New file under `lib/pipeline/`, plus an entry in `STEP_NAMES` ([lib/types.ts](lib/types.ts)) and a wire-up in `runAudit` ([lib/pipeline/index.ts](lib/pipeline/index.ts)) |
| Restyle a report tab                        | Component under [components/sections/](components/sections/)      |
| Tweak the validator's schema-scoring weights| `scoreSchema()` in [lib/validator.ts](lib/validator.ts)           |
| Add a route to the navbar                   | `LINKS` array in [components/Navbar.tsx](components/Navbar.tsx)   |
