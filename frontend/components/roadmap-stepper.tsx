const STEPS = ["Search", "Protocol", "Resources", "Budget", "Timeline"] as const;

export function RoadmapStepper() {
  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label="What Faraday produces"
    >
      {STEPS.map((step) => (
        <li key={step}>
          <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {step}
          </span>
        </li>
      ))}
    </ul>
  );
}
