import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Validation } from "@/lib/types";

export function ValidationCard({ validation }: { validation: Validation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Method
          </div>
          <p className="mt-1 leading-relaxed">{validation.method}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Success criteria
          </div>
          <p className="mt-1 leading-relaxed">{validation.success_criteria}</p>
        </div>
      </CardContent>
    </Card>
  );
}
