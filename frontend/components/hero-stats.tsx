const STATS = [
  { value: "0", label: "hallucinated citations" },
  { value: "2.6M+", label: "arXiv papers indexed" },
  { value: "100%", label: "citations link-resolved before output" },
] as const;

export function HeroStats() {
  return (
    <dl className="grid grid-cols-1 gap-6 border-y py-6 sm:grid-cols-3">
      {STATS.map((s) => (
        <div key={s.value} className="space-y-1">
          <dt className="font-serif text-3xl tracking-tight">{s.value}</dt>
          <dd className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {s.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}
