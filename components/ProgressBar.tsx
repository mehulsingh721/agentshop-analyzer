"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { STEP_NAMES, type StepRecord } from "@/lib/types";
import { durationSeconds, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  steps: StepRecord[];
  status: "pending" | "running" | "completed" | "failed";
};

const TOTAL = STEP_NAMES.length;

export function ProgressBar({ steps, status }: Props) {
  const done = steps.filter((s) => s.status === "done").length;
  const pct = (done / TOTAL) * 100;
  const runningIndex = steps.findIndex((s) => s.status === "running");
  const runningStep = runningIndex >= 0 ? steps[runningIndex] : null;

  // Live elapsed clock for the running step. Ticks every 500ms and only when
  // a step is actually running, so it stops paying cost the moment we settle.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!runningStep?.started_at) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [runningStep?.started_at]);

  const runningElapsedSec = runningStep?.started_at
    ? Math.max(0, (now - new Date(runningStep.started_at).getTime()) / 1000)
    : 0;

  // Total elapsed = sum of completed durations + current live elapsed
  const totalElapsed =
    steps.reduce((sum, s) => {
      const d = durationSeconds(s.started_at, s.completed_at);
      return s.status === "done" && d !== null ? sum + d : sum;
    }, 0) + runningElapsedSec;

  // Total remaining: sum of estimates for not-yet-done steps minus the
  // running step's elapsed. Hidden if any pending step lacks an estimate.
  const remainingSteps = steps.filter(
    (s) => s.status === "pending" || s.status === "running"
  );
  const allRemainingHaveEstimates = remainingSteps.every(
    (s) => typeof s.estimated_seconds === "number"
  );
  const totalRemaining = allRemainingHaveEstimates
    ? Math.max(
        0,
        remainingSteps.reduce(
          (sum, s) => sum + (s.estimated_seconds ?? 0),
          0
        ) - runningElapsedSec
      )
    : null;

  const headline =
    status === "completed"
      ? "Audit complete"
      : status === "failed"
        ? "Audit failed"
        : runningIndex >= 0
          ? `Step ${runningIndex + 1} of ${TOTAL}`
          : "Starting audit";

  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="grid gap-0.5">
          <div className="text-xl tracking-tight">{headline}</div>
          {runningIndex >= 0 && (
            <div className="text-sm text-muted-foreground">
              {STEP_NAMES[runningIndex]}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
            {done}/{TOTAL} · {Math.round(pct)}%
          </div>
          {(status === "running" || status === "pending") && (
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-muted-foreground/80">
              {formatDuration(totalElapsed)} elapsed
              {totalRemaining !== null && totalRemaining > 0 && (
                <>
                  {" · "}
                  <span className="text-accent">
                    ~{formatDuration(totalRemaining)} left
                  </span>
                </>
              )}
            </div>
          )}
          {status === "completed" && totalElapsed > 0 && (
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-muted-foreground/80">
              took {formatDuration(totalElapsed)}
            </div>
          )}
        </div>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          className={cn(
            "h-full rounded-full",
            status === "failed"
              ? "bg-danger"
              : "bg-gradient-to-r from-accent to-accent-secondary"
          )}
        />
      </div>

      <ol className="grid gap-1">
        {STEP_NAMES.map((name, i) => {
          const step = steps[i];
          const stepStatus = step?.status ?? "pending";
          return (
            <li
              key={name}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm",
                stepStatus === "running" && "bg-accent/[0.06]"
              )}
            >
              <StatusGlyph status={stepStatus} index={i + 1} />
              <span className="flex-1 truncate text-foreground">{name}</span>
              <StepTiming
                step={step}
                runningElapsedSec={
                  i === runningIndex ? runningElapsedSec : 0
                }
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepTiming({
  step,
  runningElapsedSec,
}: {
  step: StepRecord | undefined;
  runningElapsedSec: number;
}) {
  if (!step) return null;
  const est = step.estimated_seconds;

  if (step.status === "done") {
    const d = durationSeconds(step.started_at, step.completed_at);
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-success">
        {d !== null ? formatDuration(d) : "done"}
      </span>
    );
  }
  if (step.status === "running") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-accent">
        {formatDuration(runningElapsedSec)}
        {typeof est === "number" && est > 0 && (
          <span className="text-accent/60"> / ~{formatDuration(est)}</span>
        )}
      </span>
    );
  }
  if (step.status === "failed") {
    const d = durationSeconds(step.started_at, step.completed_at);
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-danger">
        failed{d !== null ? ` at ${formatDuration(d)}` : ""}
      </span>
    );
  }
  // pending
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] tabular-nums text-muted-foreground/60">
      {typeof est === "number" && est > 0 ? `est. ~${formatDuration(est)}` : "pending"}
    </span>
  );
}

function StatusGlyph({
  status,
  index,
}: {
  status: StepRecord["status"];
  index: number;
}) {
  if (status === "done") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="relative grid h-6 w-6 place-items-center rounded-full bg-accent/15 text-accent">
        <span className="absolute inset-0 rounded-full bg-accent/30 pulse-dot" />
        <span className="relative font-mono text-[10px] font-medium tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-danger/15 text-danger">
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground/70">
      <span className="font-mono text-[10px] tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
    </span>
  );
}
