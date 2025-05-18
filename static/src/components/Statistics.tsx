
import React from "react";
import { Palette, Heart, Star, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Statistics = () => {
  return (
    <div className="mt-16 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Job Scam Statistics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 hover:border-blue-400 transition-colors duration-300 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="bg-blue-100 inline-block p-3 rounded-full mb-4">
              <Palette className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-4xl font-bold text-blue-700">14%</h3>
            <p className="text-gray-600 mt-2">Of job seekers have encountered a scam</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 hover:border-purple-400 transition-colors duration-300 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="bg-purple-100 inline-block p-3 rounded-full mb-4">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-4xl font-bold text-purple-700">$2000+</h3>
            <p className="text-gray-600 mt-2">Average loss per job scam victim</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 hover:border-orange-400 transition-colors duration-300 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="bg-orange-100 inline-block p-3 rounded-full mb-4">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-4xl font-bold text-orange-700">71%</h3>
            <p className="text-gray-600 mt-2">Of scams promise "work from home"</p>
          </CardContent>
        </Card>

        <Card className="border-teal-200 hover:border-teal-400 transition-colors duration-300 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="bg-teal-100 inline-block p-3 rounded-full mb-4">
              <Info className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-4xl font-bold text-teal-700">81%</h3>
            <p className="text-gray-600 mt-2">Increase in job scams since 2020</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
