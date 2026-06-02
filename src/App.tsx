import { useState } from "react";
import { Send } from "lucide-react";
import { Step } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useIssueScoring } from "./hooks/useIssueScoring";
import { fetchIssues } from "./api/github";
import { generateCSV, downloadCSV } from "./utils/scoring";
import { InputPage } from "./pages/InputPage";
import { TriagePage } from "./pages/TriagePage";
import { CompletePage } from "./pages/CompletePage";

export default function App() {
  // --- STATE ---
  const [step, setStep] = useState<Step>("input");
  const [repoUrl, setRepoUrl] = useLocalStorage("triage_repo_url", "");
  const [ghToken, setGhToken] = useLocalStorage("triage_gh_token", "");
  const [geminiKey, setGeminiKey] = useLocalStorage("triage_gemini_key", "");

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const scoring = useIssueScoring(issues, ghToken, geminiKey);

  // --- ACTIONS ---

  const handleFetchIssues = async () => {
    setError(null);
    setLoading(true);

    try {
      const pureIssues = await fetchIssues(repoUrl, ghToken);
      setIssues(pureIssues);
      setStep("triage");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const result = scoring.handleNext();
    if (result === "complete") {
      setStep("complete");
    }
  };

  const handleExit = () => {
    setShowExitModal(false);
    setStep("input");
    setIssues([]);
    scoring.setScores({});
  };

  const handleFinish = () => {
    setShowFinishModal(false);
    setStep("complete");
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV(scoring.scores);
    const filename = `triage_report_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csv, filename);
  };

  const handleNewSession = () => {
    setStep("input");
    setIssues([]);
    setRepoUrl("");
    scoring.setScores({});
  };

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
        {step === "input" && (
          <InputPage
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            ghToken={ghToken}
            setGhToken={setGhToken}
            geminiKey={geminiKey}
            setGeminiKey={setGeminiKey}
            loading={loading}
            error={error}
            onFetchIssues={handleFetchIssues}
          />
        )}

        {step === "triage" && scoring.currentIndex < issues.length && (
          <TriagePage
            issue={issues[scoring.currentIndex]}
            currentIndex={scoring.currentIndex}
            totalIssues={issues.length}
            currentSummary={scoring.currentSummary}
            isSummarizing={scoring.isSummarizing}
            isCheckingPr={scoring.isCheckingPr}
            summaryError={scoring.summaryError}
            currentRating={scoring.currentRating}
            setCurrentRating={scoring.setCurrentRating}
            currentValidCount={scoring.currentValidCount}
            progressPercentage={scoring.progressPercentage}
            isRatingComplete={scoring.isRatingComplete}
            showExitModal={showExitModal}
            setShowExitModal={setShowExitModal}
            showFinishModal={showFinishModal}
            setShowFinishModal={setShowFinishModal}
            onNext={handleNext}
            onExit={handleExit}
            onFinish={handleFinish}
          />
        )}

        {(step === "complete" ||
          (step === "triage" && scoring.currentIndex >= issues.length)) && (
          <CompletePage
            totalProcessed={Object.keys(scoring.scores).length}
            validScoredCount={scoring.currentValidCount}
            onDownload={handleDownloadCSV}
            onNewSession={handleNewSession}
          />
        )}
      </main>
    </div>
  );
}