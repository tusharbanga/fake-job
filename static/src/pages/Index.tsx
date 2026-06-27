
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JobAnalyzer from "@/components/JobAnalyzer";
import JobUrlInput from "@/components/JobUrlInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, Shield } from "lucide-react";
import Hero from "@/components/Hero";
import RedFlags from "@/components/RedFlags";
import Statistics from "@/components/Statistics";
import ExampleCards from "@/components/ExampleCards";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  const [jobText, setJobText] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDetect = () => {
    if (!jobText.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock analysis logic
      const isFake = jobText.toLowerCase().includes("work from home") && 
                     jobText.toLowerCase().includes("no experience") &&
                     jobText.toLowerCase().includes("urgent");
      
      setPrediction(isFake ? "Fake Job Posting Detected" : "Legitimate Job Posting");
      setIsAnalyzing(false);
      
      // Scroll to result
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Section */}
      <header className="py-6 px-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-blue-700">Job Sentinel</h1>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li><a href="#verify" className="text-gray-600 hover:text-blue-600 transition-colors">Verify Job</a></li>
              <li><a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a></li>
              <li><a href="#examples" className="text-gray-600 hover:text-blue-600 transition-colors">Examples</a></li>
              <li><a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        {/* Hero Section */}
        <Hero />
        
        {/* Main Tool Section */}
        <div id="verify" className="mt-16 scroll-mt-24">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-3xl font-bold text-blue-700">
                Fake Job Posting Detection
              </CardTitle>
              <p className="text-gray-500 mt-2">
                Protect yourself from scams by verifying job postings before applying
              </p>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="text">Paste Job Description</TabsTrigger>
                  <TabsTrigger value="url">Enter Job URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="job_text" className="block text-lg font-medium text-gray-700">
                      Paste Job Title and Description
                    </label>
                    <Textarea
                      id="job_text"
                      rows={6}
                      className="w-full"
                      placeholder="e.g., We are hiring for a data entry role. Work from home, no experience needed..."
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                    onClick={handleDetect}
                    disabled={isAnalyzing || !jobText.trim()}
                  >
                    {isAnalyzing ? "Analyzing..." : "Detect"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="url">
                  <JobUrlInput 
                    onAnalyze={(result) => setPrediction(result)}
                    setIsAnalyzing={setIsAnalyzing}
                    isAnalyzing={isAnalyzing}
                  />
                </TabsContent>
              </Tabs>

              {isAnalyzing && (
                <div className="mt-8 flex flex-col items-center justify-center text-gray-500">
                  <ArrowDown className="animate-bounce h-8 w-8 mb-2" />
                  <p>Analyzing job posting...</p>
                </div>
              )}

              {prediction && !isAnalyzing && (
                <div id="result-section">
                  <JobAnalyzer prediction={prediction} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Example Cards Section */}
        <div id="examples" className="scroll-mt-24">
          <ExampleCards />
        </div>
        
        {/* Red Flags Section */}
        <div id="how-it-works" className="scroll-mt-24">
          <RedFlags />
        </div>
        
        {/* Statistics Section */}
        <Statistics />
        
        {/* Testimonials Section */}
        <Testimonials />
        
        {/* FAQ Section */}
        <div id="faq" className="scroll-mt-24">
          <FAQ />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
