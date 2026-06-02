import { Dispatch, SetStateAction } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { RatingInput } from "../components/RatingInput";
import { TypeSelect } from "../components/TypeSelect";
import {
  Github,
  FileText,
  Loader2,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";
import { TARGET_ISSUE_COUNT } from "../types";
import { ScoreEntry } from "../types";

interface TriagePageProps {
  issue: any;
  currentIndex: number;
  totalIssues: number;
  currentSummary: string;
  isSummarizing: boolean;
  isCheckingPr: boolean;
  summaryError: string | null;
  currentRating: ScoreEntry;
  setCurrentRating: Dispatch<SetStateAction<ScoreEntry>>;
  currentValidCount: number;
  progressPercentage: number;
  isRatingComplete: boolean;
  showExitModal: boolean;
  setShowExitModal: Dispatch<SetStateAction<boolean>>;
  showFinishModal: boolean;
  setShowFinishModal: Dispatch<SetStateAction<boolean>>;
  onNext: () => void;
  onExit: () => void;
  onFinish: () => void;
}

export const TriagePage = ({
  issue,
  currentIndex,
  totalIssues,
  currentSummary,
  isSummarizing,
  isCheckingPr,
  summaryError,
  currentRating,
  setCurrentRating,
  currentValidCount,
  progressPercentage,
  isRatingComplete,
  showExitModal,
  setShowExitModal,
  showFinishModal,
  setShowFinishModal,
  onNext,
  onExit,
  onFinish,
}: TriagePageProps) => (
  <div className="max-w-4xl mx-auto mt-8 pb-20 px-4">
    {/* Modals */}
    <Modal
      isOpen={showExitModal}
      title="Exit Session?"
      message="You will lose all progress on the current issues. Are you sure you want to return to the start?"
      onCancel={() => setShowExitModal(false)}
      onConfirm={onExit}
      confirmText="Exit"
    />

    <Modal
      isOpen={showFinishModal}
      title="Finish Early?"
      message="This will end your triage session. The current issue will be skipped, but you can download a report for all issues you've already scored."
      onCancel={() => setShowFinishModal(false)}
      onConfirm={onFinish}
      confirmText="Finish & Download"
    />

    <div className="flex justify-between items-center mb-6">
      <div className="text-sm text-slate-500 font-medium">
        Processing Issue {currentIndex + 1} of {totalIssues}
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
                onClick={onNext}
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
              Track 15 issues where all values are scored (1-5). Selecting 'X'
              (N/A) will not count towards the goal.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);