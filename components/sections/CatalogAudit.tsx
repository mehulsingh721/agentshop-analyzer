"use client";
import { ExternalLink } from "lucide-react";
import { Card } from "../ui/Card";
import { SectionLabel } from "../ui/SectionLabel";
import type { AuditFieldQuality, Step4Result } from "@/lib/types";
import { cn } from "@/lib/cn";

const PRESENT_TONE: Record<string, string> = {
  yes: "bg-success/15 text-success",
  partial: "bg-amber-500/15 text-amber-700",
  no: "bg-danger/15 text-danger",
};

const QUALITY_BARS: Record<AuditFieldQuality, number> = {
  high: 4,
  medium: 3,
  low: 2,
  none: 0,
};

const QUALITY_TONE: Record<AuditFieldQuality, string> = {
  high: "bg-success",
  medium: "bg-amber-500",
  low: "bg-orange-500",
  none: "bg-danger",
};

export function CatalogAudit({ data }: { data: Step4Result }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <SectionLabel>Catalog readiness</SectionLabel>
        <h3 className="text-2xl tracking-tight">
          What an AI assistant can extract from this site
        </h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {data.overall_summary}
        </p>
        <a
          href={data.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          {data.source_url}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="grid gap-2">
        {data.fields.map((f, i) => (
          <Card key={i} className="p-4" interactive>
            <div className="flex items-start gap-4">
              <div className="flex-1 grid gap-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-medium tracking-tight">{f.field}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                      PRESENT_TONE[f.present]
                    )}
                  >
                    {f.present}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{f.notes}</p>
              </div>
              <div className="grid w-24 shrink-0 gap-1.5 text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Quality
                </div>
                <div className="flex justify-end gap-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className={cn(
                        "h-3 w-1.5 rounded-sm",
                        bar <= QUALITY_BARS[f.quality]
                          ? QUALITY_TONE[f.quality]
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <div className="text-[10px] capitalize text-muted-foreground">
                  {f.quality}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
