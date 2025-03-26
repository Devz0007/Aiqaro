'use client';

import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, X } from 'lucide-react';
import { NewsItem, NewsFilter, NewsCategory, NewsSource } from '@/types/news';
import { NewsCard } from '@/components/news/news-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchNews } from '@/lib/services/news-service';
import { Skeleton } from '@/components/ui/skeleton';

const sourceLabels: Record<NewsSource, { label: string, color: string }> = {
  FDA: { label: 'FDA', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  PUBMED: { label: 'PubMed', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  DRUGS_COM: { label: 'Drugs.com', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
  MEDICAL_DEVICE: { label: 'Devices', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
  TRIAL_SITE: { label: 'TrialSite', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
};

const categoryLabels: Record<NewsCategory, { label: string, color: string }> = {
  DRUG_APPROVAL: { label: 'Approvals', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
  CLINICAL_TRIAL: { label: 'Trials', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  REGULATORY: { label: 'Regulatory', color: 'bg-sky-100 text-sky-800 hover:bg-sky-200' },
  MEDICAL_DEVICE: { label: 'Devices', color: 'bg-rose-100 text-rose-800 hover:bg-rose-200' },
  RESEARCH: { label: 'Research', color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' },
  PHARMA: { label: 'Pharma', color: 'bg-violet-100 text-violet-800 hover:bg-violet-200' },
  SAFETY_ALERT: { label: 'Safety', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<NewsSource[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    // Extract all unique tags from news items to display in filter
    if (news.length > 0) {
      const allTags = news.reduce((acc, item) => {
        item.tags.forEach(tag => {
          if (!acc.includes(tag)) {
            acc.push(tag);
          }
        });
        return acc;
      }, [] as string[]);
      setActiveTags(allTags);
    }
  }, [news]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: NewsFilter = {
        searchQuery: searchQuery || undefined,
        sources: selectedSources.length ? selectedSources : undefined,
        categories: selectedCategories.length ? selectedCategories : undefined,
        tags: selectedTags.length ? selectedTags : undefined,
      };
      
      const response = await fetchNews(filter);
      setNews(response.items);
    } catch (err) {
      setError('Failed to load news. Please try again later.');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [searchQuery, selectedSources, selectedCategories, selectedTags]);

  const handleSourceClick = (source: string) => {
    setSelectedSources(prev => {
      const sourceTyped = source as NewsSource;
      return prev.includes(sourceTyped)
        ? prev.filter(s => s !== sourceTyped)
        : [...prev, sourceTyped];
    });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategories(prev => {
      const categoryTyped = category as NewsCategory;
      return prev.includes(categoryTyped)
        ? prev.filter(c => c !== categoryTyped)
        : [...prev, categoryTyped];
    });
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSources([]);
    setSelectedCategories([]);
    setSelectedTags([]);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={!searchQuery && !selectedSources.length && !selectedCategories.length && !selectedTags.length}
                className="whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryLabels).map(([category, { label, color }]) => (
                  <Badge
                    key={category}
                    className={`cursor-pointer ${
                      selectedCategories.includes(category as NewsCategory) 
                        ? color 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    {label}
                    {selectedCategories.includes(category as NewsCategory) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer bg-gray-200 hover:bg-gray-300"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadNews} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-1 mt-2">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No news found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {news.map(item => (
            <NewsCard
              key={item.id}
              item={item}
              onSourceClick={handleSourceClick}
              onCategoryClick={handleCategoryClick}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
} 