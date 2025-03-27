import React, { useState } from 'react';
import { format } from 'date-fns';
import { ExternalLink, Activity, Pill, Stethoscope, Microscope, Calendar, TestTube, Globe } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sourceIcons = {
  FDA: <Activity className="h-3 w-3 mr-1" />,
  PUBMED: <Microscope className="h-3 w-3 mr-1" />,
  DRUGS_COM: <Pill className="h-3 w-3 mr-1" />,
  MEDICAL_DEVICE: <Stethoscope className="h-3 w-3 mr-1" />,
  TRIAL_SITE: <TestTube className="h-3 w-3 mr-1" />,
  INTERNATIONAL: <Globe className="h-3 w-3 mr-1" />,
} as const;

const categoryColors = {
  DRUG_APPROVAL: 'bg-emerald-100 text-emerald-800',
  CLINICAL_TRIAL: 'bg-amber-100 text-amber-800',
  REGULATORY: 'bg-sky-100 text-sky-800',
  MEDICAL_DEVICE: 'bg-rose-100 text-rose-800',
  RESEARCH: 'bg-indigo-100 text-indigo-800',
  PHARMA: 'bg-violet-100 text-violet-800',
  SAFETY_ALERT: 'bg-red-100 text-red-800',
} as const;

interface NewsCardProps {
  item: NewsItem;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  onSourceClick?: (source: string) => void;
  relevanceScore?: number;
  showAiScore?: boolean;
  highlyRecommendedThreshold?: number;
  onReadMoreClick?: (item: NewsItem) => void;
}

export function NewsCard({ 
  item, 
  onTagClick, 
  onCategoryClick, 
  onSourceClick, 
  relevanceScore, 
  showAiScore = false, 
  highlyRecommendedThreshold = 65,
  onReadMoreClick 
}: NewsCardProps) {
  // Using the prop directly instead of accessing window global
  
  // Validate and format the publish date
  let formattedDate = 'Recent';
  try {
    const publishDate = new Date(item.publishedAt);
    const now = new Date();
    
    // Check for valid date
    if (!isNaN(publishDate.getTime())) {
      // Check for future date (with 1 day tolerance for timezone issues)
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (publishDate.getTime() > now.getTime() + oneDayInMs) {
        // Silently ignore future dates
      } else {
        formattedDate = format(publishDate, 'MMM d, yyyy');
      }
    }
  } catch (error) {
    // Silently fail - no console errors
  }
  
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const cleanDescription = stripHtml(item.description);
  const cleanContent = stripHtml(item.content);
  
  const previewText = cleanDescription.length > 50 
    ? cleanDescription 
    : cleanContent.substring(0, 300);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col relative">
      {showAiScore && relevanceScore !== undefined && (
        <div className={cn(
          "absolute px-2 py-1 text-xs font-medium rounded z-10 top-2 left-2",
          relevanceScore >= highlyRecommendedThreshold 
            ? "bg-[#574b90] text-white" 
            : "bg-blue-600 text-white"
        )}>
          {relevanceScore >= highlyRecommendedThreshold 
            ? "Highly Recommended" 
            : `AI Score: ${relevanceScore.toFixed(0)}`}
        </div>
      )}
      
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-end mb-1">
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formattedDate}
          </span>
        </div>
        
        <CardTitle className="text-base font-medium mb-1 line-clamp-2">
          {item.title}
        </CardTitle>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {item.categories.map(category => (
            <Badge
              key={category}
              className={`${categoryColors[category]} text-[10px] py-0 px-1.5 cursor-pointer`}
              onClick={() => onCategoryClick?.(category)}
            >
              {category.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 flex-grow">
        <div className="text-xs text-gray-700 line-clamp-6 mb-2">
          {previewText}
        </div>
        
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {item.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100 text-[10px] py-0 px-1.5"
                onClick={() => onTagClick?.(tag)}
              >
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-gray-100 text-[10px] py-0 px-1.5"
                onClick={() => onTagClick?.(item.tags[3])}
              >
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <span 
          className="text-xs text-gray-500 flex items-center cursor-pointer hover:text-gray-700" 
          onClick={() => onSourceClick?.(item.source)}
        >
          {sourceIcons[item.source]}
          {item.source.replace('_', ' ')}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-7"
          onClick={() => onReadMoreClick ? onReadMoreClick(item) : window.open(item.url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </Button>
      </CardFooter>
    </Card>
  );
} 