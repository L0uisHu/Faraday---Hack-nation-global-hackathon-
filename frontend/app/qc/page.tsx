"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferenceCard } from "@/components/reference-card";
import { StatusBadge } from "@/components/status-badge";
import { fetchPlan } from "@/lib/api";
import { loadHypothesis, loadQC, savePlan } from "@/lib/session";
import type { LiteratureQC } from "@/lib/types";

export default function QCPage() {
  const router = useRouter();
  const [hypothesis, setHypothesis] = useState("");
  const [qc, setQC] = useState<LiteratureQC | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setHypothesis(loadHypothesis() ?? "");
    setQC(loadQC());
  }, []);

  async function onGenerate() {
    if (!hypothesis || submitting) return;
    setSubmitting(true);
    try {
      const plan = await fetchPlan(hypothesis);
      savePlan(plan);
      router.push("/plan");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate plan.";
      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Literature QC</h1>
        {hypothesis && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {hypothesis}
          </p>
        )}
      </div>

      {!qc ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <StatusBadge status={qc.status} />
          <div className="space-y-3">
            {qc.references.map((r, i) => (
              <ReferenceCard key={`${r.url}-${i}`} reference={r} />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={onGenerate} disabled={submitting} size="lg">
              {submitting ? "Generating plan…" : "Generate Plan"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
