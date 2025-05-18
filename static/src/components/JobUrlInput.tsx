
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoIcon } from "lucide-react";

interface JobUrlInputProps {
  onAnalyze: (result: string) => void;
  setIsAnalyzing: (value: boolean) => void;
  isAnalyzing: boolean;
}

const JobUrlInput: React.FC<JobUrlInputProps> = ({ 
  onAnalyze, 
  setIsAnalyzing,
  isAnalyzing 
}) => {
  const [url, setUrl] = useState("");
  
  const handleUrlAnalysis = () => {
    if (!url.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock analysis logic
      const isFake = url.includes("freelance") || 
                    url.includes("quick") || 
                    !url.includes("https://");
      
      onAnalyze(isFake ? "Fake Job Posting Detected" : "Legitimate Job Posting");
      setIsAnalyzing(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="job_url" className="block text-lg font-medium text-gray-700">
          Enter Job Posting URL
        </label>
        <Input
          id="job_url"
          type="url"
          className="w-full"
          placeholder="https://example.com/job-posting"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex items-start mt-2 text-sm text-gray-500">
          <InfoIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>
            Enter the full URL of the job posting you want to analyze
          </span>
        </div>
      </div>

      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
        onClick={handleUrlAnalysis}
        disabled={isAnalyzing || !url.trim() || !url.includes(".")}
      >
        {isAnalyzing ? "Analyzing URL..." : "Check URL"}
      </Button>
    </div>
  );
};

export default JobUrlInput;
