"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Material } from "@/lib/types";

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface MaterialsTableProps {
  materials: Material[];
  onChange?: (materials: Material[]) => void;
}

export function MaterialsTable({ materials, onChange }: MaterialsTableProps) {
  const [editing, setEditing] = useState(false);
  const canEdit = !!onChange;

  function handleDelete(index: number) {
    onChange?.(materials.filter((_, i) => i !== index));
  }

  function handleAdd() {
    onChange?.([
      ...materials,
      {
        name: "New material",
        supplier: "",
        catalog_number: "",
        cost_usd: 0,
        quantity: "",
        source_url: "",
      },
    ]);
  }

  function handleUpdate(index: number, patch: Partial<Material>) {
    onChange?.(materials.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Resources</CardTitle>
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
      <CardContent className="space-y-4 px-0">
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
                {editing && <th className="px-6 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={`${m.catalog_number}-${i}`} className="border-b last:border-0">
                  {editing ? (
                    <>
                      <td className="px-6 py-2">
                        <Input
                          value={m.name}
                          onChange={(e) => handleUpdate(i, { name: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <Input
                          value={m.supplier}
                          onChange={(e) =>
                            handleUpdate(i, { supplier: e.target.value })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <Input
                          value={m.catalog_number}
                          onChange={(e) =>
                            handleUpdate(i, { catalog_number: e.target.value })
                          }
                          className="h-8 font-mono text-xs"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <Input
                          value={m.quantity}
                          onChange={(e) =>
                            handleUpdate(i, { quantity: e.target.value })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-2 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={m.cost_usd}
                          onChange={(e) =>
                            handleUpdate(i, {
                              cost_usd: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-right tabular-nums"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <Input
                          value={m.source_url ?? ""}
                          onChange={(e) =>
                            handleUpdate(i, { source_url: e.target.value })
                          }
                          className="h-8"
                          placeholder="URL"
                        />
                      </td>
                      <td className="px-6 py-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(i)}
                          aria-label={`Delete ${m.name}`}
                          className="h-6 w-6 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <X className="mx-auto h-3.5 w-3.5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 font-medium">{m.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{m.supplier}</td>
                      <td className="px-6 py-3 font-mono text-xs">{m.catalog_number}</td>
                      <td className="px-6 py-3 text-muted-foreground">{m.quantity}</td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {fmtUSD.format(m.cost_usd)}
                      </td>
                      <td className="px-6 py-3">
                        {m.source_url && (
                          <a
                            href={m.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Open ${m.name} on ${m.supplier}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && (
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
