import { useState } from "react";
import { Check, ExternalLink, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Resource } from "@/lib/types";

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const cellInputCls =
  "w-full bg-secondary/60 rounded-sm px-1 outline-none focus:ring-1 focus:ring-ring";

interface ResourcesTableProps {
  resources: Resource[];
  onChange?: (resources: Resource[]) => void;
}

export function ResourcesTable({ resources, onChange }: ResourcesTableProps) {
  const editable = !!onChange;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleDelete(index: number) {
    onChange?.(resources.filter((_, i) => i !== index));
    setEditingIndex(null);
  }

  function handleAdd() {
    const next = [
      ...resources,
      {
        name: "",
        supplier: "",
        cost_usd: 0,
        quantity: "",
        source_url: "",
      },
    ];
    onChange?.(next);
    setEditingIndex(next.length - 1);
  }

  function patchItem(index: number, patch: Partial<Resource>) {
    if (!onChange) return;
    onChange(resources.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-2 font-medium">Name</th>
                <th className="px-6 py-2 font-medium">Supplier</th>
                <th className="px-6 py-2 font-medium">Qty</th>
                <th className="px-6 py-2 font-medium text-right">Cost</th>
                <th className="px-6 py-2 font-medium" />
                {editable && <th className="px-6 py-2 font-medium" />}
                {editable && <th className="px-6 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {resources.map((m, i) => {
                const isEditing = editingIndex === i;
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-6 py-3 font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => patchItem(i, { name: e.target.value })}
                          placeholder="Name"
                          aria-label={`Resource ${i + 1} name`}
                          autoFocus
                          className={cellInputCls}
                        />
                      ) : (
                        m.name
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {isEditing ? (
                        <input
                          type="text"
                          value={m.supplier}
                          onChange={(e) =>
                            patchItem(i, { supplier: e.target.value })
                          }
                          placeholder="Supplier"
                          aria-label={`Resource ${i + 1} supplier`}
                          className={cellInputCls}
                        />
                      ) : (
                        m.supplier
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {isEditing ? (
                        <input
                          type="text"
                          value={m.quantity}
                          onChange={(e) =>
                            patchItem(i, { quantity: e.target.value })
                          }
                          placeholder="Qty"
                          aria-label={`Resource ${i + 1} quantity`}
                          className={cellInputCls}
                        />
                      ) : (
                        m.quantity
                      )}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={Number.isFinite(m.cost_usd) ? m.cost_usd : 0}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            patchItem(i, {
                              cost_usd: Number.isFinite(v) ? v : 0,
                            });
                          }}
                          aria-label={`Resource ${i + 1} cost in USD`}
                          className={`text-right tabular-nums ${cellInputCls}`}
                        />
                      ) : (
                        fmtUSD.format(m.cost_usd)
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <input
                          type="url"
                          value={m.source_url}
                          onChange={(e) =>
                            patchItem(i, { source_url: e.target.value })
                          }
                          placeholder="https://…"
                          aria-label={`Resource ${i + 1} source URL`}
                          className={`text-xs ${cellInputCls}`}
                        />
                      ) : (
                        m.source_url && (
                          <a
                            href={m.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Open ${m.name} on ${m.supplier}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )
                      )}
                    </td>
                    {editable && (
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(isEditing ? null : i)}
                          aria-label={
                            isEditing
                              ? `Done editing resource ${i + 1}`
                              : `Edit resource ${i + 1}`
                          }
                          className="h-6 w-6 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          {isEditing ? (
                            <Check className="mx-auto h-3.5 w-3.5" />
                          ) : (
                            <Pencil className="mx-auto h-3 w-3" />
                          )}
                        </button>
                      </td>
                    )}
                    {editable && (
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(i)}
                          aria-label={`Delete resource ${i + 1}`}
                          className="h-6 w-6 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <X className="mx-auto h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {editable && (
          <div className="px-6">
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add resource
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
