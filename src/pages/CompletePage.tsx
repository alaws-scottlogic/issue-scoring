import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CheckCircle2, Download } from "lucide-react";

interface CompletePageProps {
  totalProcessed: number;
  validScoredCount: number;
  onDownload: () => void;
  onNewSession: () => void;
}

export const CompletePage = ({
  totalProcessed,
  validScoredCount,
  onDownload,
  onNewSession,
}: CompletePageProps) => (
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
        You processed {totalProcessed} issues in total.
        <br />
        Found {validScoredCount} fully scored issues.
      </p>

      <div className="space-y-3">
        <Button onClick={onDownload} variant="primary" className="w-full">
          <Download className="w-4 h-4" />
          Download CSV Report
        </Button>
        <Button onClick={onNewSession} variant="secondary" className="w-full">
          Start New Session
        </Button>
      </div>
    </Card>
  </div>
);