import type { LiteratureQC, Plan } from "./types";

// Frontend fallback — fires when NEXT_PUBLIC_API_URL is unreachable. Mirrors
// backend/mocks.py exactly so a backend outage during the demo still renders
// a physics plan, not the old biology one.

export const MOCK_QC: LiteratureQC = {
  status: "similar",
  references: [
    {
      title: "N-jettiness Subtractions for NNLO QCD Calculations",
      authors: "Boughezal R, Focke C, Liu X, Petriello F",
      url: "https://arxiv.org/abs/1504.02131",
      year: 2015,
      source: "arxiv",
    },
    {
      title:
        "NNLO QCD corrections to three-jet production in electron-positron annihilation",
      authors: "Gehrmann-De Ridder A, Gehrmann T, Glover EWN, Heinrich G",
      url: "https://arxiv.org/abs/0710.0346",
      year: 2007,
      source: "arxiv",
    },
  ],
};

export const MOCK_PLAN: Plan = {
  protocol: [
    {
      step: 1,
      description:
        "Set up NNLOJET with the e+e- to 3-jet module. Validate the build by reproducing the published thrust distribution at NNLO at a single Q = M_Z scan point against the Gehrmann-De Ridder et al. 2007 reference (target: agreement within published statistical uncertainty).",
      duration: "2 weeks",
      source_url: "",
    },
    {
      step: 2,
      description:
        "Implement the kT-ness observable (k_T-version of N-jettiness) as a slicing variable inside the NNLOJET subtraction infrastructure. Define the soft and collinear projectors symbolically and code their numerical kernels.",
      duration: "3 weeks",
      source_url: "",
    },
    {
      step: 3,
      description:
        "Derive and code the below-cut SCET expansion for kT-ness up to next-to-leading-power corrections. Cross-check against analytic single-emission limits to confirm IR cancellation.",
      duration: "2 weeks",
      source_url: "",
    },
    {
      step: 4,
      description:
        "Run convergence studies: scan the slicing parameter τ_cut over four decades for thrust, C-parameter, and y_23 distributions. Confirm independence from τ_cut at NNLO within Monte Carlo statistical errors.",
      duration: "4 weeks",
      source_url: "",
    },
    {
      step: 5,
      description:
        "Compare kT-ness-sliced predictions against existing N-jettiness and antenna-subtraction NNLO calculations on the same three benchmark observables. Quantify residual differences and statistical pulls.",
      duration: "1 week",
      source_url: "",
    },
    {
      step: 6,
      description:
        "Write up methodology and results, prepare publication-quality plots, submit to arXiv (hep-ph) and JHEP.",
      duration: "3 weeks",
      source_url: "",
    },
  ],
  materials: [
    {
      name: "NNLOJET (e+e- 3-jet module)",
      supplier: "NNLOJET collaboration (open source)",
      catalog_number: "N/A",
      cost_usd: 0.0,
      quantity: "1 install",
      source_url: "",
    },
    {
      name: "OpenLoops 2",
      supplier: "OpenLoops team (open source)",
      catalog_number: "N/A",
      cost_usd: 0.0,
      quantity: "1 install",
      source_url: "",
    },
    {
      name: "Rivet 3 analysis framework",
      supplier: "Rivet collaboration (open source)",
      catalog_number: "N/A",
      cost_usd: 0.0,
      quantity: "1 install",
      source_url: "",
    },
    {
      name: "LEP archive event-shape data (ALEPH, OPAL)",
      supplier: "HEPData / Durham",
      catalog_number: "N/A",
      cost_usd: 0.0,
      quantity: "Public archive",
      source_url: "",
    },
    {
      name: "HPC compute time",
      supplier: "Local Tier-2 cluster / institutional allocation",
      catalog_number: "N/A",
      cost_usd: 4800.0,
      quantity: "200,000 CPU-hours",
      source_url: "",
    },
    {
      name: "Conference travel and registration (LHCP, SCIDAC)",
      supplier: "Travel office",
      catalog_number: "N/A",
      cost_usd: 3200.0,
      quantity: "2 conferences",
      source_url: "",
    },
  ],
  budget: {
    total_usd: 9500.0,
    breakdown: [
      { category: "HPC compute (200k CPU-hours)", amount_usd: 4800.0 },
      { category: "Conference travel & registration", amount_usd: 3200.0 },
      {
        category: "Software (NNLOJET, OpenLoops, Rivet — open source)",
        amount_usd: 0.0,
      },
      { category: "Open-access publication fees", amount_usd: 700.0 },
      { category: "Contingency (10%)", amount_usd: 800.0 },
    ],
  },
  timeline: {
    total_weeks: 15,
    phases: [
      {
        name: "Reproduction of reference NNLO 3-jet result",
        weeks: [1, 2],
        dependencies: [],
      },
      {
        name: "kT-ness observable implementation",
        weeks: [3, 5],
        dependencies: ["Reproduction of reference NNLO 3-jet result"],
      },
      {
        name: "Below-cut SCET expansion and IR validation",
        weeks: [6, 7],
        dependencies: ["kT-ness observable implementation"],
      },
      {
        name: "Convergence studies and benchmark comparison",
        weeks: [8, 12],
        dependencies: ["Below-cut SCET expansion and IR validation"],
      },
      {
        name: "Write-up and submission",
        weeks: [13, 15],
        dependencies: ["Convergence studies and benchmark comparison"],
      },
    ],
  },
  validation: {
    method:
      "Two-pronged: (1) τ_cut-independence test — kT-ness predictions for thrust, C-parameter, and y_23 must be flat in τ_cut over four decades within Monte Carlo statistical errors. (2) Cross-check against published N-jettiness slicing and antenna-subtraction NNLO predictions on the same observables.",
    success_criteria:
      "All three benchmark observables show <1σ pull vs. published NNLO results across the full kinematic range, residual τ_cut dependence <0.5% of the central value, and χ²/d.o.f. p > 0.05 across the three distributions.",
  },
};
