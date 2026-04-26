"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQCProgress } from "@/lib/use-qc-progress";

const PLACEHOLDER =
  "e.g. Replacing the SiO₂ substrate with hexagonal boron nitride in CVD-grown graphene FETs will increase carrier mobility at 4 K by ≥30%.";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function ChatboxCard({ value, onChange, onSubmit, submitting }: Props) {
  const ready = value.trim().length > 0 && !submitting;
  const { phase, phaseIndex, totalPhases } = useQCProgress(submitting);

  const statusLabel = submitting
    ? phase.label
    : ready
      ? "Ready"
      : "Awaiting hypothesis";

  return (
    <div className="rounded-xl border bg-background shadow-sm transition focus-within:ring-2 focus-within:ring-ring/30">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={submitting}
        className="block min-h-[180px] w-full resize-y bg-transparent px-5 pt-5 pb-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
      />
      <div className="flex items-center justify-between border-t px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              ready && "bg-emerald-500",
              !ready && !submitting && "bg-muted-foreground/40",
              submitting && "animate-pulse bg-amber-500",
            )}
          />
          <span className="line-clamp-1">{statusLabel}</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!ready}
          aria-label="Generate plan"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div
        className={cn(
          "h-0.5 w-full overflow-hidden",
          submitting ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      >
        <div
          className="h-full bg-emerald-500/70 transition-[width] duration-700 ease-out"
          style={{
            width: submitting
              ? `${((phaseIndex + 1) / totalPhases) * 100}%`
              : "0%",
          }}
        />
      </div>
    </div>
  );
}
