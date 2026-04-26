"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Budget, BudgetItem } from "@/lib/types";

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface BudgetCardProps {
  budget: Budget;
  onChange?: (budget: Budget) => void;
}

function recompute(breakdown: BudgetItem[]): Budget {
  return {
    breakdown,
    total_usd: breakdown.reduce((sum, b) => sum + (b.amount_usd ?? 0), 0),
  };
}

export function BudgetCard({ budget, onChange }: BudgetCardProps) {
  const [editing, setEditing] = useState(false);
  const canEdit = !!onChange;

  function handleDelete(index: number) {
    onChange?.(recompute(budget.breakdown.filter((_, i) => i !== index)));
  }

  function handleAdd() {
    onChange?.(
      recompute([
        ...budget.breakdown,
        { category: "New category", amount_usd: 0 },
      ]),
    );
  }

  function handleUpdate(index: number, patch: Partial<BudgetItem>) {
    onChange?.(
      recompute(
        budget.breakdown.map((b, i) => (i === index ? { ...b, ...patch } : b)),
      ),
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Budget</CardTitle>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              "Done"
            ) : (
              <>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total estimated cost</span>
          <span className="text-2xl font-semibold tabular-nums">
            {fmtUSD.format(budget.total_usd)}
          </span>
        </div>
        <Separator />
        <ul className="space-y-2">
          {budget.breakdown.map((b, i) => (
            <li
              key={`${b.category}-${i}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              {editing ? (
                <>
                  <Input
                    value={b.category}
                    onChange={(e) =>
                      handleUpdate(i, { category: e.target.value })
                    }
                    className="h-8 flex-1"
                  />
                  <Input
                    type="number"
                    step="1"
                    value={b.amount_usd}
                    onChange={(e) =>
                      handleUpdate(i, {
                        amount_usd: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 w-32 text-right tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(i)}
                    aria-label={`Delete ${b.category}`}
                    className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="mx-auto h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{b.category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmtUSD.format(b.amount_usd)}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        {editing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add line
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
