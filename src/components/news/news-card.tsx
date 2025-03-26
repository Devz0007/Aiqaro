import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Activity, Pill, Stethoscope, Microscope, Calendar, TestTube } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sourceIcons = {
  FDA: <Activity className="h-3 w-3 mr-1" />,
  PUBMED: <Microscope className="h-3 w-3 mr-1" />,
  DRUGS_COM: <Pill className="h-3 w-3 mr-1" />,
  MEDICAL_DEVICE: <Stethoscope className="h-3 w-3 mr-1" />,
  TRIAL_SITE: <TestTube className="h-3 w-3 mr-1" />,
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
}

export function NewsCard({ item, onTagClick, onCategoryClick, onSourceClick }: NewsCardProps) {
  // Add validation for date formatting to prevent "Invalid time value" errors
  let formattedDate = '';
  try {
    const publishDate = new Date(item.publishedAt);
    // Check if date is valid before formatting
    if (!isNaN(publishDate.getTime())) {
      formattedDate = format(publishDate, 'MMM d, yyyy');
    } else {
      formattedDate = 'Unknown date';
    }
  } catch (error) {
    console.error('Error formatting date:', item.publishedAt);
    formattedDate = 'Unknown date';
  }
  
  // Strip HTML tags for clean description text
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const cleanDescription = stripHtml(item.description);
  const cleanContent = stripHtml(item.content);
  
  // Get a longer preview text that combines description and content
  const previewText = cleanDescription.length > 50 
    ? cleanDescription 
    : cleanContent.substring(0, 300);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="p-3 pb-0">
        {/* Date row */}
        <div className="flex items-start justify-end mb-1">
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formattedDate}
          </span>
        </div>
        
        {/* Title */}
        <CardTitle className="text-base font-medium mb-1 line-clamp-2">
          {item.title}
        </CardTitle>
        
        {/* Categories */}
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
        {/* Description text */}
        <div className="text-xs text-gray-700 line-clamp-6 mb-2">
          {previewText}
        </div>
        
        {/* Tags */}
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
          onClick={() => window.open(item.url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </Button>
      </CardFooter>
    </Card>
  );
} 