"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatboxCard } from "@/components/chatbox-card";
import { HeroStats } from "@/components/hero-stats";
import { RoadmapStepper } from "@/components/roadmap-stepper";
import { fetchQC } from "@/lib/api";
import { saveHypothesis, saveQC } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const [hypothesis, setHypothesis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const trimmed = hypothesis.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    saveHypothesis(trimmed);
    const qc = await fetchQC(trimmed);
    saveQC(qc);
    router.push("/qc");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12 py-16">
      <section className="space-y-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          AI co-scientist · grounded in primary literature
        </p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
          Every citation real.
          <br />
          Every protocol defensible.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Faraday turns a hypothesis into a literature-checked experimental
          plan. You stay the scientist. We handle the prep work.
        </p>
      </section>

      <ChatboxCard
        value={hypothesis}
        onChange={setHypothesis}
        onSubmit={onSubmit}
        submitting={submitting}
      />

      <RoadmapStepper />

      <HeroStats />
    </div>
  );
}
