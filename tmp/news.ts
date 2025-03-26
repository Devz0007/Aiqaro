// User preferences for AI recommendations
export interface UserPreferences {
  userId: string;
  preferredSources?: NewsSource[];
  preferredCategories?: NewsCategory[];
  preferredTags?: string[];
  interestedKeywords?: string[];
  excludedKeywords?: string[];
  readArticles?: string[]; // IDs of articles the user has read
} 