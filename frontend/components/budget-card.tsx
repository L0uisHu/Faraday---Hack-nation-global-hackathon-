import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget</CardTitle>
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
              <span className="flex-1">{b.category}</span>
              <span className="tabular-nums text-muted-foreground">
                {fmtUSD.format(b.amount_usd)}
              </span>
              {onChange && (
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  aria-label={`Delete ${b.category}`}
                  className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="mx-auto h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {onChange && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add line
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
