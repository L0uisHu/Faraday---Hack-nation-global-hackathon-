"use client";

import { useEffect, useRef, useState } from "react";
import { QC_PHASES } from "./qc-phases";

// ms each phase shows before advancing. Total ~9s.
// When real SSE arrives, replace the timer driver below with EventSource;
// the return shape is the contract.
const PHASE_TIMINGS_MS = [600, 4500, 2500, 1500] as const;

export function useQCProgress(active: boolean) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      setPhaseIndex(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    setPhaseIndex(0);
    let i = 0;

    function advance() {
      i += 1;
      if (i >= QC_PHASES.length) return;
      setPhaseIndex(i);
      timerRef.current = setTimeout(advance, PHASE_TIMINGS_MS[i]);
    }

    timerRef.current = setTimeout(advance, PHASE_TIMINGS_MS[0]);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  return {
    phase: QC_PHASES[phaseIndex],
    phaseIndex,
    totalPhases: QC_PHASES.length,
  };
}
