"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  STEP_NAMES,
  type Audit,
  type Step1Result,
  type Step2Result,
  type Step3Result,
  type Step4Result,
  type Step5Result,
  type Step6Result,
} from "@/lib/types";
import { Tabs, type TabItem } from "./ui/Tabs";
import { PromptSet } from "./sections/PromptSet";
import { ShelfSimulation } from "./sections/ShelfSimulation";
import { ScoreCard } from "./sections/ScoreCard";
import { CatalogAudit } from "./sections/CatalogAudit";
import { EnrichedProfile } from "./sections/EnrichedProfile";
import { Recommendations } from "./sections/Recommendations";

const SHORT_LABELS = [
  "Prompts",
  "Simulation",
  "Score",
  "Catalog",
  "Profile",
  "Recommendations",
];

export function ReportView({ audit }: { audit: Audit }) {
  const steps = audit.steps;
  const [activeIdx, setActiveIdx] = useState(0);
  const userOverride = useRef(false);

  // Auto-advance to the latest done step until the user manually picks one.
  useEffect(() => {
    if (userOverride.current) return;
    const lastDone = [...steps]
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status === "done")
      .pop();
    if (lastDone && lastDone.i !== activeIdx) setActiveIdx(lastDone.i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.map((s) => s.status).join("|")]);

  const items: TabItem[] = STEP_NAMES.map((_, i) => ({
    id: String(i),
    label: SHORT_LABELS[i],
    eyebrow: String(i + 1).padStart(2, "0"),
    status: steps[i]?.status,
  }));

  const active = steps[activeIdx];

  return (
    <div className="grid gap-6">
      <Tabs
        items={items}
        activeId={String(activeIdx)}
        onChange={(id) => {
          userOverride.current = true;
          setActiveIdx(Number(id));
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <TabPanel index={activeIdx} step={active} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabPanel({
  index,
  step,
}: {
  index: number;
  step: Audit["steps"][number] | undefined;
}) {
  if (!step || step.status === "pending") {
    return (
      <PlaceholderPanel
        title={STEP_NAMES[index]}
        message="This step hasn't started yet. It will populate automatically as the pipeline progresses."
      />
    );
  }
  if (step.status === "running") {
    return (
      <PlaceholderPanel
        title={STEP_NAMES[index]}
        message="Generating results... this tab will fill in within a few seconds."
        icon={<Loader2 className="h-5 w-5 animate-spin text-accent" />}
      />
    );
  }
  if (step.status === "failed") {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/[0.04] p-8">
        <div className="text-xl text-danger">
          {STEP_NAMES[index]} failed
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {step.error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  switch (index) {
    case 0:
      return <PromptSet data={step.result as Step1Result} />;
    case 1:
      return <ShelfSimulation data={step.result as Step2Result} />;
    case 2:
      return <ScoreCard data={step.result as Step3Result} />;
    case 3:
      return <CatalogAudit data={step.result as Step4Result} />;
    case 4:
      return <EnrichedProfile data={step.result as Step5Result} />;
    case 5:
      return <Recommendations data={step.result as Step6Result} />;
    default:
      return null;
  }
}

function PlaceholderPanel({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon ?? <span className="font-mono text-xs text-muted-foreground">···</span>}
      </div>
      <div className="mt-4 text-xl tracking-tight">{title}</div>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}