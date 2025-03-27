"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const FeatureCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 4;
  const slideTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Feature slides data
  const slides = [
    {
      title: "Smart Trial Matching",
      description: "Personalized trial recommendations based on your site's therapeutic areas and preferences",
      image: "/DashboardScreen.png?v=2",
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "AI-Curated News Feed",
      description: "Stay informed with the latest news on clinical trials tailored to your interests and specialties",
      image: "/News.png",
      color: "from-emerald-500/20 to-teal-500/20"
    },
    {
      title: "Advanced Trial Filtering",
      description: "Easily find and sort through thousands of trials with powerful filtering options",
      image: "/DashboardScreen.png?v=2", // Use Dashboard as placeholder for now
      color: "from-amber-500/20 to-orange-500/20"
    },
    {
      title: "Preference Management",
      description: "Save your preferences to receive more relevant trial matches and news updates",
      image: "/SavePrefScreen.png?v=2",
      color: "from-indigo-500/20 to-blue-500/20"
    }
  ];
  
  // Auto-rotate slides
  useEffect(() => {
    const startAutoRotation = () => {
      slideTimeout.current = setTimeout(() => {
        setActiveSlide((prevSlide) => (prevSlide + 1) % totalSlides);
      }, 5000); // Change slide every 5 seconds
    };
    
    startAutoRotation();
    
    return () => {
      if (slideTimeout.current) {
        clearTimeout(slideTimeout.current);
      }
    };
  }, [activeSlide, totalSlides]);
  
  // Manual slide navigation
  const goToSlide = (index: number) => {
    if (slideTimeout.current) {
      clearTimeout(slideTimeout.current);
    }
    setActiveSlide(index);
  };
  
  return (
    <div className="relative">
      {/* Main carousel display */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 shadow-xl bg-background/50 backdrop-blur-sm">
        <div className="w-full relative md:aspect-[16/9]" style={{ paddingBottom: 'clamp(380px, 100%, 56.25%)' }}>
          {/* Slides */}
          {slides.map((slide, index) => (
            <div 
              key={index}
              className={`absolute inset-0 flex flex-col md:flex-row md:h-full transition-all duration-700 ease-in-out ${
                index === activeSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
              }`}
            >
              {/* Text content - left side on desktop, top on mobile */}
              <div className="w-full md:w-1/3 p-4 pt-6 md:p-10 flex flex-col justify-center z-10">
                <h3 className="text-xl md:text-3xl font-semibold mb-2 md:mb-3 md:text-left text-center">{slide.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground md:text-left text-center">{slide.description}</p>
              </div>
              
              {/* Image - right side on desktop, below on mobile */}
              <div className="w-full md:w-2/3 flex-1 flex items-center justify-center md:justify-end relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-30`}></div>
                
                {/* Browser mockup container */}
                <div className="relative w-[90%] md:w-[85%] mx-auto md:mx-0 my-4 md:my-8 md:mr-8">
                  {/* Desktop mockup frame */}
                  <div className="relative rounded-lg md:rounded-xl border-2 md:border-4 border-slate-600 shadow-lg md:shadow-2xl overflow-hidden bg-slate-700 aspect-[16/10]">
                    {/* Top bar with mock browser controls */}
                    <div className="absolute top-0 left-0 right-0 h-4 md:h-6 bg-slate-600 flex items-center px-2 z-10">
                      <div className="flex gap-1 md:gap-1.5">
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    
                    {/* Content area with consistent aspect ratio */}
                    <div className="absolute inset-0 pt-4 md:pt-6 overflow-hidden flex items-center justify-center bg-gray-100">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        className="object-contain w-full h-full transform transition-transform duration-500 ease-out hover:scale-[1.02]"
                        width={1200}
                        height={675}
                        priority={index === 0}
                        style={{
                          objectFit: "contain",
                          objectPosition: "center center"
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Add reflection effect */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-8 md:h-12 transform scale-y-[-1] opacity-20 blur-sm"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${slide.color.split(' ')[1].replace('/20', '/40')})`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="flex justify-center mt-3 md:mt-6 gap-1 md:gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
              index === activeSlide 
                ? "bg-primary w-6 md:w-8" 
                : "bg-primary/30 hover:bg-primary/50"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureCarousel; 