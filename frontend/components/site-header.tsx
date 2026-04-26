import Link from "next/link";
import { Atom } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 tracking-tight"
        >
          <Atom className="h-5 w-5" />
          <span className="font-serif text-lg font-medium">Faraday</span>
        </Link>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline">
          AI co-scientist
        </span>
      </div>
    </header>
  );
}
