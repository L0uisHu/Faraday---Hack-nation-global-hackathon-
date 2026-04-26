"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetCard } from "@/components/budget-card";
import { MaterialsTable } from "@/components/materials-table";
import { ProtocolList } from "@/components/protocol-list";
import { TimelineCard } from "@/components/timeline-card";
import { ValidationCard } from "@/components/validation-card";
import { loadHypothesis, loadPlan } from "@/lib/session";
import type { Plan } from "@/lib/types";

export default function PlanPage() {
  const [hypothesis, setHypothesis] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    setHypothesis(loadHypothesis() ?? "");
    setPlan(loadPlan());
  }, []);

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Experiment Plan</h1>
        {hypothesis && (
          <p className="text-sm text-muted-foreground">{hypothesis}</p>
        )}
      </div>

      <ProtocolList steps={plan.protocol} />
      <MaterialsTable materials={plan.materials} />
      <BudgetCard budget={plan.budget} />
      <TimelineCard timeline={plan.timeline} />
      <ValidationCard validation={plan.validation} />
    </div>
  );
}
