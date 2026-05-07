"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  auditId: string;
  className?: string;
};

export function ShareLink({ auditId, className }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/?id=${auditId}`);
  }, [auditId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Non-secure context or clipboard blocked — let the user manually copy.
      inputRef.current?.select();
    }
  };

  return (
    <div
      className={cn(
        "flex items-stretch gap-1.5 rounded-xl border border-border bg-card p-1 pl-3",
        className
      )}
    >
      <LinkIcon
        className="my-auto h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate bg-transparent px-1 font-mono text-xs text-foreground/80 outline-none"
        aria-label="Shareable audit URL"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="shrink-0 px-3"
        aria-label={copied ? "Link copied" : "Copy link"}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}
