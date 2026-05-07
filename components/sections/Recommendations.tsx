"use client";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import type { Recommendation, Step6Result } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE: Record<Recommendation["effort"] | Recommendation["expected_impact"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-700",
  high: "bg-accent/10 text-accent",
};

const IMPACT_RANK: Record<Recommendation["expected_impact"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function Recommendations({ data }: { data: Step6Result }) {
  const sorted = [...data.recommendations].sort(
    (a, b) => IMPACT_RANK[a.expected_impact] - IMPACT_RANK[b.expected_impact]
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <SectionLabel pulse>Recommendations</SectionLabel>
        <h3 className="text-2xl tracking-tight">
          Where to act first to lift AI visibility
        </h3>
        <p className="text-sm text-muted-foreground">
          Sorted by expected impact. Each recommendation is grounded in the
          shelf simulation, catalog audit, and enriched profile.
        </p>
      </div>

      <div className="grid gap-3">
        {sorted.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(i * 0.04, 0.32),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card className="p-5" interactive>
              <div className="flex items-start gap-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-accent-foreground shadow-[0_4px_14px_rgb(0_82_255_/_0.25)]">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div className="flex-1 grid gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="text-[15px] font-medium leading-snug tracking-tight">
                      {r.recommendation}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Pill label="Effort" value={r.effort} />
                      <Pill label="Impact" value={r.expected_impact} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.why_it_helps}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
}: {
  label: string;
  value: "low" | "medium" | "high";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        TONE[value]
      )}
    >
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </span>
  );
}
