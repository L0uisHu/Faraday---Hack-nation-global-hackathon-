import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Material } from "@/lib/types";

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function MaterialsTable({ materials }: { materials: Material[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-2 font-medium">Name</th>
                <th className="px-6 py-2 font-medium">Supplier</th>
                <th className="px-6 py-2 font-medium">Catalog #</th>
                <th className="px-6 py-2 font-medium">Qty</th>
                <th className="px-6 py-2 font-medium text-right">Cost</th>
                <th className="px-6 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={`${m.catalog_number}-${i}`} className="border-b last:border-0">
                  <td className="px-6 py-3 font-medium">{m.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{m.supplier}</td>
                  <td className="px-6 py-3 font-mono text-xs">{m.catalog_number}</td>
                  <td className="px-6 py-3 text-muted-foreground">{m.quantity}</td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {fmtUSD.format(m.cost_usd)}
                  </td>
                  <td className="px-6 py-3">
                    <a
                      href={m.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Open ${m.name} on ${m.supplier}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
