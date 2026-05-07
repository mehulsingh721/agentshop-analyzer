"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Audit" },
  { href: "/validator", label: "Validator" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-gradient-to-br from-accent to-accent-secondary shadow-[0_0_0_3px_rgb(0_82_255_/_0.12)] transition-transform group-hover:scale-110"
          />
          <span>agentShop</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Treat any subpath as active (e.g. /validator/anything still highlights Validator).
  const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-3 -bottom-[5px] h-[1.5px] rounded-full bg-gradient-to-r from-accent to-accent-secondary"
        />
      )}
    </Link>
  );
}
