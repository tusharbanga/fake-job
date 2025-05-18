
import React from "react";
import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-16 bg-blue-800 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-300 mr-2" />
              <h3 className="text-xl font-bold text-white">Job Sentinel</h3>
            </div>
            <p className="mt-2 text-blue-200 max-w-md">
              Protecting job seekers from scams and fraudulent postings with our AI-powered detection tools.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-300">Resources</h4>
              <ul className="space-y-2 text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Tips</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Common Scams</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-300">Company</h4>
              <ul className="space-y-2 text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-300">Connect</h4>
              <ul className="space-y-2 text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-blue-700 text-center text-blue-300 text-sm">
          <p>© {new Date().getFullYear()} Job Sentinel. All rights reserved.</p>
          <p className="mt-2">This tool is for educational purposes only. Always verify job opportunities thoroughly.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
