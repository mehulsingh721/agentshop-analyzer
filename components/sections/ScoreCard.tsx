"use client";
import { motion } from "framer-motion";
import type { Step3Result } from "@/lib/types";
import { SectionLabel } from "../ui/SectionLabel";
import { cn } from "@/lib/cn";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function ScoreCard({ data }: { data: Step3Result }) {
  return (
    <div className="grid gap-8">
      <ScoreHero score={data.score} />
      <Metrics data={data} />
      <Breakdown data={data.breakdown} />
    </div>
  );
}

function ScoreHero({ score }: { score: number }) {
  return (
    <div className="dot-grid relative overflow-hidden rounded-3xl bg-foreground px-8 py-12 text-background sm:px-12">
      {/* radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-accent-secondary/20 blur-[120px]"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-3">
          <SectionLabel className="bg-white/[0.06] border-white/15">
            <span className="text-white/80">AI Product Shelf Score</span>
          </SectionLabel>
          <h3 className="text-3xl leading-tight tracking-tight sm:text-4xl">
            How recommendable is this brand
            <br />
            <span className="bg-gradient-to-r from-accent-secondary to-white bg-clip-text text-transparent">
              inside AI shopping
            </span>
            ?
          </h3>
          <p className="max-w-md text-sm text-white/60">
            Weighted blend of mention rate (30%), rank when mentioned (20%),
            recommendation strength (20%), competitor dominance penalty (15%),
            and citation coverage (15%).
          </p>
        </div>

        <ScoreDial score={score} />
      </div>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width={150} height={150} viewBox="0 0 150 150" className="-rotate-90">
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0052FF" />
            <stop offset="100%" stopColor="#4D7CFF" />
          </linearGradient>
        </defs>
        <circle
          cx={75}
          cy={75}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
          fill="none"
        />
        <motion.circle
          cx={75}
          cy={75}
          r={r}
          stroke="url(#score-grad)"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-5xl tabular-nums leading-none">
            {score}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            of 100
          </div>
        </div>
      </div>
    </div>
  );
}

function Metrics({ data }: { data: Step3Result }) {
  const tiles: Array<{ label: string; value: string; hint?: string }> = [
    { label: "Prompt coverage", value: `${data.prompt_coverage}` },
    { label: "Mention rate", value: pct(data.mention_rate) },
    {
      label: "Avg rank when mentioned",
      value:
        data.average_rank_when_mentioned !== null
          ? data.average_rank_when_mentioned.toFixed(1)
          : "—",
    },
    {
      label: "Strong recommendation",
      value: pct(data.strong_recommendation_rate),
    },
    {
      label: "Top competitor",
      value: data.top_competitor ?? "—",
      hint: data.top_competitor
        ? `${pct(data.competitor_dominance)} of answers`
        : undefined,
    },
    { label: "Citation coverage", value: pct(data.citation_coverage) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t.label}
          </div>
          <div className="mt-1 text-xl tracking-tight tabular-nums">
            {t.value}
          </div>
          {t.hint && (
            <div className="mt-0.5 text-xs text-muted-foreground">{t.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Breakdown({ data }: { data: Step3Result["breakdown"] }) {
  const rows: Array<{ label: string; weight: number; component: number }> = [
    { label: "Mention rate", weight: 30, component: data.mention_component },
    {
      label: "Rank when mentioned",
      weight: 20,
      component: data.rank_component,
    },
    {
      label: "Recommendation strength",
      weight: 20,
      component: data.strength_component,
    },
    {
      label: "Competitor dominance penalty",
      weight: 15,
      component: data.competitor_penalty,
    },
    {
      label: "Citation coverage",
      weight: 15,
      component: data.citation_component,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="text-lg tracking-tight">
          Component breakdown
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          weight × score
        </div>
      </div>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/90">{r.label}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {r.weight}% · {Math.round(r.component * 100)}/100
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(1, r.component)) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary"
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
