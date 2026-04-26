import { ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProtocolStep } from "@/lib/types";

interface ProtocolListProps {
  steps: ProtocolStep[];
  onChange?: (steps: ProtocolStep[]) => void;
}

export function ProtocolList({ steps, onChange }: ProtocolListProps) {
  function handleDelete(index: number) {
    const next = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step: i + 1 }));
    onChange?.(next);
  }

  function handleAdd() {
    onChange?.([
      ...steps,
      {
        step: steps.length + 1,
        description: "New step",
        duration: "",
        source_url: "",
      },
    ]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={`${s.step}-${i}`} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium tabular-nums">
                {s.step}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-relaxed">{s.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.duration}</span>
                  {s.source_url && (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                    >
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              {onChange && (
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  aria-label={`Delete step ${s.step}`}
                  className="h-6 w-6 shrink-0 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="mx-auto h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ol>
        {onChange && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add step
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
