
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, X } from "lucide-react";

interface JobAnalyzerProps {
  prediction: string;
}

const JobAnalyzer: React.FC<JobAnalyzerProps> = ({ prediction }) => {
  const isFake = prediction.includes("Fake");

  return (
    <Alert className={`mt-6 ${isFake ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
      <div className="flex items-center">
        {isFake ? (
          <div className="bg-red-100 p-2 rounded-full mr-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
        ) : (
          <div className="bg-green-100 p-2 rounded-full mr-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
        )}
        <div>
          <AlertTitle className={`text-xl font-bold ${isFake ? 'text-red-700' : 'text-green-700'}`}>
            {prediction}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {isFake ? (
              <div className="text-red-600">
                <p>This job posting shows common scam indicators. Be cautious!</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Promises of high pay with minimal qualifications</li>
                  <li>Requests for personal or financial information</li>
                  <li>Unprofessional language or excessive urgency</li>
                </ul>
              </div>
            ) : (
              <div className="text-green-600">
                <p>This job posting appears legitimate based on our analysis.</p>
                <p className="text-sm mt-2">Always conduct your own research before sharing personal information.</p>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default JobAnalyzer;
