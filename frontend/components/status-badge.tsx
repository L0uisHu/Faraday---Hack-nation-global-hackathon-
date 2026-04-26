import { Badge } from "@/components/ui/badge";
import type { QCStatus } from "@/lib/types";

const VARIANT: Record<QCStatus, { label: string; className: string }> = {
  novel: {
    label: "Novel",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
  },
  similar: {
    label: "Similar work exists",
    className: "bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200",
  },
  exact_match: {
    label: "Exact match found",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200",
  },
};

export function StatusBadge({ status }: { status: QCStatus }) {
  const v = VARIANT[status];
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
  );
}
