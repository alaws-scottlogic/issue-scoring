export type Step = "input" | "fetching" | "triage" | "complete";

export interface ScoreEntry {
  ambiguity: string;
  scale: string;
  novelty: string;
  type: string;
  issueNumber?: number;
  title?: string;
  url?: string;
  summary?: string;
}

export const GEMINI_MODEL = "gemini-3.5-flash";

export const ISSUE_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "ci",
  "build",
  "chore",
  "revert",
];

export const TARGET_ISSUE_COUNT = 15;