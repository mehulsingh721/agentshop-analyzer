"use client";
import { motion } from "framer-motion";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import type { IntentType, Step1Result } from "@/lib/types";
import { cn } from "@/lib/cn";

const INTENT_TONE: Record<IntentType, string> = {
  category_discovery: "bg-blue-500/10 text-blue-700",
  comparison: "bg-purple-500/10 text-purple-700",
  problem_aware: "bg-rose-500/10 text-rose-700",
  occasion_use_case: "bg-emerald-500/10 text-emerald-700",
  budget: "bg-amber-500/10 text-amber-700",
  ingredient_material: "bg-cyan-500/10 text-cyan-700",
};

const INTENT_LABEL: Record<IntentType, string> = {
  category_discovery: "Category",
  comparison: "Comparison",
  problem_aware: "Problem",
  occasion_use_case: "Use case",
  budget: "Budget",
  ingredient_material: "Ingredient",
};

export function PromptSet({ data }: { data: Step1Result }) {
  return (
    <div className="grid gap-6">
      <Header count={data.prompts.length} />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.prompts.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(i * 0.03, 0.3),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card className="h-full p-5" interactive>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                    INTENT_TONE[p.intent_type]
                  )}
                >
                  {INTENT_LABEL[p.intent_type]}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {p.funnel_stage}
                </span>
              </div>
              <p className="mt-3 text-[15px] font-medium leading-snug tracking-tight">
                &ldquo;{p.prompt}&rdquo;
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.why_it_matters}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <div className="grid gap-2">
      <SectionLabel>Prompt set</SectionLabel>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-2xl tracking-tight">
          {count} realistic shopper prompts
        </h3>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          across 6 intents
        </span>
      </div>
    </div>
  );
}
