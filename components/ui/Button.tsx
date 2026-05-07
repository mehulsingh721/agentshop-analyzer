import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-accent-secondary text-accent-foreground shadow-[0_4px_14px_rgb(0_82_255_/_0.25)] hover:shadow-[0_8px_24px_rgb(0_82_255_/_0.35)] hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]",
  outline:
    "border border-border bg-card hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    />
  );
});