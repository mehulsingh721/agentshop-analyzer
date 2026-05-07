import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
};

export function SectionLabel({ children, pulse, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-accent/[0.06] px-3.5 py-1.5",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-accent",
          pulse && "pulse-dot"
        )}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
        {children}
      </span>
    </div>
  );
}