'use client';

import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, X, Bot, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { NewsItem, NewsFilter, NewsCategory, NewsSource } from '@/types/news';
import { NewsCard } from '@/components/news/news-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchNews } from '@/lib/services/news-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@clerk/nextjs';
import { 
  getUserPreferences, 
  filterAndScoreNewsByPreferences, 
  calculateNewsRelevanceScore,
  StudyPreferences
} from '@/lib/services/user-preferences-service';
import { ArticleModal } from '@/components/news/article-modal';

const sourceLabels: Record<NewsSource, { label: string, color: string, lightColor: string }> = {
  FDA: { label: 'FDA', color: 'bg-blue-200 text-blue-800 hover:bg-blue-300', lightColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  PUBMED: { label: 'PubMed', color: 'bg-green-200 text-green-800 hover:bg-green-300', lightColor: 'bg-green-50 text-green-700 hover:bg-green-100' },
  DRUGS_COM: { label: 'Drugs.com', color: 'bg-purple-200 text-purple-800 hover:bg-purple-300', lightColor: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  MEDICAL_DEVICE: { label: 'Devices', color: 'bg-pink-200 text-pink-800 hover:bg-pink-300', lightColor: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  TRIAL_SITE: { label: 'TrialSite', color: 'bg-orange-200 text-orange-800 hover:bg-orange-300', lightColor: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  INTERNATIONAL: { label: 'International', color: 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300', lightColor: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
};

const categoryLabels: Record<NewsCategory, { label: string, color: string, lightColor: string }> = {
  DRUG_APPROVAL: { label: 'Approvals', color: 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300', lightColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  CLINICAL_TRIAL: { label: 'Trials', color: 'bg-amber-200 text-amber-800 hover:bg-amber-300', lightColor: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  REGULATORY: { label: 'Regulatory', color: 'bg-sky-200 text-sky-800 hover:bg-sky-300', lightColor: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
  MEDICAL_DEVICE: { label: 'Devices', color: 'bg-rose-200 text-rose-800 hover:bg-rose-300', lightColor: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
  RESEARCH: { label: 'Research', color: 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300', lightColor: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  PHARMA: { label: 'Pharma', color: 'bg-violet-200 text-violet-800 hover:bg-violet-300', lightColor: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
  SAFETY_ALERT: { label: 'Safety', color: 'bg-red-200 text-red-800 hover:bg-red-300', lightColor: 'bg-red-50 text-red-700 hover:bg-red-100' },
};

// AI Debug Panel Component
interface DebugPanelProps {
  userPreferences: StudyPreferences | null;
  selectedItem: NewsItem | null;
  score: number;
  onClose: () => void;
}

function AIDebugPanel({ userPreferences, selectedItem, score, onClose }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(true);
  
  if (!userPreferences || !selectedItem) return null;
  
  // Cast to any to access the score details added by our enhanced scoring algorithm
  const scoreDetails = (selectedItem as any).scoreDetails || {};
  const scoreBreakdown = Object.entries(scoreDetails)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .filter(([, value]) => (value as number) !== 0);
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
      <div className="p-4 border-b flex items-center justify-between bg-primary/10">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium">AI Score Debug Panel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className={`p-4 space-y-4 ${expanded ? '' : 'hidden'}`}>
        <div className="space-y-2">
          <h4 className="font-medium text-sm">User Preferences</h4>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <div><strong>User ID:</strong> {userPreferences.userId}</div>
            <div><strong>Therapeutic Areas:</strong> {userPreferences.therapeuticAreas?.join(', ') || 'None'}</div>
            <div><strong>Phases:</strong> {userPreferences.phases?.join(', ') || 'None'}</div>
            <div><strong>Status:</strong> {userPreferences.status?.join(', ') || 'None'}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Article Information</h4>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <div><strong>Title:</strong> {selectedItem.title}</div>
            <div><strong>Source:</strong> {selectedItem.source}</div>
            <div><strong>Categories:</strong> {selectedItem.categories.join(', ')}</div>
            <div><strong>Tags:</strong> {selectedItem.tags.join(', ')}</div>
            <div><strong>Published:</strong> {new Date(selectedItem.publishedAt).toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Score Breakdown</h4>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <div className="font-semibold">Total Score: {score.toFixed(1)}</div>
            
            {scoreBreakdown.length > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="font-medium">Contributing Factors:</div>
                {scoreBreakdown.map(([factor, value]) => (
                  <div key={factor} className="flex justify-between">
                    <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className={`font-medium ${(value as number) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(value as number) > 0 ? `+${(value as number).toFixed(1)}` : (value as number).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                This score represents how well this article matches your preferences based on therapeutic areas, 
                clinical trial phases, study status, and article recency.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Global AI Debug Panel Component - always visible 
function GlobalAIDebugPanel({ 
  userPreferences, 
  newsScores, 
  aiActive 
}: { 
  userPreferences: StudyPreferences | null; 
  newsScores: Map<string, number>;
  aiActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  
  if (!userPreferences) return null;
  
  // Get average and top scores for display
  const scores = Array.from(newsScores.values());
  const avgScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0;
  const maxScore = scores.length > 0 
    ? Math.max(...scores) 
    : 0;
  
  // Get score distribution
  const distribution = {
    high: scores.filter(s => s > 50).length,
    medium: scores.filter(s => s >= 20 && s <= 50).length,
    low: scores.filter(s => s < 20).length
  };
  
  if (!visible) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="fixed bottom-4 left-4 bg-primary text-white p-2 rounded-full shadow-lg z-50"
      >
        <Info className="h-5 w-5" />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
      <div className="p-3 border-b flex items-center justify-between bg-primary/10">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Debug Information</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
          <button 
            onClick={() => setVisible(false)} 
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className={`p-3 space-y-3 text-xs ${expanded ? '' : 'hidden'}`}>
        <div className="space-y-1">
          <h4 className="font-medium">User Information</h4>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div><strong>User ID:</strong> {userPreferences.userId}</div>
            <div><strong>AI Filter:</strong> {aiActive ? 'Active' : 'Inactive'}</div>
            <div><strong>Read Articles:</strong> {userPreferences.readArticles?.length || 0}</div>
            <div><strong>Last Updated:</strong> {new Date(userPreferences.lastUpdated || '').toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-1">
          <h4 className="font-medium">User Preferences</h4>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div>
              <strong>Therapeutic Areas:</strong> 
              <div className="flex flex-wrap gap-1 mt-1">
                {userPreferences.therapeuticAreas.map(area => (
                  <span key={area} className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1">
              <strong>Phases:</strong> 
              <div className="flex flex-wrap gap-1 mt-1">
                {userPreferences.phases.map(phase => (
                  <span key={phase} className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                    {phase}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1">
              <strong>Statuses:</strong> 
              <div className="flex flex-wrap gap-1 mt-1">
                {userPreferences.status.map(status => (
                  <span key={status} className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">
                    {status}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <h4 className="font-medium">AI Score Statistics</h4>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div><strong>Total Scored Articles:</strong> {scores.length}</div>
            <div><strong>Average Score:</strong> {avgScore.toFixed(1)}</div>
            <div><strong>Highest Score:</strong> {maxScore.toFixed(1)}</div>
            <div><strong>Score Distribution:</strong></div>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                {scores.length > 0 && (
                  <>
                    <div className="bg-green-500 h-2 rounded-l-full" 
                      style={{ width: `${(distribution.high / scores.length) * 100}%` }} />
                    <div className="bg-yellow-500 h-2" 
                      style={{ width: `${(distribution.medium / scores.length) * 100}%` }} />
                    <div className="bg-red-500 h-2 rounded-r-full" 
                      style={{ width: `${(distribution.low / scores.length) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Low: {distribution.low}</span>
              <span>Medium: {distribution.medium}</span>
              <span>High: {distribution.high}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to group tags by relevance - improve tag navigation
function getRelevantTagGroups(tags: string[]): Record<string, string[]> {
  // Common therapeutic areas and medical topics for grouping
  const groups: Record<string, string[]> = {
    'Therapeutic Areas': [],
    'Study Phases': [],
    'Study Status': [],
    'Drug Classes': [],
    'Conditions': [],
    'Other': []
  };
  
  // Mapping keywords to detect tag categories
  const tagMappings = {
    'Therapeutic Areas': ['oncology', 'cardio', 'neuro', 'immun', 'rare', 'disease', 'syndrome', 'ology', 'therapy'],
    'Study Phases': ['phase', 'early', 'late', 'clinical', 'fda', 'approval', 'trial'],
    'Study Status': ['recruit', 'enroll', 'active', 'complet', 'suspend', 'withdrawn', 'terminat', 'ongoing'],
    'Drug Classes': ['inhibitor', 'antibody', 'biologic', 'kinase', 'blocker', 'agonist', 'antagonist', 'mab', 'anti-'],
    'Conditions': ['cancer', 'tumor', 'disease', 'disorder', 'syndrome', 'injury', 'deficiency']
  };
  
  // Categorize each tag
  tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    let assigned = false;
    
    // Check which group this tag belongs to
    for (const [groupName, keywords] of Object.entries(tagMappings)) {
      if (keywords.some(keyword => lowerTag.includes(keyword))) {
        groups[groupName].push(tag);
        assigned = true;
        break;
      }
    }
    
    // If not assigned to any specific group, put in Other
    if (!assigned) {
      groups['Other'].push(tag);
    }
  });
  
  // Remove empty groups and sort tags within groups
  return Object.fromEntries(
    Object.entries(groups)
      .filter(([_, groupTags]) => groupTags.length > 0)
      .map(([groupName, groupTags]) => [
        groupName, 
        groupTags.sort()
      ])
  );
}

export default function NewsPage() {
  const { user, isLoaded } = useUser();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<NewsSource[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<StudyPreferences | null>(null);
  const [newsScores, setNewsScores] = useState<Map<string, number>>(new Map());
  const [aiRecommendationsActive, setAiRecommendationsActive] = useState(false);
  const [tagGroups, setTagGroups] = useState<Record<string, string[]>>({});
  const [highlyRecommendedThreshold, setHighlyRecommendedThreshold] = useState<number>(65);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  // Fetch user preferences
  useEffect(() => {
    if (isLoaded && user) {
      const loadUserPreferences = async () => {
        try {
          const prefs = await getUserPreferences(user.id);
          setUserPreferences(prefs);
        } catch (err) {
          console.error('Error loading user preferences:', err);
        }
      };
      
      loadUserPreferences();
    }
  }, [isLoaded, user]);

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

  // Extract and organize all unique tags from news items
  useEffect(() => {
    if (news.length > 0) {
      const allTags = news.reduce((acc, item) => {
        item.tags.forEach(tag => {
          if (!acc.includes(tag)) {
            acc.push(tag);
          }
        });
        return acc;
      }, [] as string[]);
      
      // Sort tags alphabetically by default
      const sortedTags = [...allTags].sort();
      setActiveTags(sortedTags);
      
      // Group tags by relevance
      const groups = getRelevantTagGroups(sortedTags);
      setTagGroups(groups);
    }
  }, [news]);

  // Apply filters to news
  useEffect(() => {
    if (news.length === 0) return;
    
    console.log('Applying filters to news items, total news:', news.length);
    let filtered = [...news];
    
    // Apply source filter
    if (selectedSources.length > 0) {
      console.log('Filtering by sources:', selectedSources);
      filtered = filtered.filter(item => selectedSources.includes(item.source));
      console.log('After source filter:', filtered.length);
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      console.log('Filtering by categories:', selectedCategories);
      filtered = filtered.filter(item => 
        item.categories.some(cat => selectedCategories.includes(cat))
      );
      console.log('After category filter:', filtered.length);
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      console.log('Filtering by tags:', selectedTags);
      filtered = filtered.filter(item =>
        item.tags.some(tag => selectedTags.includes(tag))
      );
      console.log('After tag filter:', filtered.length);
    }
    
    // Apply search query filter
    if (searchQuery) {
      console.log('Filtering by search query:', searchQuery);
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
      console.log('After search filter:', filtered.length);
    }
    
    // Calculate AI scores if preferences exist
    let itemsWithScores: Array<{item: NewsItem, score: number}> = [];
    
    if (userPreferences) {
      // Calculate scores for all filtered items
      itemsWithScores = filtered.map(item => ({
        item,
        score: calculateNewsRelevanceScore(item, userPreferences)
      }));
      
      // If AI recommendations are active, sort by score and filter out low scores
      if (aiRecommendationsActive) {
        console.log('AI recommendations active, sorting by relevance score');
        itemsWithScores = itemsWithScores
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score);
        
        // Extract just the items for display
        filtered = itemsWithScores.map(({ item }) => item);
      } else {
        // Sort by date (newest first) when AI recommendations not active
        filtered.sort((a, b) => {
          const dateA = new Date(a.publishedAt);
          const dateB = new Date(b.publishedAt);
          return dateB.getTime() - dateA.getTime();
        });
      }
    } else {
      // Sort by date if no user preferences
      filtered.sort((a, b) => {
        const dateA = new Date(a.publishedAt);
        const dateB = new Date(b.publishedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    console.log('Final filtered news count:', filtered.length);
    setFilteredNews(filtered);
    
    // Create a map of items to their scores for rendering
    if (itemsWithScores.length > 0) {
      const scoreMap = new Map<string, number>();
      const allScores = itemsWithScores.map(item => item.score);
      
      // Calculate threshold for "Highly Recommended" - use the 80th percentile
      // or if there are fewer than 5 items, just use the highest score
      let threshold = 0;
      if (allScores.length > 0) {
        allScores.sort((a, b) => b - a); // Sort descending
        if (allScores.length >= 5) {
          // Use 80th percentile for larger sets
          const percentileIndex = Math.floor(allScores.length * 0.2); // Top 20%
          threshold = allScores[percentileIndex];
        } else {
          // For smaller sets, use 85% of the max score
          threshold = allScores[0] * 0.85;
        }
      }
      
      // Add a minimum absolute threshold to ensure only genuinely good matches are "Highly Recommended"
      threshold = Math.max(threshold, 40);
      
      // Update the threshold state
      setHighlyRecommendedThreshold(threshold);
      
      itemsWithScores.forEach(({item, score}) => {
        scoreMap.set(item.id, score);
      });
      setNewsScores(scoreMap);
    }
  }, [news, selectedSources, selectedCategories, selectedTags, searchQuery, aiRecommendationsActive, userPreferences]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to load news data...');
      
      // Fetch news items
      const newsFilter: NewsFilter = {
        sources: selectedSources.length ? selectedSources : undefined,
        categories: selectedCategories.length ? selectedCategories : undefined,
        tags: selectedTags.length ? selectedTags : undefined,
        searchQuery: searchQuery || undefined,
        page: 1,
        pageSize: 100
      };
      
      console.log('Fetching news with filter:', newsFilter);
      const response = await fetchNews(newsFilter);
      console.log('News response received:', response);
      
      if (response && response.items) {
        const newsItems = response.items;
        setNews(newsItems);
        setFilteredNews(newsItems); // Also set filtered news directly
        
        // Extract all unique tags from the news items
        const tags = Array.from(new Set(
          newsItems.flatMap(item => item.tags || [])
        )).sort();
        
        setActiveTags(tags);
        
        // If user preferences exist, calculate AI scores
        if (userPreferences) {
          const scoreMap = new Map<string, number>();
          
          newsItems.forEach(item => {
            const score = calculateNewsRelevanceScore(item, userPreferences);
            scoreMap.set(item.id, score);
          });
          
          setNewsScores(scoreMap);
        }
      } else {
        console.error('Invalid news response:', response);
        setError('Failed to load news. Please try again later.');
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Error loading news data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

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

  const toggleAiRecommendations = () => {
    setAiRecommendationsActive(prev => !prev);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSources([]);
    setSelectedCategories([]);
    setSelectedTags([]);
    setAiRecommendationsActive(false);
  };

  // Get related tags based on current selections
  const getRelatedTags = () => {
    if (news.length === 0 || selectedTags.length === 0) return [];
    
    // Find articles that match current tag selection
    const matchingArticles = news.filter(item => 
      selectedTags.some(tag => item.tags.includes(tag))
    );
    
    // Count co-occurrences of other tags with selected tags
    const tagCooccurrences: Record<string, number> = {};
    
    matchingArticles.forEach(item => {
      item.tags.forEach(tag => {
        if (!selectedTags.includes(tag)) {
          tagCooccurrences[tag] = (tagCooccurrences[tag] || 0) + 1;
        }
      });
    });
    
    // Sort by co-occurrence count and return top related tags
    return Object.entries(tagCooccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  };
  
  const relatedTags = getRelatedTags();

  // Replace the existing "Available Tags" section with this improved version
  const renderTagsSection = () => {
    if (activeTags.length === 0) return null;
    
    return (
      <div className="flex flex-col space-y-2">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="w-full text-xs font-medium text-gray-700">Selected Tags:</div>
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer bg-primary/20 text-primary hover:bg-primary/30"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
        
        {/* Related Tags - only show if there are selected tags */}
        {selectedTags.length > 0 && relatedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="w-full text-xs font-medium text-gray-700">Related Tags:</div>
            <div className="flex flex-wrap gap-1">
              {relatedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Tag Groups */}
        <div className="flex flex-col space-y-2">
          <div className="w-full text-xs font-medium text-gray-700">Browse Tags by Category:</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(tagGroups).map(([groupName, tags]) => (
              <div key={groupName} className="border border-gray-200 rounded-md">
                <div className="p-2 bg-gray-50 text-xs font-medium text-gray-700">
                  {groupName} ({tags.length})
                </div>
                <div className="p-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`cursor-pointer ${
                        selectedTags.includes(tag) 
                          ? 'bg-gray-200 text-gray-800' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleReadMoreClick = (item: NewsItem) => {
    setSelectedArticle(item);
    setIsArticleModalOpen(true);
  };
  
  const handleCloseArticleModal = () => {
    setIsArticleModalOpen(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
        {userPreferences && (
          <Button 
            onClick={toggleAiRecommendations}
            className={`ml-auto transition-all ${
              aiRecommendationsActive
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200'
            }`}
          >
            <Bot className="mr-2 h-4 w-4" />
            AI Recommendations
          </Button>
        )}
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
                disabled={!searchQuery && !selectedSources.length && !selectedCategories.length && !selectedTags.length && !aiRecommendationsActive}
                className="whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {/* AI Recommendations Filter */}
              <Badge
                className={`cursor-pointer transition-all ${
                  aiRecommendationsActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                    : userPreferences 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100'
                      : 'bg-gray-100 text-gray-400 opacity-50'
                }`}
                onClick={() => userPreferences && toggleAiRecommendations()}
              >
                <Bot className="mr-1 h-3 w-3" />
                AI Recommendations
                {aiRecommendationsActive && (
                  <X className="ml-1 h-3 w-3 text-white" onClick={(e) => {
                    e.stopPropagation();
                    setAiRecommendationsActive(false);
                  }} />
                )}
              </Badge>

              {/* Top Priority Source Filters - FDA and International */}
              <Badge 
                key="FDA"
                className={`cursor-pointer ${
                  selectedSources.includes('FDA' as NewsSource) 
                    ? sourceLabels['FDA'].color 
                    : sourceLabels['FDA'].lightColor
                }`}
                onClick={() => handleSourceClick('FDA')}
              >
                {sourceLabels['FDA'].label}
                {selectedSources.includes('FDA' as NewsSource) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>

              <Badge 
                key="INTERNATIONAL"
                className={`cursor-pointer ${
                  selectedSources.includes('INTERNATIONAL' as NewsSource) 
                    ? sourceLabels['INTERNATIONAL'].color 
                    : sourceLabels['INTERNATIONAL'].lightColor
                }`}
                onClick={() => handleSourceClick('INTERNATIONAL')}
              >
                {sourceLabels['INTERNATIONAL'].label}
                {selectedSources.includes('INTERNATIONAL' as NewsSource) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>

              {/* Key Category Pills - Most important categories */}
              <Badge
                key="DRUG_APPROVAL"
                className={`cursor-pointer ${
                  selectedCategories.includes('DRUG_APPROVAL' as NewsCategory) 
                    ? categoryLabels['DRUG_APPROVAL'].color 
                    : categoryLabels['DRUG_APPROVAL'].lightColor
                }`}
                onClick={() => handleCategoryClick('DRUG_APPROVAL')}
              >
                {categoryLabels['DRUG_APPROVAL'].label}
                {selectedCategories.includes('DRUG_APPROVAL' as NewsCategory) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>

              <Badge
                key="SAFETY_ALERT"
                className={`cursor-pointer ${
                  selectedCategories.includes('SAFETY_ALERT' as NewsCategory) 
                    ? categoryLabels['SAFETY_ALERT'].color 
                    : categoryLabels['SAFETY_ALERT'].lightColor
                }`}
                onClick={() => handleCategoryClick('SAFETY_ALERT')}
              >
                {categoryLabels['SAFETY_ALERT'].label}
                {selectedCategories.includes('SAFETY_ALERT' as NewsCategory) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
              
              {/* All remaining visible categories */}
              {Object.entries(categoryLabels)
                .filter(([category]) => !['DRUG_APPROVAL', 'SAFETY_ALERT'].includes(category))
                .map(([category, { label, color, lightColor }]) => (
                  <Badge
                    key={category}
                    className={`cursor-pointer ${
                      selectedCategories.includes(category as NewsCategory) 
                        ? color 
                        : lightColor
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

            {/* Source Filters - All remaining sources */}
            {/* Hidden for now, but kept for debugging */}
            <div className="hidden">
              {Object.entries(sourceLabels)
                .filter(([source]) => !['FDA', 'INTERNATIONAL'].includes(source))
                .map(([source, { label, color, lightColor }]) => (
                  <Badge 
                    key={source}
                    className={`cursor-pointer ${
                      selectedSources.includes(source as NewsSource) 
                        ? color 
                        : lightColor
                    }`}
                    onClick={() => handleSourceClick(source)}
                  >
                    {label}
                    {selectedSources.includes(source as NewsSource) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
            </div>

            {/* Replace the existing tags section with the new function call */}
            {renderTagsSection()}
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
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-8">
          {aiRecommendationsActive ? (
            <p className="text-gray-500">No personalized recommendations match your current filters.</p>
          ) : (
            <p className="text-gray-500">No news found matching your filters.</p>
          )}
        </div>
      ) : (
        <>
          {aiRecommendationsActive && (
            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200">
              <h2 className="text-lg font-medium text-indigo-800 flex items-center">
                <Bot className="h-5 w-5 mr-2 text-indigo-600" />
                AI Personalized News Recommendations
              </h2>
              <p className="text-sm text-indigo-700">
                Showing news sorted by relevance to your preferences. News items with higher AI scores are more closely matched to your interests.
              </p>
            </div>
          )}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNews.map(item => (
              <NewsCard
                key={item.id}
                item={item}
                onSourceClick={handleSourceClick}
                onCategoryClick={handleCategoryClick}
                onTagClick={handleTagClick}
                relevanceScore={newsScores.get(item.id) || 0}
                showAiScore={aiRecommendationsActive}
                highlyRecommendedThreshold={highlyRecommendedThreshold}
                onReadMoreClick={handleReadMoreClick}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Article Modal */}
      <ArticleModal
        isOpen={isArticleModalOpen}
        onClose={handleCloseArticleModal}
        newsItem={selectedArticle}
      />
    </div>
  );
} 