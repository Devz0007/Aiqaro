import { NewsItem, NewsFilter, NewsResponse, NewsSource, NewsCategory } from '@/types/news';
import Parser from 'rss-parser';

const RSS2JSON_API_KEY = process.env.NEXT_PUBLIC_RSS2JSON_API_KEY;
const FDA_API_KEY = process.env.NEXT_PUBLIC_FDA_API_KEY;
const PUBMED_API_KEY = process.env.NEXT_PUBLIC_PUBMED_API_KEY;

const RSS_FEEDS = {
  // Drugs.com feeds
  DRUGS_MEDICAL_NEWS: 'https://www.drugs.com/feeds/medical_news.xml',
  DRUGS_HEADLINE_NEWS: 'https://www.drugs.com/feeds/headline_news.xml',
  DRUGS_FDA_ALERTS: 'https://www.drugs.com/feeds/fda_alerts.xml',
  DRUGS_NEW_APPROVALS: 'https://www.drugs.com/feeds/new_drug_approvals.xml',
  DRUGS_NEW_APPLICATIONS: 'https://www.drugs.com/feeds/new_drug_applications.xml',
  DRUGS_CLINICAL_TRIALS: 'https://www.drugs.com/feeds/clinical_trials.xml',
  // FDA feeds - updated with direct FDA URLs
  FDA_DRUGS: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml',
  FDA_DEVICES: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/medical-devices-rss-feed/rss.xml',
  FDA_MEDWATCH: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/medwatch/rss.xml',
  FDA_RECALLS: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml',
  FDA_PRESS: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml',
  FDA_BIOLOGICS: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/vaccines-blood-biologics/rss.xml',
  // European and international feeds
  EU_CLINICAL_TRIALS: 'https://www.europeanpharmaceuticalreview.com/topic/clinical-trials/feed/',
  IMDRF_NEWS: 'https://www.imdrf.org/news/feed',
  // Trial Site News
  TRIAL_SITE_NEWS: 'https://trialsitenews.com/feed',
  // PubMed feeds
  PUBMED_CLINICAL_TRIALS: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/clinical+trials+drug+development.xml',
  PUBMED_FDA: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/fda.xml',
};

// Content analysis patterns for smart categorization
const CATEGORY_PATTERNS = {
  DRUG_APPROVAL: [
    /approval/i, /approved/i, /fda approves/i, /granted/i, 
    /authorization/i, /authorized/i, /market authorization/i,
    /new drug/i, /newly approved/i, /clearance/i
  ],
  CLINICAL_TRIAL: [
    /trial/i, /phase [1-4]/i, /study results/i, /clinical study/i, 
    /efficacy/i, /participants/i, /patients enrolled/i, /clinical data/i,
    /cohort/i, /placebo/i, /randomized/i
  ],
  REGULATORY: [
    /regulatory/i, /regulation/i, /fda/i, /ema/i, /health canada/i,
    /submission/i, /guidance/i, /compliance/i, /pending/i, /requirement/i
  ],
  MEDICAL_DEVICE: [
    /device/i, /equipment/i, /implant/i, /diagnostic/i, /medical technology/i,
    /wearable/i, /imaging/i, /monitor/i, /sensor/i, /in vitro diagnostics/i
  ],
  RESEARCH: [
    /research/i, /study/i, /investigation/i, /finding/i, /discovery/i,
    /journal/i, /publication/i, /published/i, /scientific/i, /innovation/i
  ],
  PHARMA: [
    /pharma/i, /pharmaceutical/i, /drug maker/i, /manufacturer/i, /biotech/i,
    /company announces/i, /pipeline/i, /investment/i, /acquisition/i
  ],
  SAFETY_ALERT: [
    /alert/i, /warning/i, /recall/i, /adverse/i, /side effect/i, 
    /safety concern/i, /contraindication/i, /precaution/i, /risk/i, /danger/i
  ]
};

interface RSS2JSONResponse {
  status: string;
  feed: {
    url: string;
    title: string;
    link: string;
    description: string;
    image: string;
  };
  items: Array<{
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    description: string;
    content: string;
    enclosure?: {
      link: string;
      type: string;
      length: number;
    };
  }>;
}

// Helper function to determine the source type from the feed URL
function determineSourceFromUrl(feedUrl: string): NewsSource {
  if (feedUrl.includes('fda.gov')) {
    return 'FDA';
  } else if (feedUrl.includes('pubmed.ncbi.nlm.nih.gov')) {
    return 'PUBMED';
  } else if (feedUrl.includes('drugs.com')) {
    return 'DRUGS_COM';
  } else if (feedUrl.includes('europeanpharmaceuticalreview.com')) {
    return 'INTERNATIONAL';
  } else if (feedUrl.includes('imdrf.org')) {
    return 'INTERNATIONAL';
  } else if (feedUrl.includes('trialsitenews.com')) {
    return 'TRIAL_SITE';
  } else {
    return 'FDA'; // Default to FDA
  }
}

// Advanced tag extraction based on content analysis
function extractTags(content: string): string[] {
  const genericKeywords = [
    'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4',
    'Clinical Trial', 'FDA Approval', 'Safety Alert',
    'Drug Development', 'Medical Device', 'Research',
    'Regulatory', 'Pharma', 'Treatment', 'Study',
    'Results', 'Protocol', 'Enrollment', 'Recruitment',
    'Adverse Event', 'Efficacy', 'Safety', 'Breakthrough',
    'Emergency Use', 'Authorization', 'Approval',
  ];
  
  const allTags = genericKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return [...new Set(allTags)].slice(0, 10);
}

// Helper function to intelligently categorize content
function analyzeCategoriesFromContent(
  title: string, 
  description: string, 
  content: string, 
  feedUrl: string
): NewsCategory[] {
  const fullText = `${title} ${description} ${content}`.toLowerCase();
  const categories: NewsCategory[] = [];
  const feedBasedCategories: Record<string, NewsCategory[]> = {
    [RSS_FEEDS.DRUGS_NEW_APPROVALS]: ['DRUG_APPROVAL', 'REGULATORY'],
    [RSS_FEEDS.DRUGS_NEW_APPLICATIONS]: ['DRUG_APPROVAL', 'REGULATORY'],
    [RSS_FEEDS.DRUGS_FDA_ALERTS]: ['SAFETY_ALERT', 'REGULATORY'],
    [RSS_FEEDS.DRUGS_CLINICAL_TRIALS]: ['CLINICAL_TRIAL', 'RESEARCH'],
    [RSS_FEEDS.FDA_DRUGS]: ['REGULATORY', 'DRUG_APPROVAL'],
    [RSS_FEEDS.FDA_DEVICES]: ['MEDICAL_DEVICE', 'REGULATORY'],
    [RSS_FEEDS.FDA_MEDWATCH]: ['SAFETY_ALERT', 'REGULATORY'],
    [RSS_FEEDS.FDA_RECALLS]: ['SAFETY_ALERT', 'REGULATORY'],
    [RSS_FEEDS.FDA_PRESS]: ['REGULATORY'],
    [RSS_FEEDS.FDA_BIOLOGICS]: ['REGULATORY', 'RESEARCH'],
    [RSS_FEEDS.EU_CLINICAL_TRIALS]: ['CLINICAL_TRIAL', 'RESEARCH'],
    [RSS_FEEDS.IMDRF_NEWS]: ['MEDICAL_DEVICE', 'REGULATORY'],
    [RSS_FEEDS.TRIAL_SITE_NEWS]: ['CLINICAL_TRIAL', 'RESEARCH'],
  };

  // First add categories based on the feed URL
  if (feedUrl in feedBasedCategories) {
    categories.push(...feedBasedCategories[feedUrl]);
  }

  // Then analyze content for additional categories
  Object.entries(CATEGORY_PATTERNS).forEach(([category, patterns]) => {
    const categoryKey = category as NewsCategory;
    if (!categories.includes(categoryKey)) {
      const matchesPattern = patterns.some(pattern => pattern.test(fullText));
      if (matchesPattern) {
        categories.push(categoryKey);
      }
    }
  });

  // Ensure we have at least one category
  if (categories.length === 0) {
    if (feedUrl.includes('drugs.com')) {
      categories.push('PHARMA');
    } else if (feedUrl.includes('fda.gov')) {
      categories.push('REGULATORY');
    } else {
      categories.push('RESEARCH');
    }
  }

  return categories;
}

// Helper function to process RSS items
function processRssItems(items: any[], source: NewsSource): NewsItem[] {
  const processedItems: NewsItem[] = [];
  
  items.forEach(item => {
    try {
      // Check if item has title, link, and pubDate
      if (!item.title || !item.link) {
        return; // Skip items without required fields
      }
      
      // Create a unique ID based on link or guid
      const id = `${source}-${item.guid || item.link}`;
      
      // Initialize NewsItem with essential fields
      const newsItem: NewsItem = {
        id,
        title: item.title.trim(),
        description: (item.description || item.summary || '').trim(),
        content: (item.content || item.contentSnippet || '').trim(),
        url: item.link.trim(),
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        imageUrl: '',
        source,
        categories: [],
        tags: []
      };
      
      // Extract image URL if available
      if (item.enclosure?.url) {
        newsItem.imageUrl = item.enclosure.url;
      } else if (item['media:content'] && item['media:content'].length > 0) {
        newsItem.imageUrl = item['media:content'][0].$.url;
      } else if (item['media:thumbnail'] && item['media:thumbnail'].length > 0) {
        newsItem.imageUrl = item['media:thumbnail'][0].$.url;
      }
      
      // Add categories and tags based on content analysis
      newsItem.categories = analyzeCategoriesFromContent(
        newsItem.title,
        newsItem.description,
        newsItem.content,
        item.feedUrl || ''
      );
      
      // Extract tags from the content
      newsItem.tags = extractTags(newsItem.title + ' ' + newsItem.description + ' ' + newsItem.content);
      
      // Add the processed item
      processedItems.push(newsItem);
    } catch (error) {
      console.warn(`Error processing RSS item:`, error);
      // Continue processing other items
    }
  });
  
  return processedItems;
}

/**
 * Attempts to fetch and parse an RSS feed directly
 */
async function tryDirectRSSFetch(feedUrl: string): Promise<NewsItem[]> {
  console.log(`Attempting to fetch RSS feed: ${feedUrl}`);
  
  // Set up RSS parser
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'media:content', {keepArray: true}],
        ['media:thumbnail', 'media:thumbnail', {keepArray: true}]
      ]
    }
  });
  
  // Always use a CORS proxy for browser environments
  let finalUrl = feedUrl;
  try {
    if (typeof window !== 'undefined') {
      finalUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&api_key=${RSS2JSON_API_KEY}`;
      console.log(`Using RSS2JSON API for ${feedUrl}`);
      
      // Use the RSS2JSON API with better error handling
      try {
        const response = await fetch(finalUrl);
        
        // Handle non-OK responses without throwing errors that propagate to console
        if (!response.ok) {
          console.warn(`RSS2JSON API returned status ${response.status} for ${feedUrl} - trying fallback`);
          return []; // Return empty array instead of throwing
        }
        
        const data = await response.json() as RSS2JSONResponse;
        if (data.status !== 'ok') {
          console.warn(`RSS2JSON error: ${data.status} for ${feedUrl}`);
          return []; // Return empty array instead of throwing
        }
        
        // Convert RSS2JSON format to our NewsItem format
        return data.items.map(item => {
          // Generate a unique ID
          const id = `${determineSourceFromUrl(feedUrl)}-${item.guid || item.link}`;
          
          // Extract image URL from content if available
          let imageUrl = '';
          if (item.enclosure?.link) {
            imageUrl = item.enclosure.link;
          }
          
          // Create base news item
          const newsItem: NewsItem = {
            id,
            title: item.title,
            description: item.description || '',
            content: item.content || '',
            url: item.link,
            publishedAt: item.pubDate,
            imageUrl,
            source: determineSourceFromUrl(feedUrl),
            categories: [],
            tags: []
          };
          
          // Add categories and tags based on content analysis
          newsItem.categories = analyzeCategoriesFromContent(
            newsItem.title,
            newsItem.description,
            newsItem.content,
            feedUrl
          );
          
          // Extract tags from the content
          newsItem.tags = extractTags(newsItem.title + ' ' + newsItem.description + ' ' + newsItem.content);
          
          return newsItem;
        });
      } catch (e) {
        console.warn(`Error using RSS2JSON API for ${feedUrl}:`, e);
        // Continue to fallback without throwing console errors
        return [];
      }
    } else {
      // Server-side fetching
      const feed = await parser.parseURL(feedUrl);
      return processRssItems(feed.items || [], determineSourceFromUrl(feedUrl));
    }
  } catch (error) {
    console.warn(`Error fetching RSS feed ${feedUrl}:`, error);
    
    // Try with CORS proxy as fallback
    try {
      console.log(`Falling back to CORS proxy for ${feedUrl}`);
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`;
      const feed = await parser.parseURL(proxyUrl);
      return processRssItems(feed.items || [], determineSourceFromUrl(feedUrl));
    } catch (secondError) {
      console.warn(`All fetch attempts failed for ${feedUrl}`);
      return [];
    }
  }
}

/**
 * Fetches news from Drugs.com
 */
async function fetchDrugsComNews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching Drugs.com news...');
    
    // Define Drugs.com feed URLs
    const drugsComFeeds = [
      RSS_FEEDS.DRUGS_MEDICAL_NEWS,
      RSS_FEEDS.DRUGS_HEADLINE_NEWS,
      RSS_FEEDS.DRUGS_CLINICAL_TRIALS,
      RSS_FEEDS.DRUGS_NEW_APPROVALS
    ];
    
    // Process all feed promises in parallel with error handling for each
    const feedPromises = drugsComFeeds.map(feedUrl => 
      tryDirectRSSFetch(feedUrl).catch(error => {
        console.warn(`Error fetching Drugs.com feed ${feedUrl}: ${error.message}`);
        return [];
      })
    );
    
    // Wait for all promises to resolve
    const feedResults = await Promise.all(feedPromises);
    
    // Track all items to avoid duplicates
    const processedItems = new Map<string, NewsItem>();
    
    // Process each feed's items
    feedResults.forEach((items, index) => {
      const feedUrl = drugsComFeeds[index];
      
      console.log(`Processing ${items.length} items from ${feedUrl}`);
      
      items.forEach(item => {
        // Set source as DRUGS_COM
        item.source = 'DRUGS_COM';
        
        // Generate a stable key for deduplication
        const key = item.url || (item.title + item.publishedAt);
        
        // Only add if not already processed
        if (!processedItems.has(key)) {
          processedItems.set(key, item);
        }
      });
    });
    
    // Convert to array
    const allItems = Array.from(processedItems.values());
    
    console.log(`Successfully fetched ${allItems.length} unique Drugs.com news items.`);
    return allItems;
  } catch (error) {
    console.warn(`Error in fetchDrugsComNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Fetches news items from FDA sources
 */
async function fetchFDANews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching FDA news...');
    
    // Define FDA feed URLs
    const fdaFeeds = [
      RSS_FEEDS.FDA_DRUGS,
      RSS_FEEDS.FDA_DEVICES,
      RSS_FEEDS.FDA_RECALLS,
      RSS_FEEDS.FDA_PRESS,
      RSS_FEEDS.FDA_BIOLOGICS
    ];
    
    // Process all feed promises in parallel with error handling for each
    const feedPromises = fdaFeeds.map(feedUrl => 
      tryDirectRSSFetch(feedUrl).catch(error => {
        console.warn(`Error fetching FDA feed ${feedUrl}: ${error.message}`);
        return [];
      })
    );
    
    // Wait for all promises to resolve
    const feedResults = await Promise.all(feedPromises);
    
    // Track all items to avoid duplicates
    const processedItems = new Map<string, NewsItem>();
    
    // Process each feed's items
    feedResults.forEach((items, index) => {
      const feedUrl = fdaFeeds[index];
      
      console.log(`Processing ${items.length} items from ${feedUrl}`);
      
      items.forEach(item => {
        // Determine source based on feed URL
        let source: NewsSource = 'FDA';
        if (feedUrl === RSS_FEEDS.FDA_DEVICES) {
          source = 'MEDICAL_DEVICE';
          item.source = source;
        }
        
        // Generate a stable key for deduplication
        const key = item.url || (item.title + item.publishedAt);
        
        // Only add if not already processed
        if (!processedItems.has(key)) {
          processedItems.set(key, item);
        }
      });
    });
    
    // Convert to array
    const allItems = Array.from(processedItems.values());
    
    console.log(`Successfully fetched ${allItems.length} unique FDA news items.`);
    return allItems;
  } catch (error) {
    console.warn(`Error in fetchFDANews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Fetches news from PubMed sources using E-utilities API
 */
async function fetchPubMedNews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching PubMed news using E-utilities API...');
    
    // PubMed API key from environment variable
    const apiKey = PUBMED_API_KEY;
    const useApiKey = apiKey ? `&api_key=${apiKey}` : '';
    
    // Define search queries
    const searches = [
      {
        term: 'clinical trials drug development',
        category: 'CLINICAL_TRIAL' as NewsCategory
      },
      {
        term: 'fda approval drug',
        category: 'DRUG_APPROVAL' as NewsCategory
      }
    ];
    
    const allPubmedItems: NewsItem[] = [];
    
    // Execute each search in sequence to avoid rate limiting
    for (const search of searches) {
      try {
        // Step 1: Use ESearch to find article IDs
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(search.term)}&retmax=20&sort=date&retmode=json${useApiKey}`;
        
        console.log(`Fetching PubMed search results for: ${search.term}`);
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          console.warn(`PubMed search API returned status ${searchResponse.status} for term: ${search.term}`);
          continue;
        }
        
        const searchData = await searchResponse.json();
        const pmids = searchData.esearchresult?.idlist || [];
        
        if (pmids.length === 0) {
          console.warn(`No PubMed IDs found for search term: ${search.term}`);
          continue;
        }
        
        console.log(`Found ${pmids.length} PubMed IDs for term: ${search.term}`);
        
        // Step 2: Use ESummary to get article details
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json${useApiKey}`;
        
        const summaryResponse = await fetch(summaryUrl);
        
        if (!summaryResponse.ok) {
          console.warn(`PubMed summary API returned status ${summaryResponse.status}`);
          continue;
        }
        
        const summaryData = await summaryResponse.json();
        const result = summaryData.result || {};
        
        // Process each article
        for (const pmid of pmids) {
          if (!result[pmid]) continue;
          
          const article = result[pmid];
          
          // Create a unique ID
          const id = `PUBMED-${pmid}`;
          
          // Extract publication date
          let publishedAt = new Date().toISOString();
          try {
            if (article.pubdate) {
              publishedAt = new Date(article.pubdate).toISOString();
            }
          } catch (e) {
            console.warn(`Error parsing pubdate for article ${pmid}:`, e);
          }
          
          // Extract authors
          const authors = article.authors?.map((author: any) => author.name).join(', ') || '';
          
          // Create article URL
          const articleUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
          
          // Create news item
          const newsItem: NewsItem = {
            id,
            title: article.title || `PubMed Article ${pmid}`,
            description: article.description || article.title || '',
            content: article.description || article.title || '',
            url: articleUrl,
            publishedAt,
            source: 'PUBMED',
            categories: [search.category],
            tags: extractTags(article.title + ' ' + (article.description || ''))
          };
          
          // Add author information to content if available
          if (authors) {
            newsItem.content = `${newsItem.content}\n\nAuthors: ${authors}`;
          }
          
          // Categorize the content
          newsItem.categories = analyzeCategoriesFromContent(
            newsItem.title,
            newsItem.description,
            newsItem.content,
            'pubmed'
          );
          
          // Ensure the primary category from the search is included
          if (!newsItem.categories.includes(search.category)) {
            newsItem.categories.push(search.category);
          }
          
          allPubmedItems.push(newsItem);
        }
      } catch (e) {
        console.error(`Error processing PubMed search for term "${search.term}":`, e);
      }
      
      // Add a small delay between searches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Successfully fetched ${allPubmedItems.length} PubMed news items.`);
    return allPubmedItems;
    
  } catch (error) {
    console.warn(`Error in fetchPubMedNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Fetches news from Trial Site News
 */
async function fetchTrialSiteNews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching Trial Site News...');
    
    const trialSiteUrl = RSS_FEEDS.TRIAL_SITE_NEWS;
    
    // Try fetching the Trial Site RSS feed
    const items = await tryDirectRSSFetch(trialSiteUrl).catch(error => {
      console.warn(`Error fetching Trial Site feed: ${error.message}`);
      return [];
    });
    
    // Set the source correctly for all items
    const trialSiteItems = items.map(item => {
      item.source = 'TRIAL_SITE';
      return item;
    });
    
    // Log total count of successfully fetched items
    console.log(`Successfully fetched ${trialSiteItems.length} Trial Site news items.`);
    
    // Debug the items if there are none or very few
    if (trialSiteItems.length < 5) {
      console.warn('Very few or no Trial Site items found, debugging RSS feed issues.');
      // Try an alternative approach
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trialSiteUrl)}`;
        const parser = new Parser();
        const feed = await parser.parseURL(proxyUrl);
        
        if (feed.items && feed.items.length > 0) {
          console.log(`Found ${feed.items.length} items via proxy, processing them.`);
          const processedItems = processRssItems(feed.items, 'TRIAL_SITE');
          return processedItems;
        }
      } catch (e) {
        console.error('Alternative approach for Trial Site feed failed:', e);
      }
    }
    
    return trialSiteItems;
  } catch (error) {
    console.warn(`Error in fetchTrialSiteNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Fetches international news
 */
async function fetchInternationalNews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching international news...');
    
    // International feeds
    const internationalFeeds = [
      RSS_FEEDS.EU_CLINICAL_TRIALS,
      RSS_FEEDS.IMDRF_NEWS
    ];
    
    // Process all feed promises in parallel with error handling for each
    const feedPromises = internationalFeeds.map(feedUrl => 
      tryDirectRSSFetch(feedUrl).catch(error => {
        console.warn(`Error fetching international feed ${feedUrl}: ${error.message}`);
        return [];
      })
    );
    
    // Wait for all promises to resolve
    const feedResults = await Promise.all(feedPromises);
    
    // Combine all results
    const allItems = feedResults.flat().map(item => {
      item.source = 'INTERNATIONAL';
      return item;
    });
    
    console.log(`Successfully fetched ${allItems.length} international news items.`);
    return allItems;
  } catch (error) {
    console.warn(`Error in fetchInternationalNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Fetches medical device news
 */
async function fetchMedicalDeviceNews(): Promise<NewsItem[]> {
  try {
    console.log('Fetching medical device news...');
    
    // Define medical device feed URLs
    const medicalDeviceFeeds = [
      RSS_FEEDS.FDA_DEVICES,
      RSS_FEEDS.IMDRF_NEWS
    ];
    
    // Process all feed promises in parallel with error handling for each
    const feedPromises = medicalDeviceFeeds.map(feedUrl => 
      tryDirectRSSFetch(feedUrl).catch(error => {
        console.warn(`Error fetching medical device feed ${feedUrl}: ${error.message}`);
        return [];
      })
    );
    
    // Wait for all promises to resolve
    const feedResults = await Promise.all(feedPromises);
    
    // Track all items to avoid duplicates
    const processedItems = new Map<string, NewsItem>();
    
    // Process each feed's items
    feedResults.forEach((items, index) => {
      const feedUrl = medicalDeviceFeeds[index];
      
      console.log(`Processing ${items.length} items from ${feedUrl}`);
      
      items.forEach(item => {
        // Set source as MEDICAL_DEVICE
        item.source = 'MEDICAL_DEVICE';
        
        // Generate a stable key for deduplication
        const key = item.url || (item.title + item.publishedAt);
        
        // Only add if not already processed
        if (!processedItems.has(key)) {
          processedItems.set(key, item);
        }
      });
    });
    
    // Convert to array
    const allItems = Array.from(processedItems.values());
    
    // Add additional medical device news by searching PubMed
    try {
      const apiKey = PUBMED_API_KEY;
      const useApiKey = apiKey ? `&api_key=${apiKey}` : '';
      
      // Search for medical device articles
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent('medical device approval')}&retmax=10&sort=date&retmode=json${useApiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const pmids = searchData.esearchresult?.idlist || [];
        
        if (pmids.length > 0) {
          // Get article details
          const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json${useApiKey}`;
          
          const summaryResponse = await fetch(summaryUrl);
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            const result = summaryData.result || {};
            
            // Process each article
            for (const pmid of pmids) {
              if (!result[pmid]) continue;
              
              const article = result[pmid];
              
              // Create a unique ID
              const id = `MEDICAL_DEVICE-PUBMED-${pmid}`;
              
              // Extract publication date
              let publishedAt = new Date().toISOString();
              try {
                if (article.pubdate) {
                  publishedAt = new Date(article.pubdate).toISOString();
                }
              } catch (e) {
                console.warn(`Error parsing pubdate for medical device article ${pmid}:`, e);
              }
              
              // Create article URL
              const articleUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
              
              // Create news item
              const newsItem: NewsItem = {
                id,
                title: article.title || `Medical Device Article ${pmid}`,
                description: article.description || article.title || '',
                content: article.description || article.title || '',
                url: articleUrl,
                publishedAt,
                source: 'MEDICAL_DEVICE',
                categories: ['MEDICAL_DEVICE'],
                tags: extractTags(article.title + ' ' + (article.description || ''))
              };
              
              // Generate a stable key for deduplication
              const key = newsItem.url || (newsItem.title + newsItem.publishedAt);
              
              // Only add if not already processed
              if (!processedItems.has(key)) {
                processedItems.set(key, newsItem);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching additional medical device news from PubMed:', error);
    }
    
    // Get final array of items
    const finalItems = Array.from(processedItems.values());
    
    console.log(`Successfully fetched ${finalItems.length} unique medical device news items.`);
    return finalItems;
  } catch (error) {
    console.warn(`Error in fetchMedicalDeviceNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

export async function fetchNews(filter?: NewsFilter): Promise<NewsResponse> {
  try {
    console.log('Beginning fetchNews with filter:', filter);
    // Fetch news from all sources in parallel
    const newsPromises = [
      fetchFDANews().catch(error => {
        console.error('Error fetching FDA news:', error);
        return [];
      }),
      fetchPubMedNews().catch(error => {
        console.error('Error fetching PubMed news:', error);
        return [];
      }),
      fetchMedicalDeviceNews().catch(error => {
        console.error('Error fetching Medical Device news:', error);
        return [];
      }),
      fetchTrialSiteNews().catch(error => {
        console.error('Error fetching Trial Site news:', error);
        return [];
      }),
      fetchInternationalNews().catch(error => {
        console.error('Error fetching international news:', error);
        return [];
      }),
      fetchDrugsComNews().catch(error => {
        console.error('Error fetching Drugs.com news:', error);
        return [];
      })
    ];
    
    console.log('Waiting for all news sources to be fetched...');
    // Wait for all news sources to be fetched
    const [fdaNews, pubmedNews, medicalDeviceNews, trialSiteNews, internationalNews, drugsComNews] = await Promise.all(newsPromises);
    
    // Combine all news items
    let allNews = [...fdaNews, ...pubmedNews, ...medicalDeviceNews, ...trialSiteNews, ...internationalNews, ...drugsComNews];
    console.log('Combined news item count before filtering:', allNews.length);
    
    // Filter out items without required fields
    allNews = allNews.filter(item => !!item.title && !!item.url);
    console.log('News items after filtering out incomplete items:', allNews.length);
    
    // Log the count of items from each source for debugging
    console.log(`Total news items: ${allNews.length}`);
    console.log(`FDA news items: ${fdaNews.length}`);
    console.log(`PubMed news items: ${pubmedNews.length}`);
    console.log(`Medical Device news items: ${medicalDeviceNews.length}`);
    console.log(`Trial Site news items: ${trialSiteNews.length}`);
    console.log(`International news items: ${internationalNews.length}`);
    console.log(`Drugs.com news items: ${drugsComNews.length}`);

    // Confirm we have all source types present
    const sourceCount = {
      FDA: allNews.filter(item => item.source === 'FDA').length,
      PUBMED: allNews.filter(item => item.source === 'PUBMED').length,
      DRUGS_COM: allNews.filter(item => item.source === 'DRUGS_COM').length,
      MEDICAL_DEVICE: allNews.filter(item => item.source === 'MEDICAL_DEVICE').length,
      TRIAL_SITE: allNews.filter(item => item.source === 'TRIAL_SITE').length,
      INTERNATIONAL: allNews.filter(item => item.source === 'INTERNATIONAL').length
    };
    
    console.log('News items by source type:', sourceCount);
    
    // Apply filters if provided
    if (filter) {
      console.log('Applying filters to news items...');
      if (filter.sources && filter.sources.length > 0) {
        console.log('Filtering by sources:', filter.sources);
        allNews = allNews.filter(item => filter.sources?.includes(item.source));
        console.log('News items after source filtering:', allNews.length);
      }
      
      if (filter.categories && filter.categories.length > 0) {
        console.log('Filtering by categories:', filter.categories);
        allNews = allNews.filter(item => 
          item.categories?.some(category => filter.categories?.includes(category))
        );
        console.log('News items after category filtering:', allNews.length);
      }
      
      if (filter.searchQuery) {
        console.log('Filtering by search query:', filter.searchQuery);
        const searchLower = filter.searchQuery.toLowerCase();
        allNews = allNews.filter(item => 
          item.title.toLowerCase().includes(searchLower) || 
          item.description.toLowerCase().includes(searchLower) ||
          (item.content && item.content.toLowerCase().includes(searchLower)) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
        console.log('News items after search query filtering:', allNews.length);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        console.log('Filtering by tags:', filter.tags);
        allNews = allNews.filter(item => 
          item.tags?.some(tag => filter.tags?.includes(tag))
        );
        console.log('News items after tag filtering:', allNews.length);
      }
    }
    
    console.log('Sorting news items by date...');
    // Sort by date, most recent first
    allNews.sort((a, b) => {
      try {
        const dateA = new Date(a.publishedAt);
        const dateB = new Date(b.publishedAt);
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        return 0;
      }
    });
    
    // Apply pagination
    const page = filter?.page || 1;
    const pageSize = filter?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    console.log(`Applying pagination: page ${page}, pageSize ${pageSize}, items ${start}-${end}`);
    
    return {
      items: allNews.slice(start, end),
      total: allNews.length,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Error in fetchNews:', error);
    return { 
      items: [], 
      total: 0,
      page: 1,
      pageSize: 20
    };
  }
} 