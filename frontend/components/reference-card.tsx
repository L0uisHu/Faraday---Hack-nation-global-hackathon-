import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reference } from "@/lib/types";

export function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">
            {reference.title}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 uppercase">
            {reference.source}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div>
          {reference.authors} · {reference.year}
        </div>
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          View source <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}
