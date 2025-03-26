import { UserPreferences, NewsSource, NewsCategory, NewsItem } from '@/types/news';
// Remove Supabase imports since we'll use mock data
// import { supabase } from '@/lib/supabase/client';
// import { SupabaseClient } from '@supabase/supabase-js';

// Actual user preferences structure based on the database
export interface StudyPreferences {
  userId: string;
  phases: string[];       // Study phases like "Phase 1", "Phase 2", etc.
  status: string[];       // Study status like "Recruiting", "Completed", etc.
  therapeuticAreas: string[]; // Therapeutic areas like "Oncology", "Cardiology", etc.
  readArticles?: string[];    // Optional tracking of read articles
  lastUpdated?: string;
}

// Weight factors for calculating relevance
export const MATCH_WEIGHTS = {
  THERAPEUTIC_AREA_MATCH: 35,    // Highest priority - matches user's medical interests
  PHASE_MATCH: 25,                // Medium priority - matches user's preferred study phases
  STATUS_MATCH: 20,               // Lower priority - matches user's preferred study statuses
  TAG_MATCH: 15,                  // General tag match
  CATEGORY_MATCH: 10,             // Category match
  SOURCE_MATCH: 8,                // Source match (e.g., preferring FDA over other sources)
  RECENCY_FACTOR: 15,             // Bonus for recent articles (max 15 points for news < 1 week old)
  TITLE_MATCH_MULTIPLIER: 1.5,    // Multiplier for matches in the title (more prominent)
  EXACT_MATCH_BONUS: 10           // Bonus for exact therapeutic area matches
};

// Expanded keyword mappings for matching therapeutic areas with more specific conditions
export const THERAPEUTIC_AREA_KEYWORDS: Record<string, string[]> = {
  'oncology': [
    'cancer', 'oncology', 'tumor', 'carcinoma', 'leukemia', 'lymphoma', 'melanoma', 'neoplasm',
    'metastatic', 'sarcoma', 'myeloma', 'glioblastoma', 'immunotherapy', 'chemotherapy', 'radiation therapy',
    'targeted therapy', 'oncolytic', 'malignant', 'biopsy', 'remission', 'oncogene', 'pd-1', 'pd-l1',
    'checkpoint inhibitor', 'cart-t', 'car-t', 'tki', 'tyrosine kinase', 'her2', 'brca', 'egfr', 'alk',
    'breast cancer', 'lung cancer', 'colorectal cancer', 'prostate cancer', 'pancreatic cancer'
  ],
  'cardiology': [
    'heart', 'cardiac', 'cardiovascular', 'hypertension', 'atherosclerosis', 'stroke', 'arrhythmia',
    'myocardial infarction', 'heart attack', 'heart failure', 'coronary artery', 'atrial fibrillation',
    'ventricular', 'angina', 'cholesterol', 'statin', 'anticoagulant', 'beta blocker', 'thrombosis',
    'pacemaker', 'defibrillator', 'valve', 'cardiomyopathy', 'aortic', 'pulmonary hypertension',
    'cardiac arrest', 'tachycardia', 'bradycardia', 'congestive heart failure', 'chf',
    'acute coronary syndrome', 'acs', 'stent', 'angioplasty', 'cabg', 'bypass surgery'
  ],
  'neurology': [
    'brain', 'neural', 'neurology', 'alzheimer', 'parkinson', 'dementia', 'epilepsy', 'seizure',
    'multiple sclerosis', 'ms', 'migraine', 'amyotrophic lateral sclerosis', 'als', 'huntington',
    'stroke', 'tbi', 'traumatic brain injury', 'concussion', 'neuropathy', 'neurodegenerative',
    'spinal cord', 'neurotransmitter', 'neurotoxicity', 'neurocognitive', 'neuropsychiatric',
    'neuroimaging', 'neuroplasticity', 'neuromodulation', 'cerebrospinal fluid', 'csf',
    'encephalopathy', 'myelopathy', 'neurodevelopmental', 'neuroprotective', 'neurological'
  ],
  'immunology': [
    'immune', 'immunology', 'autoimmune', 'allergy', 'inflammation', 'lupus', 'rheumatoid',
    'arthritis', 'psoriasis', 'inflammatory bowel disease', 'ibd', 'crohn', 'ulcerative colitis',
    'multiple sclerosis', 'type 1 diabetes', 'celiac', 'sjogren', 'scleroderma', 'vasculitis',
    'transplant rejection', 'graft-versus-host', 'gvhd', 'immunosuppressant', 'biologics',
    'tnf inhibitor', 'jak inhibitor', 'il-inhibitor', 'cytokine', 'immunotherapy',
    'immunomodulator', 'monoclonal antibody', 'mab', 'antibody drug', 'immune checkpoint',
    'immunoglobulin', 'igg', 'b cell', 't cell', 'nk cell', 'macrophage', 'neutrophil'
  ],
  'infectious_disease': [
    'infection', 'infectious', 'bacterial', 'viral', 'fungal', 'antibiotic', 'vaccine',
    'antimicrobial', 'antiviral', 'antifungal', 'antiparasitic', 'pathogen', 'virus',
    'bacteria', 'fungus', 'parasite', 'prion', 'epidemiology', 'epidemic', 'pandemic',
    'endemic', 'outbreak', 'contagious', 'transmission', 'immunization', 'hiv', 'aids',
    'hepatitis', 'tuberculosis', 'malaria', 'influenza', 'pneumonia', 'meningitis',
    'sepsis', 'urinary tract infection', 'uti', 'staphylococcus', 'mrsa', 'streptococcus',
    'e. coli', 'salmonella', 'clostridium difficile', 'c. diff', 'candida', 'aspergillus'
  ],
  'rare_diseases': [
    'rare', 'orphan', 'genetic', 'congenital', 'hereditary', 'mutation', 'syndrome',
    'lysosomal storage', 'enzyme replacement', 'genomic', 'chromosome', 'fabre', 'gaucher',
    'niemann-pick', 'pompe', 'mucopolysaccharidosis', 'mps', 'tay-sachs', 'cystic fibrosis',
    'spinal muscular atrophy', 'sma', 'duchenne muscular dystrophy', 'dmd', 'hemophilia',
    'sickle cell', 'thalassemia', 'phenylketonuria', 'pku', 'wilson disease',
    'fragile x', 'huntington', 'ataxia', 'amyloidosis', 'acromegaly', 'gigantism',
    'marfan', 'ehlers-danlos', 'primary immunodeficiency', 'scid', 'gene therapy'
  ],
  'endocrinology': [
    'diabetes', 'thyroid', 'hormone', 'endocrine', 'metabolism', 'obesity',
    'insulin', 'glucose', 'pituitary', 'adrenal', 'hypothalamus', 'pancreas',
    'hyperglycemia', 'hypoglycemia', 'type 1 diabetes', 'type 2 diabetes', 't1d', 't2d',
    'diabetic ketoacidosis', 'dka', 'hyperthyroidism', 'hypothyroidism', 'graves',
    'hashimoto', 'cushing', 'addison', 'acromegaly', 'gigantism', 'growth hormone',
    'testosterone', 'estrogen', 'progesterone', 'cortisol', 'aldosterone', 'prolactin',
    'gonadotropin', 'polycystic ovary syndrome', 'pcos', 'osteoporosis', 'hyperlipidemia',
    'metabolic syndrome', 'insulin resistance', 'hyperparathyroidism', 'hypoparathyroidism'
  ]
};

// Extended keyword mappings for study phases with more specific terminology
export const PHASE_KEYWORDS: Record<string, string[]> = {
  'PHASE1': [
    'phase 1', 'phase i', 'first-in-human', 'dose escalation', 'early phase', 'first in man',
    'safety study', 'initial dosing', 'dose ranging', 'human pharmacology', 'healthy volunteers',
    'dose-finding', 'maximum tolerated dose', 'mtd', 'single ascending dose', 'sad',
    'multiple ascending dose', 'mad', 'pilot study', 'pharmacokinetics', 'pk study',
    'pharmacodynamics', 'phase 1/2', 'phase i/ii'
  ],
  'PHASE2': [
    'phase 2', 'phase ii', 'proof of concept', 'efficacy study', 'dose finding',
    'exploratory', 'safety and efficacy', 'therapeutic exploratory', 'dose response',
    'expanded cohort', 'signal finding', 'early efficacy', 'phase 1b/2', 'phase 2a',
    'phase 2b', 'phase ii-a', 'phase ii-b', 'activity evaluation', 'efficacy signal'
  ],
  'PHASE3': [
    'phase 3', 'phase iii', 'pivotal', 'confirmatory', 'registration trial',
    'therapeutic confirmatory', 'approval trial', 'controlled trial', 'randomized control',
    'multi-center study', 'label expansion', 'comparative trial', 'non-inferiority',
    'superiority trial', 'phase 3a', 'phase 3b', 'pre-registration', 'new drug application',
    'nda', 'marketing authorization', 'maa', 'biologics license application', 'bla',
    'late stage clinical'
  ],
  'PHASE4': [
    'phase 4', 'phase iv', 'post-marketing', 'post-approval', 'real-world evidence',
    'surveillance study', 'registry', 'pharmacovigilance', 'long-term safety',
    'risk management', 'comparative effectiveness', 'post-authorization safety',
    'observational study', 'expanded access', 'compassionate use', 'real-world data',
    'effectiveness study', 'hta study', 'health economics', 'therapeutic use'
  ],
  'EARLY_PHASE': [
    'pre-clinical', 'preclinical', 'animal study', 'in vitro', 'laboratory', 'discovery',
    'lead optimization', 'target identification', 'target validation', 'hit-to-lead',
    'candidate selection', 'investigational new drug', 'ind', 'clinical trial application',
    'cta', 'toxicology', 'adme', 'absorption distribution metabolism excretion'
  ]
};

// Enhanced keyword mappings for study status with more specific terminology
export const STATUS_KEYWORDS: Record<string, string[]> = {
  'RECRUITING': [
    'recruiting', 'enrollment', 'enrolling', 'participant', 'subject',
    'actively recruiting', 'open for enrollment', 'seeking participants',
    'patient recruitment', 'current recruitment', 'screening participants',
    'accepting patients', 'inclusion criteria', 'eligibility criteria',
    'exclusion criteria', 'participate in trial', 'join study'
  ],
  'ACTIVE_NOT_RECRUITING': [
    'active', 'ongoing', 'in progress', 'underway', 'active not recruiting',
    'fully enrolled', 'enrollment complete', 'closed to enrollment',
    'follow-up ongoing', 'treatment ongoing', 'data collection ongoing',
    'participant follow-up', 'follow-up phase'
  ],
  'COMPLETED': [
    'completed', 'finished', 'concluded', 'results', 'study completion',
    'trial completion', 'data analysis', 'final analysis', 'publication',
    'published results', 'clinical study report', 'csr', 'trial outcome',
    'primary endpoint', 'secondary endpoint', 'study findings'
  ],
  'NOT_YET_RECRUITING': [
    'not yet recruiting', 'pending', 'planned', 'upcoming', 'opening soon',
    'preparation phase', 'site selection', 'site initiation', 'protocol development',
    'approved by ethical committee', 'irb approved', 'regulatory approval',
    'planned enrollment', 'anticipated start date'
  ],
  'SUSPENDED': [
    'suspended', 'hold', 'paused', 'interrupted', 'temporarily halted',
    'safety review', 'temporary suspension', 'safety concern', 'protocol violation',
    'administrative hold', 'regulatory hold', 'clinical hold'
  ],
  'TERMINATED': [
    'terminated', 'discontinued', 'stopped', 'halted', 'early termination',
    'premature termination', 'futility analysis', 'inadequate enrollment',
    'safety concern', 'lack of efficacy', 'business decision', 'funding issue',
    'strategic change', 'development discontinued'
  ],
  'WITHDRAWN': [
    'withdrawn', 'canceled', 'cancelled', 'withdrawn before enrollment',
    'withdrawn prior to enrollment', 'study withdrawn', 'trial withdrawal',
    'protocol withdrawal', 'investigator decision', 'sponsor decision'
  ],
  'ENROLLING_BY_INVITATION': [
    'enrolling by invitation', 'selected participants', 'invitation only',
    'selected sites', 'selected investigators', 'private enrollment',
    'restricted enrollment', 'selective recruitment', 'targeted enrollment'
  ]
};

// New: Source scoring preferences - which news sources to prioritize for different user preferences
export const SOURCE_PREFERENCES: Record<string, NewsSource[]> = {
  'oncology': ['FDA', 'PUBMED', 'DRUGS_COM'],
  'cardiology': ['FDA', 'PUBMED', 'DRUGS_COM'],
  'neurology': ['FDA', 'PUBMED', 'MEDICAL_DEVICE'],
  'rare_diseases': ['FDA', 'PUBMED', 'INTERNATIONAL'],
  'PHASE1': ['PUBMED', 'TRIAL_SITE', 'INTERNATIONAL'],
  'PHASE2': ['PUBMED', 'TRIAL_SITE', 'DRUGS_COM'],
  'PHASE3': ['FDA', 'DRUGS_COM', 'TRIAL_SITE'],
  'PHASE4': ['FDA', 'DRUGS_COM', 'INTERNATIONAL'],
  'RECRUITING': ['TRIAL_SITE', 'INTERNATIONAL', 'PUBMED']
};

// New: Important drug classes and contexts for matching therapeutic areas
export const DRUG_CLASS_KEYWORDS: Record<string, string[]> = {
  'oncology': ['tyrosine kinase inhibitor', 'kinase inhibitor', 'immune checkpoint inhibitor', 'monoclonal antibody', 'pd-1', 'pd-l1', 'cart-t', 'car-t', 'antibody-drug conjugate', 'proteasome inhibitor', 'braf inhibitor', 'egfr inhibitor', 'anti-angiogenic'],
  'cardiology': ['ace inhibitor', 'arb', 'beta blocker', 'calcium channel blocker', 'diuretic', 'anticoagulant', 'antiplatelet', 'statin', 'pcsk9 inhibitor', 'vasodilator', 'antiarrhythmic', 'sglt2 inhibitor', 'nitroglycerin'],
  'neurology': ['antiepileptic', 'anti-parkinsonian', 'dopamine agonist', 'nmda antagonist', 'cholinesterase inhibitor', 'gaba agonist', 'cgrp antagonist', 'glutamate modulator', 'serotonin agonist', 'glutamate antagonist'],
  'immunology': ['tnf inhibitor', 'il inhibitor', 'interleukin inhibitor', 'jak inhibitor', 'monoclonal antibody', 'il-17 inhibitor', 'il-23 inhibitor', 'glucocorticoid', 'steroid', 'dmard', 'biologic', 'immunomodulator'],
  'endocrinology': ['insulin', 'glp-1 agonist', 'sglt2 inhibitor', 'dpp-4 inhibitor', 'sulfonylurea', 'thiazolidinedione', 'tsh', 'growth hormone', 'gnrh agonist', 'somatostatin analogue', 'incretin mimetic'],
  'infectious_disease': ['antibiotic', 'antiviral', 'antifungal', 'antiparasitic', 'antiretroviral', 'vaccine', 'protease inhibitor', 'polymerase inhibitor', 'macrolide', 'fluoroquinolone', 'cephalosporin', 'penicillin']
};

// Cache for user preferences to avoid repeated API calls
const userPreferencesCache: Map<string, {data: StudyPreferences, timestamp: number}> = new Map();
const CACHE_TTL = 10000; // 10 seconds cache TTL - short enough to get fresh data, long enough to prevent request floods

// Debounce tracking
let pendingRequests: Record<string, Promise<StudyPreferences>> = {};

/**
 * Calculate a relevance score for a news item based on study preferences
 * Enhanced with more sophisticated scoring algorithm
 */
export function calculateNewsRelevanceScore(item: NewsItem, preferences: StudyPreferences): number {
  let score = 0;
  const matchDetails: Record<string, number> = {};
  
  // Get all text content for keyword matching
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const content = item.content.toLowerCase();
  const allText = `${title} ${description} ${content}`;
  
  // Helper function to check for keyword matches with title bonus
  const checkKeywordMatches = (text: string, keywords: string[], weight: number): number => {
    let matchScore = 0;
    for (const keyword of keywords) {
      // Check title first (higher value)
      if (title.includes(keyword.toLowerCase())) {
        matchScore += weight * MATCH_WEIGHTS.TITLE_MATCH_MULTIPLIER;
        break; // Only count once per keyword set
      }
      // Check all text
      else if (text.includes(keyword.toLowerCase())) {
        matchScore += weight;
        break; // Only count once per keyword set
      }
    }
    return matchScore;
  };
  
  // Check for therapeutic area matches (highest priority)
  if (preferences.therapeuticAreas && preferences.therapeuticAreas.length > 0) {
    let taScore = 0;
    
    preferences.therapeuticAreas.forEach(area => {
      // Normalize the area name for lookup
      const normalizedArea = area.toLowerCase().replace(/[_\s-]/g, '');
      
      // Direct match in categories or tags (exact match)
      if (item.tags.some(tag => tag.toLowerCase() === area.toLowerCase())) {
        taScore += MATCH_WEIGHTS.THERAPEUTIC_AREA_MATCH + MATCH_WEIGHTS.EXACT_MATCH_BONUS;
      }
      
      // Find the closest matching therapeutic area key
      let matchedArea = '';
      for (const key of Object.keys(THERAPEUTIC_AREA_KEYWORDS)) {
        const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, '');
        if (normalizedKey.includes(normalizedArea) || normalizedArea.includes(normalizedKey)) {
          matchedArea = key;
          break;
        }
      }
      
      // Use matched area or the original area if no match found
      const areaKey = matchedArea || area;
      const keywords = THERAPEUTIC_AREA_KEYWORDS[areaKey] || [];
      
      // Check for keyword matches in content
      taScore += checkKeywordMatches(allText, keywords, MATCH_WEIGHTS.THERAPEUTIC_AREA_MATCH * 0.7);
      
      // Check for related drug classes
      const drugClasses = DRUG_CLASS_KEYWORDS[areaKey.toLowerCase()] || [];
      taScore += checkKeywordMatches(allText, drugClasses, MATCH_WEIGHTS.THERAPEUTIC_AREA_MATCH * 0.5);
      
      // Check if news source is preferred for this therapeutic area
      const preferredSources = SOURCE_PREFERENCES[area.toLowerCase()] || [];
      if (preferredSources.includes(item.source)) {
        taScore += MATCH_WEIGHTS.SOURCE_MATCH;
      }
    });
    
    score += taScore;
    matchDetails['therapeuticArea'] = taScore;
  }
  
  // Check for phase matches (medium priority)
  if (preferences.phases && preferences.phases.length > 0) {
    let phaseScore = 0;
    
    preferences.phases.forEach(phase => {
      // Direct match in tags
      if (item.tags.some(tag => tag.toLowerCase() === phase.toLowerCase())) {
        phaseScore += MATCH_WEIGHTS.PHASE_MATCH;
      }
      
      // Check for keyword matches in content
      const keywords = PHASE_KEYWORDS[phase] || [];
      phaseScore += checkKeywordMatches(allText, keywords, MATCH_WEIGHTS.PHASE_MATCH * 0.6);
      
      // Check if news source is preferred for this phase
      const preferredSources = SOURCE_PREFERENCES[phase] || [];
      if (preferredSources.includes(item.source)) {
        phaseScore += MATCH_WEIGHTS.SOURCE_MATCH;
      }
    });
    
    score += phaseScore;
    matchDetails['phase'] = phaseScore;
  }
  
  // Check for status matches (lower priority)
  if (preferences.status && preferences.status.length > 0) {
    let statusScore = 0;
    
    preferences.status.forEach(status => {
      // Direct match in tags
      if (item.tags.some(tag => tag.toLowerCase() === status.toLowerCase())) {
        statusScore += MATCH_WEIGHTS.STATUS_MATCH;
      }
      
      // Check for keyword matches in content
      const keywords = STATUS_KEYWORDS[status] || [];
      statusScore += checkKeywordMatches(allText, keywords, MATCH_WEIGHTS.STATUS_MATCH * 0.6);
      
      // Check if news source is preferred for this status
      const preferredSources = SOURCE_PREFERENCES[status] || [];
      if (preferredSources.includes(item.source)) {
        statusScore += MATCH_WEIGHTS.SOURCE_MATCH;
      }
    });
    
    score += statusScore;
    matchDetails['status'] = statusScore;
  }
  
  // Special handling for DRUG_APPROVAL category if user is interested in Phase 3/4
  if (item.categories.includes('DRUG_APPROVAL') && 
      (preferences.phases.includes('PHASE3') || preferences.phases.includes('PHASE4'))) {
    const approvalBonus = MATCH_WEIGHTS.CATEGORY_MATCH * 2;
    score += approvalBonus;
    matchDetails['drugApproval'] = approvalBonus;
  }
  
  // Special handling for SAFETY_ALERT - important for all users
  if (item.categories.includes('SAFETY_ALERT')) {
    // Check if it's related to user's therapeutic areas
    const isRelevantSafetyAlert = preferences.therapeuticAreas.some(area => {
      const keywords = THERAPEUTIC_AREA_KEYWORDS[area] || [];
      return keywords.some(keyword => allText.includes(keyword.toLowerCase()));
    });
    
    if (isRelevantSafetyAlert) {
      const safetyBonus = MATCH_WEIGHTS.CATEGORY_MATCH * 3;
      score += safetyBonus;
      matchDetails['safetyAlert'] = safetyBonus;
    }
  }
  
  // Add bonus for recency - extremely recent news gets maximum bonus
  try {
    const publishDate = new Date(item.publishedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let recencyBonus = 0;
    if (daysDiff <= 1) { // Published today or yesterday
      recencyBonus = MATCH_WEIGHTS.RECENCY_FACTOR;
    } else if (daysDiff <= 3) { // Last few days
      recencyBonus = MATCH_WEIGHTS.RECENCY_FACTOR * 0.8;
    } else if (daysDiff <= 7) { // Within last week
      recencyBonus = MATCH_WEIGHTS.RECENCY_FACTOR * 0.5;
    } else if (daysDiff <= 14) { // Within last 2 weeks
      recencyBonus = MATCH_WEIGHTS.RECENCY_FACTOR * 0.3;
    }
    
    score += recencyBonus;
    matchDetails['recency'] = recencyBonus;
  } catch (e) {
    // Ignore date parse errors
  }
  
  // Apply penalty for already read articles
  if (preferences.readArticles && preferences.readArticles.includes(item.id)) {
    const readPenalty = -10;
    score += readPenalty;
    matchDetails['alreadyRead'] = readPenalty;
  }
  
  // Store match details for debugging if needed
  (item as any).scoreDetails = matchDetails;
  
  return Math.max(0, score); // Don't allow negative scores
}

/**
 * Mock data for development/testing - matches real database format more closely
 */
export const MOCK_STUDY_PREFERENCES: StudyPreferences = {
  userId: 'placeholder',
  phases: ['PHASE1', 'PHASE2'],
  status: ['RECRUITING', 'ENROLLING_BY_INVITATION'],
  therapeuticAreas: ['oncology', 'cardiology', 'neurology', 'rare_diseases'],
  readArticles: [], // Ensure this is initialized as an empty array
  lastUpdated: new Date().toISOString()
};

/**
 * Get user preferences from the database or API
 * With caching and debouncing to prevent repeated API calls
 */
export async function getUserPreferences(userId: string): Promise<StudyPreferences> {
  // Check cache first
  const cached = userPreferencesCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  
  // Check if there's already a pending request for this user
  if (userId in pendingRequests) {
    return pendingRequests[userId];
  }
  
  // Create a new promise for this request
  const requestPromise = (async () => {
    try {
      // Since we're having issues with Supabase, use mock data
      console.log('Using mock data for user preferences');
      
      // Create mock data with the user's ID
      const mockData = { ...MOCK_STUDY_PREFERENCES, userId };
      
      // Simulate a small delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Cache the mock data
      userPreferencesCache.set(userId, {
        data: mockData,
        timestamp: Date.now()
      });
      
      return mockData;
    } catch (error) {
      console.warn('Failed to load preferences, using mock data', error);
      
      // Cache the mock data too to prevent repeated API calls on failure
      const mockData = { ...MOCK_STUDY_PREFERENCES, userId };
      userPreferencesCache.set(userId, {
        data: mockData,
        timestamp: Date.now()
      });
      
      return mockData;
    } finally {
      // Remove the pending request
      delete pendingRequests[userId];
    }
  })();
  
  // Store the pending request
  pendingRequests[userId] = requestPromise;
  
  return requestPromise;
}

/**
 * Filter and score news based on user preferences
 */
export function filterAndScoreNewsByPreferences(
  news: NewsItem[],
  preferences: StudyPreferences,
  minScore = 0
): { items: NewsItem[], scores: Map<string, number> } {
  const scoreMap = new Map<string, number>();
  
  // Calculate scores for all items
  news.forEach(item => {
    const score = calculateNewsRelevanceScore(item, preferences);
    scoreMap.set(item.id, score);
  });
  
  // Filter to items with positive scores and sort by score
  const filteredItems = news
    .filter(item => (scoreMap.get(item.id) || 0) > minScore)
    .sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
  
  return {
    items: filteredItems,
    scores: scoreMap
  };
}

/**
 * Legacy function for compatibility
 */
export function filterNewsByPreferences(
  news: NewsItem[],
  preferences: StudyPreferences
): NewsItem[] {
  return filterAndScoreNewsByPreferences(news, preferences).items;
}

/**
 * Record that a user has read an article
 */
export async function recordReadArticle(userId: string, articleId: string): Promise<void> {
  try {
    // Get current preferences
    const preferences = await getUserPreferences(userId);
    
    // If already marked as read, don't do anything
    if (preferences.readArticles?.includes(articleId)) {
      return;
    }
    
    // Add to read articles
    const updatedReadArticles = [...(preferences.readArticles || []), articleId];
    
    // Since we're not using Supabase, just update the cache
    console.log(`Recording article ${articleId} as read for user ${userId}`);
    
    // Update mock data
    MOCK_STUDY_PREFERENCES.readArticles = MOCK_STUDY_PREFERENCES.readArticles || [];
    if (!MOCK_STUDY_PREFERENCES.readArticles.includes(articleId)) {
      MOCK_STUDY_PREFERENCES.readArticles.push(articleId);
    }
    
    // Update cache
    const cached = userPreferencesCache.get(userId);
    if (cached) {
      cached.data.readArticles = updatedReadArticles;
      cached.data.lastUpdated = new Date().toISOString();
    }
    
  } catch (error) {
    console.error('Error recording read article:', error);
  }
} 