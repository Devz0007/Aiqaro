import { Bot } from 'lucide-react';
import { UserPreferences } from '@/types/news';
import { 
  getUserPreferences, 
  filterNewsByPreferences,
  filterAndScoreNewsByPreferences, 
  calculateNewsRelevanceScore 
} from '@/lib/services/user-preferences-service';

// State variables to add
const [aiRecommendationsActive, setAiRecommendationsActive] = useState(false);
const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
const [loadingPreferences, setLoadingPreferences] = useState(false);
const [newsScores, setNewsScores] = useState<Map<string, number>>(new Map<string, number>());

// useEffect to add for loading user preferences
useEffect(() => {
  async function loadUserPreferences() {
    if (loadingPreferences) return; // Prevent multiple loading attempts
    
    setLoadingPreferences(true);
    try {
      // For now we're using a fixed user ID since we're using mock data
      const prefs = await getUserPreferences('user-123');
      setUserPreferences(prefs);
    } catch (err) {
      console.error('Error loading user preferences:', err);
      // Don't use toast inside useEffect to avoid dependency issues
    } finally {
      setLoadingPreferences(false);
    }
  }
  
  loadUserPreferences();
}, [loadingPreferences]); // Only depend on loadingPreferences to prevent loops

// Logic to add to the filter useEffect
// Or score and apply AI filtering if active
else if (aiRecommendationsActive && userPreferences) {
  // Calculate scores for all items
  itemsWithScores = filtered.map(item => ({
    item,
    score: calculateNewsRelevanceScore(item, userPreferences)
  }));
  
  // Filter out negative scores and sort by relevance
  itemsWithScores = itemsWithScores
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Extract just the items for display
  filtered = itemsWithScores.map(({ item }) => item);

  // Create a map of items to their scores for rendering
  if (itemsWithScores.length > 0) {
    const scoreMap = new Map<string, number>();
    itemsWithScores.forEach(({item, score}) => {
      scoreMap.set(item.id, score);
    });
    setNewsScores(scoreMap);
  } else {
    setNewsScores(new Map<string, number>());
  }
}

// Add this function to toggle AI recommendations
const toggleAiRecommendations = () => {
  if (!userPreferences) {
    toast({
      title: "User preferences not loaded",
      description: "Please try again in a moment",
      variant: "destructive"
    });
    return;
  }
  
  setAiRecommendationsActive(!aiRecommendationsActive);
  // Reset to page 1 when AI mode is toggled
  setCurrentPage(1);
};

// UI elements to add - AI toggle button
<Button 
  onClick={toggleAiRecommendations}
  variant={aiRecommendationsActive ? "default" : "outline"}
  className="ml-auto"
  disabled={!userPreferences}
>
  <Bot className="mr-2 h-4 w-4" />
  AI Recommendations
</Button>

// UI element to show the AI score for each news card
{aiRecommendationsActive && showAiScore && newsScores.has(item.id) && (
  <div className="absolute top-0 right-0 bg-primary text-primary-foreground py-1 px-2 rounded-bl-md text-xs font-medium">
    AI Score: {newsScores.get(item.id)?.toFixed(0)}
  </div>
)} 