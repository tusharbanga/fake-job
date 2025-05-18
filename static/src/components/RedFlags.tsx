
import React from "react";
import { AlertTriangle, DollarSign, Clock, FileWarning, Mail, User, Globe } from "lucide-react";

const RedFlags = () => {
  const redFlags = [
    {
      icon: <DollarSign className="h-8 w-8 text-red-500" />,
      title: "Unrealistic Salary",
      description: "High pay with minimal qualifications or experience required"
    },
    {
      icon: <Clock className="h-8 w-8 text-red-500" />,
      title: "Urgency Tactics",
      description: "Pressure to respond quickly or lose the opportunity"
    },
    {
      icon: <FileWarning className="h-8 w-8 text-red-500" />,
      title: "Vague Job Description",
      description: "Lack of specific responsibilities, requirements, or company details"
    },
    {
      icon: <Mail className="h-8 w-8 text-red-500" />,
      title: "Unprofessional Communication",
      description: "Emails with grammar errors or from personal accounts"
    },
    {
      icon: <User className="h-8 w-8 text-red-500" />,
      title: "Personal Information Requests",
      description: "Early requests for bank details, ID numbers, or other sensitive data"
    },
    {
      icon: <Globe className="h-8 w-8 text-red-500" />,
      title: "No Web Presence",
      description: "Company has no website or social media profiles"
    },
  ];

  return (
    <div className="mt-16 bg-gradient-to-b from-red-50 to-white py-12 px-4 rounded-2xl">
      <h2 className="text-3xl font-bold text-center text-red-600 mb-10">
        <AlertTriangle className="inline-block mr-2 h-8 w-8" />
        Common Red Flags in Fake Job Postings
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {redFlags.map((flag, index) => (
          <div 
            key={index}
            className="p-6 border border-red-100 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center mb-4">
              {flag.icon}
              <h3 className="ml-3 text-xl font-semibold text-red-700">{flag.title}</h3>
            </div>
            <p className="text-gray-600">{flag.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RedFlags;
