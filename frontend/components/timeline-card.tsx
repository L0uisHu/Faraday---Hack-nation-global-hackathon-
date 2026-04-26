import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Timeline } from "@/lib/types";

export function TimelineCard({ timeline }: { timeline: Timeline }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          {timeline.total_weeks} weeks total
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {timeline.phases.map((p, i) => (
            <li key={`${p.name}-${i}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{p.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {p.weeks[0] === p.weeks[1]
                    ? `Week ${p.weeks[0]}`
                    : `Week ${p.weeks[0]}–${p.weeks[1]}`}
                </span>
              </div>
              {p.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.dependencies.map((d, j) => (
                    <Badge
                      key={`${d}-${j}`}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      depends on: {d}
                    </Badge>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
