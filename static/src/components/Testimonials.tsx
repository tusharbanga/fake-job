
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Raj Kumar",
      role: "Software Developer",
      text: "This tool saved me from applying to a potential scam! The job promised high salary for minimal qualifications which seemed too good to be true. The detector flagged it as suspicious, and after more research, I found it was indeed fraudulent.",
      stars: 5,
    },
    {
      name: "Priya Sharma",
      role: "Marketing Professional",
      text: "I was almost tricked by a professional looking job posting until I ran it through this detector. It flagged several red flags I hadn't noticed. Very grateful for this service!",
      stars: 5,
    },
    {
      name: "Amit Patel",
      role: "Recent Graduate",
      text: "As a fresh graduate, I was applying to many positions and almost fell for a scam. This tool helped me identify suspicious postings and saved me from providing personal information to scammers.",
      stars: 4,
    },
    {
      name: "Sneha Gupta",
      role: "HR Manager",
      text: "We recommend this tool to all job seekers. It helps identify potential scams and ensures people are applying to legitimate opportunities. Great service for the community!",
      stars: 5,
    },
  ];

  return (
    <div className="mt-16 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Success Stories</h2>
      
      <Carousel className="w-full max-w-4xl mx-auto">
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
              <div className="p-2">
                <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.stars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4 gap-2">
          <CarouselPrevious className="relative static left-0 right-auto translate-y-0" />
          <CarouselNext className="relative static right-0 left-auto translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default Testimonials;
