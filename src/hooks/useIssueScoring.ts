import { useState, useEffect, useCallback } from "react";
import { ScoreEntry, TARGET_ISSUE_COUNT } from "../types";
import { checkForOpenPRs, fetchIssueComments } from "../api/github";
import { fetchGeminiSummary } from "../api/gemini";
import { isValidScore } from "../utils/scoring";

export function useIssueScoring(issues: any[], ghToken: string, geminiKey: string) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSummary, setCurrentSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCheckingPr, setIsCheckingPr] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<number, ScoreEntry>>({});

  const [currentRating, setCurrentRating] = useState<ScoreEntry>({
    ambiguity: "",
    scale: "",
    novelty: "",
    type: "",
  });

  const currentValidCount = Object.values(scores).filter(isValidScore).length;
  const progressPercentage = (currentValidCount / TARGET_ISSUE_COUNT) * 100;
  const isRatingComplete = !!(
    currentRating.ambiguity &&
    currentRating.scale &&
    currentRating.novelty &&
    currentRating.type
  );

  const generateSummaryForIssue = useCallback(
    async (issue: any) => {
      setIsSummarizing(true);
      setSummaryError(null);
      setCurrentSummary("");

      try {
        const comments = await fetchIssueComments(issue.comments_url, ghToken);

        let fullText = `Title: ${issue.title}\n\nBody:\n${issue.body || "No description provided."}\n\n`;

        if (comments.length > 0) {
          fullText += `Comments:\n`;
          comments.slice(0, 10).forEach((c: any) => {
            fullText += `- User ${c.user.login}: ${c.body}\n`;
          });
        }

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
    },
    [ghToken, geminiKey],
  );

  // Process current issue lifecycle: Check PR -> Summarize -> Ready
  useEffect(() => {
    if (issues.length === 0 || currentIndex >= issues.length) return;

    const processCurrentIssue = async () => {
      setCurrentRating({ ambiguity: "", scale: "", novelty: "", type: "" });
      setSummaryError(null);
      setCurrentSummary("");

      setIsCheckingPr(true);
      const hasOpenPr = await checkForOpenPRs(
        issues[currentIndex].url,
        ghToken,
      );
      setIsCheckingPr(false);

      if (hasOpenPr) {
        console.log(
          `Skipping Issue #${issues[currentIndex].number} due to existing open PR.`,
        );
        if (currentIndex < issues.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
        return;
      }

      generateSummaryForIssue(issues[currentIndex]);
    };

    processCurrentIssue();
  }, [currentIndex, issues, ghToken, generateSummaryForIssue]);

  const handleNext = useCallback(() => {
    const newEntry = {
      ...currentRating,
      issueNumber: issues[currentIndex].number,
      title: issues[currentIndex].title,
      url: issues[currentIndex].html_url,
      summary: currentSummary,
    };

    setScores((prev) => ({
      ...prev,
      [issues[currentIndex].number]: newEntry,
    }));

    const newScores = {
      ...scores,
      [issues[currentIndex].number]: newEntry,
    };
    const validCount = Object.values(newScores).filter(isValidScore).length;

    if (validCount >= TARGET_ISSUE_COUNT) {
      return "complete";
    }

    if (currentIndex < issues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return null;
    }

    return "complete";
  }, [currentRating, currentIndex, issues, scores, currentSummary]);

  return {
    currentIndex,
    currentSummary,
    isSummarizing,
    isCheckingPr,
    summaryError,
    scores,
    setScores,
    currentRating,
    setCurrentRating,
    currentValidCount,
    progressPercentage,
    isRatingComplete,
    handleNext,
    generateSummaryForIssue,
  };
}