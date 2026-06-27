
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqItems = [
    {
      question: "How does the fake job detection work?",
      answer: "Our tool uses advanced pattern recognition to analyze job postings for common red flags and suspicious language. It compares the posting against thousands of known scam patterns to identify potential issues."
    },
    {
      question: "Can I check a job posting URL directly?",
      answer: "Yes! Our tool can analyze both job descriptions that you paste and direct URLs to job postings on major job sites and company career pages."
    },
    {
      question: "Is my data secure when I use this tool?",
      answer: "Absolutely. We don't store any job descriptions or URLs you submit longer than needed for analysis. All data is encrypted and handled according to strict privacy standards."
    },
    {
      question: "What are common signs of a fake job posting?",
      answer: "Common signs include unrealistic salary offers, requests for upfront payments, vague job descriptions, poor grammar/spelling, personal email domains, and pressure to respond quickly."
    },
    {
      question: "What should I do if I've already applied to a scam job?",
      answer: "If you suspect you've applied to a scam, stop all communication immediately. If you've shared financial information, contact your bank. Consider reporting the scam to authorities and job boards."
    }
  ];

  return (
    <div className="mt-16 py-10">
      <div className="text-center mb-8">
        <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-blue-700">Frequently Asked Questions</h2>
      </div>
      
      <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-blue-100">
            <AccordionTrigger className="text-lg font-medium text-blue-800 hover:text-blue-600 py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 pb-4 pt-1">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;
