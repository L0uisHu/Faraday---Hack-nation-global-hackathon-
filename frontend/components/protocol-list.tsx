import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProtocolStep } from "@/lib/types";

export function ProtocolList({ steps }: { steps: ProtocolStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((s) => (
            <li key={s.step} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium tabular-nums">
                {s.step}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-relaxed">{s.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.duration}</span>
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
