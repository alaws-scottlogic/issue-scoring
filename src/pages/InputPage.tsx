import { Dispatch, SetStateAction } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Github, AlertCircle, Loader2 } from "lucide-react";

interface InputPageProps {
  repoUrl: string;
  setRepoUrl: Dispatch<SetStateAction<string>>;
  ghToken: string;
  setGhToken: Dispatch<SetStateAction<string>>;
  geminiKey: string;
  setGeminiKey: Dispatch<SetStateAction<string>>;
  loading: boolean;
  error: string | null;
  onFetchIssues: () => void;
}

export const InputPage = ({
  repoUrl,
  setRepoUrl,
  ghToken,
  setGhToken,
  geminiKey,
  setGeminiKey,
  loading,
  error,
  onFetchIssues,
}: InputPageProps) => (
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
          onClick={onFetchIssues}
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