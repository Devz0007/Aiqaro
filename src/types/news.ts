export type NewsCategory = 
  | 'DRUG_APPROVAL'
  | 'CLINICAL_TRIAL'
  | 'REGULATORY'
  | 'MEDICAL_DEVICE'
  | 'RESEARCH'
  | 'PHARMA'
  | 'SAFETY_ALERT';

export type NewsSource = 
  | 'FDA'
  | 'PUBMED'
  | 'DRUGS_COM'
  | 'MEDICAL_DEVICE'
  | 'TRIAL_SITE';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: NewsSource;
  categories: NewsCategory[];
  tags: string[];
}

export interface NewsFilter {
  searchQuery?: string;
  sources?: NewsSource[];
  categories?: NewsCategory[];
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface NewsResponse {
  items: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
} 