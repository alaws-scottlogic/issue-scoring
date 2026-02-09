import React, { useState, useEffect } from "react";
import {
  Send,
  Download,
  Github,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

// --- API & CONFIGURATION ---

const GEMINI_MODEL = "gemini-2.0-flash";

const ISSUE_TYPES = [
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

// Number of fully scored issues required to complete a session
const TARGET_ISSUE_COUNT = 15;

interface ScoreEntry {
  ambiguity: string;
  scale: string;
  novelty: string;
  type: string;
  issueNumber?: number;
  title?: string;
  url?: string;
}

// --- HELPER FUNCTIONS ---

// Parse Owner/Repo from URL
const parseRepoUrl = (url: string) => {
  try {
    const cleanUrl = url.replace(/\/$/, ""); // Remove trailing slash
    const parts = cleanUrl.split("/");
    if (parts.length < 2) return null;
    const repo = parts.pop();
    const owner = parts.pop();
    return { owner, repo };
  } catch (e) {
    return null;
  }
};

// Check if a score entry is fully scored (values 1-5, no x)
const isValidScore = (scoreEntry: ScoreEntry) => {
  const validValues = ["1", "2", "3", "4", "5"];
  return (
    validValues.includes(scoreEntry.ambiguity) &&
    validValues.includes(scoreEntry.scale) &&
    validValues.includes(scoreEntry.novelty)
  );
};

// Safe fetch with exponential backoff for Gemini
const fetchGeminiSummary = async (textToSummarize: string, key: string) => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Summarize the following GitHub issue thread (Title, Body, and Comments) into a single, dense paragraph that captures the core problem, proposed solutions, and current status. Do not use bullet points. \n\n${textToSummarize}`,
          },
        ],
      },
    ],
  };

  let retries = 0;
  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  while (retries <= maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

      const data = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Could not generate summary."
      );
    } catch (error) {
      if (retries === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delays[retries]));
      retries++;
    }
  }
};

// --- COMPONENTS ---

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  className?: string;
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    danger:
      "bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Modal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2"> {title} </h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {" "}
          {message}{" "}
        </p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            {" "}
            Cancel{" "}
          </Button>
          <Button onClick={onConfirm} variant="primary" className="flex-1">
            {" "}
            {confirmText}{" "}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RatingInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => {
  const options = ["x", "1", "2", "3", "4", "5"];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {" "}
        {label}{" "}
      </label>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 h-10 rounded-md text-sm font-bold transition-all ${
              value === opt
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

const TypeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {" "}
      Classification{" "}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right 0.5rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.5em 1.5em`,
        paddingRight: `2.5rem`,
      }}
    >
      <option value="" disabled className="text-slate-500">
        {" "}
        Select Type...
      </option>
      {ISSUE_TYPES.map((t) => (
        <option key={t} value={t}>
          {" "}
          {t}{" "}
        </option>
      ))}
    </select>
  </div>
);

export default function App() {
  // --- STATE ---
  const [step, setStep] = useState<
    "input" | "fetching" | "triage" | "complete"
  >("input");
  const [repoUrl, setRepoUrl] = useState(
    () => localStorage.getItem("triage_repo_url") || "",
  );
  const [ghToken, setGhToken] = useState(
    () => localStorage.getItem("triage_gh_token") || "",
  ); // Optional PAT for rate limits
  const [geminiKey, setGeminiKey] = useState(
    () => localStorage.getItem("triage_gemini_key") || "",
  ); // Gemini API Key

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem("triage_repo_url", repoUrl);
    localStorage.setItem("triage_gh_token", ghToken);
    localStorage.setItem("triage_gemini_key", geminiKey);
  }, [repoUrl, ghToken, geminiKey]);

  const [issues, setIssues] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSummary, setCurrentSummary] = useState("");

  // Loading States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCheckingPr, setIsCheckingPr] = useState(false);

  // Modal States
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<number, ScoreEntry>>({}); // Map of issueId -> { ambiguity, scale, novelty }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current Rating State
  const [currentRating, setCurrentRating] = useState<ScoreEntry>({
    ambiguity: "",
    scale: "",
    novelty: "",
    type: "",
  });

  // --- ACTIONS ---

  const handleFetchIssues = async () => {
    setError(null);
    setLoading(true);

    const repoData = parseRepoUrl(repoUrl);
    if (!repoData) {
      setError(
        "Invalid GitHub URL. Please use format: https://github.com/owner/repo",
      );
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
      };
      if (ghToken) headers["Authorization"] = `token ${ghToken}`;

      // Use Search API to filter by is:issue and -linked:pr (excludes issues with formally linked PRs)
      const query = `repo:${repoData.owner}/${repoData.repo} is:issue is:open -linked:pr`;
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=asc&per_page=100`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 403)
          throw new Error(
            "GitHub API Rate Limit exceeded. Please provide a Token.",
          );
        if (response.status === 404) throw new Error("Repository not found.");
        if (response.status === 422)
          throw new Error("Validation Failed. Please check the URL.");
        throw new Error(`GitHub API Error: ${response.status}`);
      }

      const data = await response.json();
      const pureIssues = data.items || [];

      if (pureIssues.length === 0) {
        throw new Error(
          "No open issues (without linked PRs) found in this repository.",
        );
      }

      setIssues(pureIssues);
      setStep("triage");
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check for OPEN PRs referencing this issue
  const checkForOpenPRs = async (issue: any) => {
    try {
      // Timeline API often contains cross-reference events
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
      };
      if (ghToken) headers["Authorization"] = `token ${ghToken}`;

      const response = await fetch(`${issue.url}/timeline`, { headers });
      if (!response.ok) return false; // Fail safe

      const events = await response.json();

      // Look for cross-referenced events from OPEN PRs
      return events.some(
        (event: any) =>
          event.event === "cross-referenced" &&
          event.source?.issue?.pull_request && // It is a PR
          event.source?.issue?.state === "open", // It is open
      );
    } catch (e) {
      console.warn("Failed to check PR status", e);
      return false;
    }
  };

  // Effect to manage the Issue Lifecycle: Check PR -> Summarize -> Ready
  useEffect(() => {
    if (step === "triage" && issues[currentIndex]) {
      const processCurrentIssue = async () => {
        // 1. Reset UI
        setCurrentRating({ ambiguity: "", scale: "", novelty: "", type: "" });
        setSummaryError(null);
        setCurrentSummary("");

        // 2. Check for Open PRs (Skip logic)
        setIsCheckingPr(true);
        const hasOpenPr = await checkForOpenPRs(issues[currentIndex]);
        setIsCheckingPr(false);

        if (hasOpenPr) {
          console.log(
            `Skipping Issue #${issues[currentIndex].number} due to existing open PR.`,
          );
          // Move to next immediately
          if (currentIndex < issues.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            // End of batch
            setStep("complete");
          }
          return; // Stop processing this issue
        }

        // 3. Generate Summary if passed checks
        generateSummaryForIssue(issues[currentIndex]);
      };

      processCurrentIssue();
    }
  }, [currentIndex, step, issues]); // Depend on index to trigger for each new issue

  const generateSummaryForIssue = async (issue: any) => {
    setIsSummarizing(true);
    setSummaryError(null);
    setCurrentSummary("");

    try {
      // 1. Fetch comments to get full context
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
      };
      if (ghToken) headers["Authorization"] = `token ${ghToken}`;

      const commentsResp = await fetch(issue.comments_url, { headers });
      const comments = commentsResp.ok ? await commentsResp.json() : [];

      // 2. Prepare text blob
      let fullText = `Title: ${issue.title}\n\nBody:\n${issue.body || "No description provided."}\n\n`;

      if (comments.length > 0) {
        fullText += `Comments:\n`;
        comments.forEach((c: any) => {
          // Take first 10 comments max
          fullText += `- User ${c.user.login}: ${c.body}\n`;
        });
      }

      // 3. Call Gemini
      const summary = await fetchGeminiSummary(fullText, geminiKey);
      setCurrentSummary(summary || "");
    } catch (err) {
      console.error(err);
      setSummaryError(
        "Failed to generate summary. You may need to read the raw issue.",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleNext = () => {
    const newEntry = {
      ...currentRating,
      issueNumber: issues[currentIndex].number,
      title: issues[currentIndex].title,
      url: issues[currentIndex].html_url,
    };

    const newScores = {
      ...scores,
      [issues[currentIndex].number]: newEntry,
    };

    setScores(newScores);

    // Calculate how many valid scored issues we have now
    const validCount = Object.values(newScores).filter(isValidScore).length;

    // Check if we reached the target of fully scored issues
    if (validCount >= TARGET_ISSUE_COUNT) {
      setStep("complete");
      return;
    }

    // Move to next issue
    if (currentIndex < issues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Run out of issues in the batch of 100
      setStep("complete");
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Issue Number",
      "Title",
      "URL",
      "Type",
      "Ambiguity",
      "Scale",
      "Novelty",
      "Is Scored (Not X)",
    ];
    const rows = Object.values(scores).map((s) => [
      s.issueNumber,
      `"${s.title?.replace(/"/g, '""')}"`, // Escape quotes
      s.url,
      s.type,
      s.ambiguity,
      s.scale,
      s.novelty,
      isValidScore(s) ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `triage_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isRatingComplete =
    currentRating.ambiguity &&
    currentRating.scale &&
    currentRating.novelty &&
    currentRating.type;
  const currentValidCount = Object.values(scores).filter(isValidScore).length;
  const progressPercentage = (currentValidCount / TARGET_ISSUE_COUNT) * 100;

  // --- RENDERERS ---

  const renderInputStep = () => (
    <div className="max-w-md mx-auto mt-20">
      <Card className="p-8">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="bg-blue-50 p-3 rounded-full">
            <Github className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {" "}
              GitHub Issue Triage{" "}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {" "}
              Goal: 15 Scored Issues (Not 'X'){" "}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {" "}
              Repository URL{" "}
            </label>
            <input
              type="text"
              placeholder="https://github.com/facebook/react"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                {" "}
                GitHub Token{" "}
                <span className="text-slate-400 font-normal">
                  {" "}
                  (Recommended){" "}
                </span>
              </label>
            </div>
            <input
              type="password"
              placeholder="ghp_..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              {" "}
              Token highly recommended to avoid API limits when checking PRs.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                {" "}
                Gemini API Key <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="password"
              placeholder="AIza..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              {" "}
              Required for issue summarization.{" "}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleFetchIssues}
            disabled={loading || !repoUrl || !geminiKey}
            className="w-full mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Start Triage Session"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderTriageStep = () => {
    const issue = issues[currentIndex];

    return (
      <div className="max-w-4xl mx-auto mt-8 pb-20 px-4">
        {/* Modals */}
        <Modal
          isOpen={showExitModal}
          title="Exit Session?"
          message="You will lose all progress on the current issues. Are you sure you want to return to the start?"
          onCancel={() => setShowExitModal(false)}
          onConfirm={() => {
            setShowExitModal(false);
            setStep("input");
            setIssues([]);
            setScores({});
          }}
          confirmText="Exit"
        />

        <Modal
          isOpen={showFinishModal}
          title="Finish Early?"
          message="This will end your triage session. The current issue will be skipped, but you can download a report for all issues you've already scored."
          onCancel={() => setShowFinishModal(false)}
          onConfirm={() => {
            setShowFinishModal(false);
            setStep("complete");
          }}
          confirmText="Finish & Download"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-slate-500 font-medium">
            Processing Issue {currentIndex + 1} of {issues.length}
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Issue Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex gap-3 items-start mb-4">
                <div className="mt-1 p-1.5 bg-green-100 text-green-700 rounded-md">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 leading-snug">
                    {" "}
                    {issue.title}{" "}
                  </h2>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                  >
                    #{issue.number} • Opened{" "}
                    {new Date(issue.created_at).toLocaleDateString()}
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"> </span>
                  AI Thread Summary
                </h3>

                {isCheckingPr ? (
                  <div className="flex items-center gap-3 text-slate-500 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-sm"> Checking for open PRs...</span>
                  </div>
                ) : isSummarizing ? (
                  <div className="flex items-center gap-3 text-slate-500 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm animate-pulse">
                      {" "}
                      Reading thread and summarizing...
                    </span>
                  </div>
                ) : summaryError ? (
                  <div className="text-red-500 text-sm"> {summaryError} </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {currentSummary}
                  </p>
                )}
              </div>

              {/* Fallback to raw body if needed */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-600">
                    {" "}
                    View original issue body{" "}
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 rounded whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {issue.body
                      ? issue.body.slice(0, 500) +
                        (issue.body.length > 500 ? "..." : "")
                      : "No description."}
                  </div>
                </details>
              </div>
            </Card>
          </div>

          {/* RIGHT: Scoring Panel */}
          <div className="md:col-span-1">
            <div className="sticky top-6">
              <Card className="p-6 bg-slate-900 border-slate-800 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Score
                  </h3>
                  <div className="text-xs font-semibold text-slate-300">
                    Goal: {currentValidCount} / {TARGET_ISSUE_COUNT}
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full bg-slate-700 h-2.5 rounded-full mb-6 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>

                <div className="space-y-6">
                  <TypeSelect
                    value={currentRating.type}
                    onChange={(val) =>
                      setCurrentRating((prev) => ({ ...prev, type: val }))
                    }
                  />
                  <RatingInput
                    label="Ambiguity"
                    value={currentRating.ambiguity}
                    onChange={(val) =>
                      setCurrentRating((prev) => ({ ...prev, ambiguity: val }))
                    }
                  />
                  <RatingInput
                    label="Scale"
                    value={currentRating.scale}
                    onChange={(val) =>
                      setCurrentRating((prev) => ({ ...prev, scale: val }))
                    }
                  />
                  <RatingInput
                    label="Novelty"
                    value={currentRating.novelty}
                    onChange={(val) =>
                      setCurrentRating((prev) => ({ ...prev, novelty: val }))
                    }
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!isRatingComplete || isCheckingPr}
                    onClick={handleNext}
                  >
                    Next Issue
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {/* END NOW BUTTON */}
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-white transition-colors border border-transparent hover:border-slate-700 rounded-lg flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Finish Early & Download
                  </button>

                  <div className="text-center mt-3">
                    <span className="text-xs text-slate-500">
                      {isCheckingPr
                        ? "Verifying PR status..."
                        : !isRatingComplete
                          ? "Complete all fields to continue"
                          : "Ready to process"}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs">
                <p className="font-semibold mb-1"> Scoring Goal: </p>
                <p>
                  {" "}
                  Track 15 issues where all values are scored (1-5). Selecting
                  'X' (N/A) will not count towards the goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="max-w-md mx-auto mt-20 text-center">
      <Card className="p-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {" "}
          Session Complete{" "}
        </h2>
        <p className="text-slate-500 mb-8">
          You processed {Object.keys(scores).length} issues in total.
          <br />
          Found {currentValidCount} fully scored issues.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleDownloadCSV}
            variant="primary"
            className="w-full"
          >
            <Download className="w-4 h-4" />
            Download CSV Report
          </Button>
          <Button
            onClick={() => {
              setStep("input");
              setIssues([]);
              setRepoUrl("");
              setScores({});
            }}
            variant="secondary"
            className="w-full"
          >
            Start New Session
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
          <Send className="w-4 h-4" />
        </div>
        <span className="font-bold text-lg tracking-tight"> IssueTriage </span>
      </div>

      {/* Main Content */}
      <main>
        {step === "input" && renderInputStep()}
        {step === "triage" && renderTriageStep()}
        {step === "complete" && renderCompleteStep()}
      </main>
    </div>
  );
}
