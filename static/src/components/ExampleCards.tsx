
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

const ExampleCards = () => {
  const examples = [
    {
      isFake: true,
      title: "DATA ENTRY - $35/hr - WORK FROM HOME - URGENT!!",
      description: "Easy work from home opportunity! Make $35/hour with flexible schedule. No experience needed! Immediate start. Just need your bank details for payment setup. CONTACT NOW before positions fill up!",
      redFlags: ["Unrealistic pay", "Urgency tactics", "Requests for financial information", "No experience needed for high pay"]
    },
    {
      isFake: false,
      title: "Junior Software Developer - ABC Technology Solutions",
      description: "ABC Technology Solutions is seeking a Junior Software Developer to join our growing team. Requirements: Bachelor's degree in CS or related field, 1-2 years experience with JavaScript and React. Located in our Bangalore office with hybrid work options. Competitive salary based on experience.",
      greenFlags: ["Clear company name", "Specific requirements", "Realistic qualifications", "Location information", "No requests for personal information"]
    }
  ];

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Example Job Postings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {examples.map((example, index) => (
          <Card key={index} className={`overflow-hidden ${example.isFake ? 'border-red-200' : 'border-green-200'}`}>
            <div className={`p-3 text-white ${example.isFake ? 'bg-red-500' : 'bg-green-500'} flex items-center`}>
              {example.isFake ? (
                <XCircle className="h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              <span className="font-medium">
                {example.isFake ? 'Fake Job Example' : 'Legitimate Job Example'}
              </span>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-3">{example.title}</h3>
              <p className="text-gray-700 mb-4">{example.description}</p>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">
                  {example.isFake ? 'Red Flags' : 'Green Flags'}
                </h4>
                <ul className={`list-disc list-inside ${example.isFake ? 'text-red-600' : 'text-green-600'}`}>
                  {(example.redFlags || example.greenFlags || []).map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExampleCards;
