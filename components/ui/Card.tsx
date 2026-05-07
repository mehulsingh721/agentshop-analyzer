import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** Add a subtle accent gradient hover overlay. */
  interactive?: boolean;
  /** Render with a 2px gradient stroke (featured cards). */
  featured?: boolean;
};

export function Card({
  className,
  interactive,
  featured,
  children,
  ...rest
}: Props) {
  if (featured) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br from-accent via-accent-secondary to-accent p-[1.5px] shadow-[0_8px_24px_rgb(0_82_255_/_0.18)]",
          className
        )}
      >
        <div
          className={cn(
            "h-full w-full rounded-[calc(1rem-1.5px)] bg-card",
            "p-6"
          )}
          {...rest}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgb(15_23_42_/_0.04),0_8px_24px_-12px_rgb(15_23_42_/_0.08)]",
        interactive &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgb(15_23_42_/_0.05),0_20px_32px_-16px_rgb(15_23_42_/_0.12)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}