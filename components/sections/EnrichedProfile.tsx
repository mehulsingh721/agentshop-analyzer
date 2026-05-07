"use client";
import { Check, X } from "lucide-react";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import type { Step5Result } from "@/lib/types";

export function EnrichedProfile({ data }: { data: Step5Result }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <SectionLabel>Enriched profile</SectionLabel>
        <h3 className="text-2xl tracking-tight">
          Structured fields an AI assistant can rely on
        </h3>
      </div>

      <Card featured className="p-0">
        <div className="grid gap-1 p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            {data.category}
          </div>
          <div className="text-3xl tracking-tight">
            {data.product_name}
          </div>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {data.ai_safe_description}
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <ListCard
          title="Primary benefits"
          icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
          tone="accent"
          items={data.primary_benefits}
        />
        <ListCard
          title="Best for"
          icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
          tone="success"
          items={data.best_for}
        />
        <ListCard
          title="Not best for"
          icon={<X className="h-3.5 w-3.5" strokeWidth={2.5} />}
          tone="danger"
          items={data.not_best_for}
        />
        <ListCard
          title="Comparison claims"
          icon={<span className="text-[10px] font-bold">vs</span>}
          tone="muted"
          items={data.comparison_claims}
        />
      </div>

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Raw JSON
        </summary>
        <pre className="mt-3 overflow-auto text-xs leading-relaxed text-foreground/80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

const TONE: Record<string, { bg: string; fg: string }> = {
  accent: { bg: "bg-accent/10", fg: "text-accent" },
  success: { bg: "bg-success/15", fg: "text-success" },
  danger: { bg: "bg-danger/15", fg: "text-danger" },
  muted: { bg: "bg-muted", fg: "text-muted-foreground" },
};

function ListCard({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  tone: keyof typeof TONE;
  items: string[];
}) {
  const t = TONE[tone];
  return (
    <Card className="p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </div>
      {items.length ? (
        <ul className="grid gap-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span
                className={`mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full ${t.bg} ${t.fg}`}
              >
                {icon}
              </span>
              <span className="leading-snug">{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      )}
    </Card>
  );
}
