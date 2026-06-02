import { GEMINI_MODEL } from "../types";

export const fetchGeminiSummary = async (
  textToSummarize: string,
  apiKey: string,
) => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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