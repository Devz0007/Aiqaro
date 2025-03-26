import { UserPreferences, NewsSource, NewsCategory, NewsItem } from '@/types/news';

// Mock user preferences for development/testing
const MOCK_USER_PREFERENCES: Record<string, UserPreferences> = {
  'default': {
    userId: 'default',
    preferredSources: ['PUBMED', 'DRUGS_COM', 'TRIAL_SITE'],
    preferredCategories: ['DRUG_APPROVAL', 'SAFETY_ALERT', 'CLINICAL_TRIAL'],
    preferredTags: ['COVID-19', 'Oncology', 'Cardiology'],
    interestedKeywords: ['artificial intelligence', 'oncology', 'clinical trials', 'diabetes'],
    excludedKeywords: [],
    readArticles: []
  }
};

// Expanded keywords map for semantic matching - this simulates AI expansion of keywords
const EXPANDED_KEYWORDS_MAP: Record<string, string[]> = {
  'artificial intelligence': [
    'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 'nlp', 
    'natural language processing', 'computer vision', 'predictive model', 
    'algorithm', 'data science', 'automation', 'chatbot', 'generative ai'
  ],
  'oncology': [
    'cancer', 'tumor', 'carcinoma', 'chemotherapy', 'radiation therapy', 
    'immunotherapy', 'leukemia', 'lymphoma', 'melanoma', 'metastasis', 
    'neoplasm', 'sarcoma', 'biopsy', 'remission', 'oncologist', 'breast cancer',
    'lung cancer', 'prostate cancer', 'ovarian cancer', 'colorectal cancer'
  ],
  'clinical trials': [
    'trial', 'study', 'phase 1', 'phase 2', 'phase 3', 'phase 4', 'phase i', 
    'phase ii', 'phase iii', 'phase iv', 'double-blind', 'placebo-controlled', 
    'randomized', 'enrollment', 'participant', 'subject', 'protocol', 'endpoint', 
    'efficacy', 'safety', 'investigational', 'intervention', 'cohort'
  ],
  'diabetes': [
    'type 1 diabetes', 'type 2 diabetes', 'insulin', 'glucose', 'blood sugar', 
    'hyperglycemia', 'hypoglycemia', 'a1c', 'metformin', 'glucagon', 'pancreas', 
    'endocrinology', 'insulin resistance', 'diabetic', 'glycemic control', 
    'ketoacidosis', 'gestational diabetes'
  ],
  'cardiology': [
    'heart', 'cardiac', 'cardiovascular', 'arrhythmia', 'hypertension', 
    'blood pressure', 'cholesterol', 'stroke', 'heart attack', 'myocardial infarction', 
    'angina', 'heart failure', 'atrial fibrillation', 'coronary artery disease', 
    'echocardiogram', 'stent', 'pacemaker', 'valve', 'bypass', 'ecg', 'ekg'
  ],
  'COVID-19': [
    'coronavirus', 'covid', 'sars-cov-2', 'pandemic', 'vaccine', 'vaccination',
    'pfizer', 'moderna', 'astrazeneca', 'johnson & johnson', 'j&j', 'booster',
    'variant', 'delta', 'omicron', 'long covid', 'quarantine', 'isolation',
    'mask', 'social distancing', 'ventilator', 'remdesivir', 'paxlovid'
  ],
};

// Weightings for different matching factors
const MATCH_WEIGHTS = {
  SOURCE: 10,         // Match on preferred source
  CATEGORY: 15,       // Match on preferred category
  TAG: 20,            // Match on preferred tag
  EXACT_KEYWORD: 25,  // Exact match on keyword
  EXPANDED_KEYWORD: 15, // Match on expanded keyword
  RECENCY: 5,         // Recency bonus (1-5 points)
  READ_PENALTY: -100   // Already read penalty
};

/**
 * Calculates a relevance score for a news item based on user preferences.
 * Higher scores indicate more relevant items.
 */
export function calculateNewsRelevanceScore(
  item: NewsItem,
  userPrefs: UserPreferences
): number {
  let score = 0;
  
  // Penalty for already read articles
  if (userPrefs.readArticles?.includes(item.id)) {
    return MATCH_WEIGHTS.READ_PENALTY;
  }
  
  // Source match
  if (userPrefs.preferredSources?.includes(item.source)) {
    score += MATCH_WEIGHTS.SOURCE;
  }
  
  // Category match - score for each matching category
  if (userPrefs.preferredCategories?.length) {
    const categoryMatches = item.categories.filter(cat => 
      userPrefs.preferredCategories?.includes(cat)
    ).length;
    score += categoryMatches * MATCH_WEIGHTS.CATEGORY;
  }
  
  // Tag match - score for each matching tag
  if (userPrefs.preferredTags?.length) {
    const tagMatches = item.tags.filter(tag =>
      userPrefs.preferredTags?.some(pt => 
        pt.toLowerCase() === tag.toLowerCase())
    ).length;
    score += tagMatches * MATCH_WEIGHTS.TAG;
  }
  
  // Content for keyword matching
  const content = `${item.title} ${item.description} ${item.content}`.toLowerCase();
  
  // Exact keyword matching
  if (userPrefs.interestedKeywords?.length) {
    for (const keyword of userPrefs.interestedKeywords) {
      const lcKeyword = keyword.toLowerCase();
      
      // Check for exact matches
      if (content.includes(lcKeyword)) {
        score += MATCH_WEIGHTS.EXACT_KEYWORD;
        
        // Boost score based on how many times it appears (diminishing returns)
        const matches = content.split(lcKeyword).length - 1;
        if (matches > 1) {
          score += Math.min(matches - 1, 3) * 5; // Up to 15 extra points
        }
      }
      
      // Check for expanded keyword matches
      if (EXPANDED_KEYWORDS_MAP[keyword]) {
        for (const expandedKeyword of EXPANDED_KEYWORDS_MAP[keyword]) {
          if (content.includes(expandedKeyword.toLowerCase())) {
            score += MATCH_WEIGHTS.EXPANDED_KEYWORD;
            break; // Only count once per expanded keyword set
          }
        }
      }
    }
  }
  
  // Excluded keywords - major penalty for each match
  if (userPrefs.excludedKeywords?.length) {
    for (const keyword of userPrefs.excludedKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score -= 50; // Strong penalty
      }
    }
  }
  
  // Recency bonus - newer articles get a slight boost
  const pubDate = new Date(item.publishedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) {
    score += MATCH_WEIGHTS.RECENCY; // Today or yesterday
  } else if (daysDiff <= 3) {
    score += MATCH_WEIGHTS.RECENCY - 1; // 2-3 days old
  } else if (daysDiff <= 7) {
    score += MATCH_WEIGHTS.RECENCY - 2; // This week
  } else if (daysDiff <= 14) {
    score += MATCH_WEIGHTS.RECENCY - 3; // Last two weeks
  } else if (daysDiff <= 30) {
    score += MATCH_WEIGHTS.RECENCY - 4; // This month
  }
  
  return score;
}

/**
 * Get user preferences - currently returns mock data
 * In a real app, this would fetch from Supabase or another database
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock data for now
  return {
    ...MOCK_USER_PREFERENCES.default,
    userId
  };
}

/**
 * Filters and scores news items based on user preferences
 * Returns items sorted by relevance score
 */
export function filterAndScoreNewsByPreferences(
  allNews: NewsItem[],
  userPrefs: UserPreferences
): NewsItem[] {
  // Calculate score for each item
  const scoredItems = allNews.map(item => ({
    item,
    score: calculateNewsRelevanceScore(item, userPrefs)
  }));
  
  // Filter out negative scores (irrelevant or excluded items)
  const relevantItems = scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score); // Sort by score (highest first)
  
  // Return just the items, sorted by score
  return relevantItems.map(({ item }) => item);
}

/**
 * Legacy function - keeps existing behavior but uses the new scoring system
 */
export function filterNewsByPreferences(
  allNews: NewsItem[],
  userPrefs: UserPreferences
): NewsItem[] {
  return filterAndScoreNewsByPreferences(allNews, userPrefs);
}

/**
 * Record that a user has read an article
 * In a real app, this would update the database
 */
export async function recordReadArticle(userId: string, articleId: string): Promise<boolean> {
  // In a real implementation, this would update the database
  console.log(`Recorded that user ${userId} read article ${articleId}`);
  return true;
} 