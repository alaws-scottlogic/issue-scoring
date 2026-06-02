import { ScoreEntry } from "../types";

export const isValidScore = (scoreEntry: ScoreEntry) => {
  const validValues = ["1", "2", "3", "4", "5"];
  return (
    validValues.includes(scoreEntry.ambiguity) &&
    validValues.includes(scoreEntry.scale) &&
    validValues.includes(scoreEntry.novelty)
  );
};

export const generateCSV = (scores: Record<number, ScoreEntry>) => {
  const headers = [
    "Issue Number",
    "Title",
    "URL",
    "Type",
    "Ambiguity",
    "Scale",
    "Novelty",
    "Is Scored (Not X)",
    "Summary",
  ];
  const rows = Object.values(scores).map((s) => [
    s.issueNumber,
    `"${s.title?.replace(/"/g, '""')}"`,
    s.url,
    s.type,
    s.ambiguity,
    s.scale,
    s.novelty,
    isValidScore(s) ? "Yes" : "No",
    `"${s.summary?.replace(/"/g, '""') || ''}"`,
  ]);

  return [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");
};

export const downloadCSV = (
  csvContent: string,
  filename: string,
) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};