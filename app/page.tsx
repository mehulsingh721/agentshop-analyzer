"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuditStore } from "@/lib/store";
import { AuditForm } from "@/components/AuditForm";
import { ProgressBar } from "@/components/ProgressBar";
import { ReportView } from "@/components/ReportView";
import { ShareLink } from "@/components/ShareLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Audit, AuditInput } from "@/lib/types";

// Change this to audit a different brand. Competitors are an array of brand names.
const DEFAULT_INPUT: AuditInput = {
  brand_name: "Jolie",
  brand_url: "https://jolieskinco.com",
  category: "filtered showerheads",
  competitors: ["Canopy", "Hello Klean", "Aquasana", "Sprite Showers"],
};

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const { audit, starting, error, startAudit, resumePolling, stopPolling, reset } =
    useAuditStore();

  // True when this page was opened with ?id=... in the URL — i.e. the user
  // arrived via a shared link, not by running their own audit.
  const [viewerMode, setViewerMode] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      setViewerMode(true);
      resumePolling(id);
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect audit id in URL for shareable / refresh-resumable runs.
  useEffect(() => {
    if (!audit?.id) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("id") !== audit.id) {
      url.searchParams.set("id", audit.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [audit?.id]);

  const running =
    starting ||
    (audit && (audit.status === "pending" || audit.status === "running"));

  const hasResults = audit?.steps?.some((s) => s.status === "done");

  return (
    <main className="relative">
      {/* ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-accent-secondary/10 blur-[120px]" />
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <Hero viewerMode={viewerMode} audit={audit} />

        {!viewerMode && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card/80 p-6 shadow-[0_1px_3px_rgb(15_23_42_/_0.04),0_24px_60px_-30px_rgb(15_23_42_/_0.18)] backdrop-blur sm:p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionLabel>Configure</SectionLabel>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                one audit per brand
              </span>
            </div>
            <AuditForm
              initial={DEFAULT_INPUT}
              disabled={!!running}
              onSubmit={(input) => {
                reset();
                startAudit(input);
              }}
            />
            {error && (
              <p className="mt-3 text-sm text-danger">{error}</p>
            )}
          </motion.section>
        )}

        {audit && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="rounded-3xl border border-border bg-card p-6 sm:p-8"
          >
            <ProgressBar steps={audit.steps} status={audit.status} />
            {audit.status === "failed" && audit.error && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger">
                {audit.error}
              </p>
            )}
          </motion.section>
        )}

        {audit && hasResults && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.05 }}
            className="grid gap-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-2">
                <SectionLabel pulse>Audit report</SectionLabel>
                <h2 className="text-3xl tracking-tight sm:text-4xl">
                  {audit.brand_name}{" "}
                  <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
                    on the AI shelf
                  </span>
                </h2>
              </div>
              <ShareLink
                auditId={audit.id}
                className="w-full sm:w-[22rem]"
              />
            </div>
            <ReportView audit={audit} />
          </motion.section>
        )}

        <Footer />
      </div>
    </main>
  );
}

function Hero({
  viewerMode,
  audit,
}: {
  viewerMode: boolean;
  audit: Audit | null;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="grid gap-5"
    >
      <div className="flex items-center gap-3">
        <SectionLabel pulse>
          {viewerMode ? "Shared report" : "Onboarding"}
        </SectionLabel>
      </div>
      <h1 className="text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem]">
        AI Product Shelf{" "}
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
            Audit
          </span>
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-2 w-full rounded-sm bg-gradient-to-r from-accent/15 to-accent-secondary/10 sm:-bottom-1.5 sm:h-2.5"
          />
        </span>
      </h1>
      {viewerMode ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-muted-foreground">
          <span>
            You&apos;re viewing a shared audit
            {audit?.brand_name ? (
              <>
                {" "}for{" "}
                <span className="font-medium text-foreground">
                  {audit.brand_name}
                </span>
              </>
            ) : null}
            {audit?.category ? (
              <span className="text-muted-foreground/80">
                {" "}· {audit.category}
              </span>
            ) : null}
            .
          </span>
          <a
            href="/"
            className="group inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Run your own audit
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      ) : (
        <>
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Generate realistic AI shopping prompts, simulate how an assistant
            would answer them, score the brand&apos;s recommendation footprint,
            audit catalog AI-readiness, and produce concrete next steps — in a
            single background pipeline.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Just want to score a single product page?
            </span>
            <a
              href="/validator"
              className="group inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              Try the validator
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </>
      )}
    </motion.header>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-border pt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      Powered by Claude · Firecrawl · Supabase
    </footer>
  );
}
