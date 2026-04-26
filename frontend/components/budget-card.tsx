import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Budget } from "@/lib/types";

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function BudgetCard({ budget }: { budget: Budget }) {
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
            <li key={`${b.category}-${i}`} className="flex items-center justify-between text-sm">
              <span>{b.category}</span>
              <span className="tabular-nums text-muted-foreground">
                {fmtUSD.format(b.amount_usd)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
