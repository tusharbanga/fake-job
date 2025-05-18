
import React from "react";
import { Shield, Search, AlertTriangle } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 rounded-2xl shadow-xl">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full"></div>
        <div className="absolute top-32 -left-24 w-72 h-72 bg-indigo-400 rounded-full"></div>
        <div className="absolute -bottom-24 right-12 w-64 h-64 bg-blue-300 rounded-full"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-white/20 p-3">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
          Protect Yourself From<br /> Job Scams
        </h1>
        
        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
          Our AI-powered tool analyzes job postings to identify potential scams and protect your career journey.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center bg-white/20 backdrop-blur-sm py-3 px-5 rounded-lg">
            <Search className="h-5 w-5 text-blue-200 mr-2" />
            <span className="text-blue-50 font-medium">Scan job postings for red flags</span>
          </div>
          
          <div className="flex items-center bg-white/20 backdrop-blur-sm py-3 px-5 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-blue-200 mr-2" />
            <span className="text-blue-50 font-medium">Identify scam indicators</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
