"use client";
import { ChevronDown } from "lucide-react";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import type { RecommendationStrength, Step2Result } from "@/lib/types";
import { cn } from "@/lib/cn";

const STRENGTH_TONE: Record<RecommendationStrength, string> = {
  strong: "bg-success/15 text-success",
  medium: "bg-amber-500/15 text-amber-700",
  weak: "bg-orange-500/15 text-orange-700",
  absent: "bg-danger/15 text-danger",
};

export function ShelfSimulation({ data }: { data: Step2Result }) {
  const total = data.answers.length || 1;
  const mentions = data.answers.filter((a) => a.target_brand_mentioned).length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <SectionLabel>Shelf simulation</SectionLabel>
          <h3 className="text-2xl tracking-tight">
            Brand showed up in {mentions} of {total} simulated answers
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Each row is a Claude-generated stand-in for a generic AI shopping
            assistant&apos;s answer. Single-model proxy — directional, not a
            multi-LLM panel.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        {data.answers.map((a, i) => (
          <Card key={i} className="overflow-hidden p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                    STRENGTH_TONE[a.recommendation_strength]
                  )}
                >
                  {a.recommendation_strength}
                  {a.target_brand_rank ? ` · #${a.target_brand_rank}` : ""}
                </span>
                <span className="flex-1 truncate text-sm font-medium tracking-tight">
                  {a.prompt}
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline">
                  {a.brands_mentioned.length} brand
                  {a.brands_mentioned.length === 1 ? "" : "s"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-border bg-muted/40 px-5 py-5 text-sm">
                <p className="whitespace-pre-wrap text-foreground/90">
                  {a.raw_answer || (
                    <span className="text-muted-foreground italic">
                      No answer generated.
                    </span>
                  )}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Brands mentioned">
                    {a.brands_mentioned.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {a.brands_mentioned.map((b, j) => (
                          <span
                            key={j}
                            className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px]"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </Field>
                  <Field label="Competitors">
                    {a.competitors_mentioned.length
                      ? a.competitors_mentioned.join(", ")
                      : "—"}
                  </Field>
                  <Field label="Citations">
                    {a.citations_or_sources.length
                      ? a.citations_or_sources.join(", ")
                      : "—"}
                  </Field>
                  <Field label="Notes">{a.notes || "—"}</Field>
                </div>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-foreground/90 break-words">{children}</div>
    </div>
  );
}
