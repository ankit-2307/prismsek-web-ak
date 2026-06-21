// Single source of truth for the 5 chapters of the PrismSek film reel.
//
// PrismSek is an AI-native Data Loss Prevention (DLP) product. The narrative
// uses the prism metaphor: PrismSek refracts your data streams to reveal the
// sensitive information hidden inside them, then converges every detection into
// automated action.
//
// Product copy/stats below are ORIGINAL to PrismSek. They are styled after the
// kind of information a data-security site (e.g. nightfall.ai) surfaces —
// detection types, integrations, accuracy metrics, compliance — but are not
// copied from any source. Figures are illustrative placeholders.

export interface Stat {
  value: string;
  label: string;
}

export interface Chapter {
  id: string;
  index: number;
  /** Short eyebrow / section label, e.g. "AI-Native Detection". */
  kicker: string;
  name: string;
  title: string;
  subtitle: string;
  /** Optional bullet features shown in the overlay. */
  features?: string[];
  /** Optional headline metrics. */
  stats?: Stat[];
  /** Optional chip row (detection types, integrations, compliance). */
  chipsLabel?: string;
  chips?: string[];
  /** CSS background color for this chapter's mood. */
  bg: string;
  /** CSS foreground (text) color. */
  fg: string;
  /** Accent color (hex string), shared with the 3D scene. */
  accent: string;
  /** Base oscillator frequency (Hz) for the ambient tone. */
  freq: number;
}

export const CHAPTERS: Chapter[] = [
  {
    id: "genesis",
    index: 0,
    kicker: "The Blind Spot",
    name: "Genesis",
    title: "Your most sensitive data is already in motion.",
    subtitle:
      "Secrets, PII, and source code move through SaaS, GenAI, and endpoints every second — faster than legacy tools can even see.",
    stats: [
      { value: "1 in 5", label: "AI prompts carry sensitive data" },
      { value: "83%", label: "of orgs can't see how GenAI is used" },
    ],
    bg: "#06060f",
    fg: "#c7c8ea",
    accent: "#7c6cff",
    freq: 110.0, // A2
  },
  {
    id: "refraction",
    index: 1,
    kicker: "AI-Native Detection",
    name: "Refraction",
    title: "One stream, refracted into clarity.",
    subtitle:
      "PrismSek's AI reads every data flow in context — classifying what's sensitive in real time, where regex and keywords fall short.",
    chipsLabel: "Detects",
    chips: [
      "PII",
      "PHI",
      "PCI",
      "API Keys & Secrets",
      "Source Code",
      "Financial Records",
    ],
    stats: [
      { value: "99.2%", label: "detection precision" },
      { value: "~180ms", label: "p95 inference latency" },
      { value: "70%", label: "fewer false positives" },
    ],
    bg: "#050a1d",
    fg: "#cfeaf6",
    accent: "#29d4ef",
    freq: 146.83, // D3
  },
  {
    id: "spectrum",
    index: 2,
    kicker: "Full-Spectrum Coverage",
    name: "Spectrum",
    title: "Every surface your data touches.",
    subtitle:
      "GenAI prompts, SaaS apps, email, and endpoints — PrismSek watches the full spectrum of where data travels, in one platform.",
    chipsLabel: "Integrates with",
    chips: [
      "ChatGPT",
      "Copilot",
      "Slack",
      "Google Drive",
      "GitHub",
      "Microsoft 365",
      "Jira",
      "Salesforce",
      "Notion",
      "Zendesk",
    ],
    stats: [
      { value: "100B+", label: "data elements scanned monthly" },
      { value: "50+", label: "native integrations" },
    ],
    bg: "#04120f",
    fg: "#cdf0e7",
    accent: "#2fd8b6",
    freq: 164.81, // E3
  },
  {
    id: "convergence",
    index: 3,
    kicker: "Automated Response",
    name: "Convergence",
    title: "Scatter resolves into control.",
    subtitle:
      "Every detection becomes instant, consistent action — no ticket queues, no manual triage, no waiting on a human.",
    features: [
      "Real-time redaction & masking",
      "Policy-driven automated workflows",
      "Inline user coaching & alerts",
      "Audit-ready reporting",
    ],
    stats: [
      { value: "90%", label: "of incidents auto-remediated" },
      { value: "<5 min", label: "mean time to respond" },
    ],
    bg: "#130c04",
    fg: "#f5e7d0",
    accent: "#ffb224",
    freq: 220.0, // A3
  },
  {
    id: "horizon",
    index: 4,
    kicker: "PrismSek",
    name: "Horizon",
    title: "Clarity, refracted into security.",
    subtitle: "AI-native data loss prevention, built for the GenAI era.",
    chipsLabel: "Compliant with",
    chips: ["SOC 2 Type II", "GDPR", "HIPAA", "ISO 27001"],
    bg: "#170b11",
    fg: "#fde9ef",
    accent: "#ff6f91",
    freq: 246.94, // B3
  },
];

export const CHAPTER_COUNT = CHAPTERS.length;
