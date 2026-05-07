"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AuditInput } from "@/lib/types";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  initial: AuditInput;
  disabled?: boolean;
  onSubmit: (input: AuditInput) => void;
};

const inputCls = cn(
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm",
  "placeholder:text-muted-foreground/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "transition-shadow"
);

export function AuditForm({ initial, disabled, onSubmit }: Props) {
  const [brand_name, setBrand] = useState(initial.brand_name);
  const [brand_url, setUrl] = useState(initial.brand_url);
  const [category, setCategory] = useState(initial.category);
  const [competitors, setCompetitors] = useState(initial.competitors.join(", "));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          brand_name: brand_name.trim(),
          brand_url: brand_url.trim(),
          category: category.trim(),
          competitors: competitors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Brand name">
        <input
          className={inputCls}
          value={brand_name}
          onChange={(e) => setBrand(e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
      <Field label="Brand URL">
        <input
          className={inputCls}
          value={brand_url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          type="url"
          required
        />
      </Field>
      <Field label="Category">
        <input
          className={inputCls}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
      <Field label="Competitors" hint="comma-separated">
        <input
          className={inputCls}
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          disabled={disabled}
        />
      </Field>
      <div className="sm:col-span-2 flex justify-end pt-1">
        <Button type="submit" disabled={disabled} size="lg">
          {disabled ? "Running audit..." : "Run audit"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {hint && (
          <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}