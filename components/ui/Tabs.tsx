"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type TabItem = {
  id: string;
  label: string;
  /** Short index/eyebrow shown above the label, e.g. "01" */
  eyebrow?: string;
  /** Visual status used to render an indicator next to the label. */
  status?: "pending" | "running" | "done" | "failed";
};

type Props = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  /** Shared layoutId for the animated underline. */
  layoutId?: string;
};

export function Tabs({
  items,
  activeId,
  onChange,
  className,
  layoutId = "tabs-underline",
}: Props) {
  return (
    <div
      className={cn(
        "relative -mx-2 overflow-x-auto px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <div className="flex min-w-max items-stretch gap-1 border-b border-border">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "group relative flex flex-col items-start gap-0.5 px-4 py-3 text-left cursor-pointer transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-md",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.eyebrow && (
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.18em]",
                    isActive ? "text-accent" : "text-muted-foreground/70"
                  )}
                >
                  {item.eyebrow}
                </span>
              )}
              <span className="flex items-center gap-2 text-sm font-medium tracking-tight whitespace-nowrap">
                {item.label}
                {item.status && <StatusDot status={item.status} />}
              </span>
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-accent to-accent-secondary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: NonNullable<TabItem["status"]> }) {
  const map: Record<NonNullable<TabItem["status"]>, string> = {
    pending: "bg-muted-foreground/30",
    running: "bg-accent pulse-dot",
    done: "bg-success",
    failed: "bg-danger",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1.5 w-1.5 rounded-full", map[status])}
    />
  );
}