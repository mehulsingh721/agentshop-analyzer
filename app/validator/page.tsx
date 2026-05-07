"use client";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { ValidationResult, ValidatorCategory } from "@/lib/validator";

const easeOut = [0.16, 1, 0.3, 1] as const;

const PRESENT_TONE: Record<string, string> = {
  yes: "bg-success/15 text-success",
  partial: "bg-amber-500/15 text-amber-700",
  no: "bg-danger/15 text-danger",
};

const QUALITY_TONE: Record<ValidatorCategory["quality"], string> = {
  high: "bg-success",
  medium: "bg-amber-500",
  low: "bg-orange-500",
  none: "bg-muted-foreground/40",
};

export default function ValidatorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post<ValidationResult>("/api/validate", {
        url: url.trim(),
      });
      setResult(data);
    } catch (e) {
      let msg = "Validation failed";
      if (axios.isAxiosError(e)) msg = e.response?.data?.error ?? e.message;
      else if (e instanceof Error) msg = e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-accent-secondary/10 blur-[120px]" />
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <Hero />

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
          className="rounded-3xl border border-border bg-card/80 p-6 shadow-[0_1px_3px_rgb(15_23_42_/_0.04),0_24px_60px_-30px_rgb(15_23_42_/_0.18)] backdrop-blur sm:p-8"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <SectionLabel>Validate a page</SectionLabel>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              ~10-15s per check
            </span>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              required
              value={url}
              disabled={loading}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/products/your-product"
              className="h-12 w-full flex-1 rounded-xl border border-border bg-card px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Validate
                </>
              )}
            </Button>
          </form>
          {error && (
            <p className="mt-3 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </motion.section>

        {loading && <LoadingSkeleton />}

        {result && !loading && <ResultView result={result} />}

        <Footer />
      </div>
    </main>
  );
}

function Hero() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="grid gap-5"
    >
      <div className="flex items-center gap-3">
        <SectionLabel pulse>Validator</SectionLabel>
      </div>
      <h1 className="text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem]">
        AI-Ready Catalog{" "}
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
            Validator
          </span>
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-2 w-full rounded-sm bg-gradient-to-r from-accent/15 to-accent-secondary/10 sm:-bottom-1.5 sm:h-2.5"
          />
        </span>
      </h1>
      <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        Paste any product page URL and get a 0-100 AI-readiness score across
        six signals — structured benefits, use cases, FAQs, comparison
        language, reviews, and schema markup. Schema is detected
        deterministically; the rest is read by Claude.
      </p>
    </motion.header>
  );
}

function ResultView({ result }: { result: ValidationResult }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="grid gap-6"
    >
      <SectionLabel pulse>Validation result</SectionLabel>
      <ScoreHero score={result.overall_score} summary={result.summary} />
      <SchemaEvidence signals={result.schema_signals} />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {result.categories.map((c) => (
          <CategoryCard key={c.category} cat={c} />
        ))}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Source: <a href={result.url} target="_blank" rel="noreferrer" className="hover:underline normal-case">{result.url}</a>
        {" · "}scraped {new Date(result.scraped_at).toLocaleTimeString()}
      </p>
    </motion.section>
  );
}

function ScoreHero({ score, summary }: { score: number; summary: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="dot-grid relative overflow-hidden rounded-3xl bg-foreground px-8 py-10 text-background sm:px-12 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-accent-secondary/20 blur-[120px]"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid max-w-md gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
            AI-readiness score
          </span>
          <p className="text-lg leading-snug">{summary}</p>
        </div>
        <div className="relative grid place-items-center">
          <svg width={150} height={150} viewBox="0 0 150 150" className="-rotate-90">
            <defs>
              <linearGradient id="val-grad" x1="0" y1="0" x2="1" y2="1">
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
              stroke="url(#val-grad)"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: easeOut }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-5xl tabular-nums leading-none">{score}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                of 100
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchemaEvidence({
  signals,
}: {
  signals: ValidationResult["schema_signals"];
}) {
  if (signals.json_ld_blocks === 0 && signals.microdata_count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Schema evidence
      </span>
      <span className="text-muted-foreground/80">
        {signals.json_ld_blocks} JSON-LD block{signals.json_ld_blocks === 1 ? "" : "s"}
        {signals.microdata_count > 0 && ` · ${signals.microdata_count} microdata`}
      </span>
      {signals.json_ld_types.map((t) => (
        <span
          key={t}
          className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function CategoryCard({ cat }: { cat: ValidatorCategory }) {
  const presentKey = cat.present
    ? cat.quality === "low" || cat.quality === "none"
      ? "partial"
      : "yes"
    : "no";
  return (
    <Card className="grid gap-3 p-5" interactive>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {cat.label}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
            PRESENT_TONE[presentKey]
          )}
        >
          {presentKey}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <div className="text-3xl tracking-tight tabular-nums">{cat.score}</div>
        <span className="mb-1 text-xs capitalize text-muted-foreground">
          {cat.quality} quality
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cat.score}%` }}
          transition={{ duration: 0.7, ease: easeOut }}
          className={cn("h-full rounded-full", QUALITY_TONE[cat.quality])}
        />
      </div>
      <p className="text-sm text-foreground/85">{cat.observations}</p>
      {cat.fix_hint && (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-[0.15em] text-accent/80">
            Fix
          </span>{" "}
          {cat.fix_hint}
        </p>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <SectionLabel>Working...</SectionLabel>
      <div className="dot-grid relative overflow-hidden rounded-3xl bg-foreground px-8 py-10 text-background sm:px-12">
        <div className="flex items-center justify-between gap-6">
          <div className="grid max-w-md gap-3">
            <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-72 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-56 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="grid place-items-center">
            <div className="grid h-[150px] w-[150px] place-items-center rounded-full border border-white/10">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-1 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-border pt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      Powered by Claude · Firecrawl
    </footer>
  );
}
