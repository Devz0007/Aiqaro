"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { NewsItem } from '@/types/news';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
}

export function ArticleModal({ isOpen, onClose, newsItem }: ArticleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [articleData, setArticleData] = useState<{
    title: string;
    content: string;
    byline?: string;
    siteName?: string;
    excerpt?: string;
    fullContentAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen && newsItem) {
      fetchArticle();
    } else {
      // Reset state when modal is closed
      setArticleData(null);
      setError(null);
      setIframeLoaded(false);
      setIframeError(false);
    }
  }, [isOpen, newsItem]);

  const fetchArticle = async () => {
    if (!newsItem) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newsItem.url }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Adjust property names to match our component state
      setArticleData({
        title: data.title,
        content: data.content,
        byline: data.byline,
        siteName: data.siteName,
        excerpt: data.excerpt,
        fullContentAvailable: data.fullContent || false // API returns fullContent, we use fullContentAvailable
      });
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  if (!newsItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {loading ? <Skeleton className="h-8 w-3/4" /> : articleData?.title || newsItem.title}
          </DialogTitle>
          
          {!loading && articleData?.byline && (
            <DialogDescription className="text-sm mt-1">
              By {articleData.byline}
              {articleData.siteName && ` • ${articleData.siteName}`}
            </DialogDescription>
          )}
          
          {!loading && newsItem.categories && newsItem.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {newsItem.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-500">Failed to load article</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <Button onClick={fetchArticle} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            {articleData?.fullContentAvailable ? (
              <>
                {/* Special handling for TrialSite News using iframe */}
                {articleData.siteName === 'TrialSite News' ? (
                  <div className="trialsite-iframe-container">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800">
                      <p>Displaying original TrialSite News article. If the content doesn't appear correctly, please use the "View Original" button below.</p>
                    </div>
                    
                    <div className="relative w-full overflow-hidden rounded-md" style={{ height: 'calc(80vh - 200px)' }}>
                      <iframe
                        src={newsItem.url}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        title={articleData.title || newsItem.title}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onLoad={() => setIframeLoaded(true)}
                        onError={() => {
                          console.log("iframe loading failed for TrialSite");
                          setIframeError(true);
                        }}
                      />
                      
                      {/* Fallback content if iframe fails to load */}
                      <div className={`absolute top-0 left-0 w-full h-full bg-white bg-opacity-90 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500 iframe-fallback ${iframeError ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-center text-gray-700 mb-4 px-4">
                          {iframeError ? 
                            "The article content could not be embedded. This may be due to the website's security settings." :
                            "If the article content is not displaying correctly, please try viewing the original article directly."
                          }
                        </p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(newsItem.url, '_blank');
                          }}
                          className="pointer-events-auto flex items-center gap-2"
                        >
                          Visit Original Article <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : articleData.siteName === 'European Pharmaceutical Review' ? (
                  // Special handling for European Pharmaceutical Review
                  <div className="european-article-container">
                    <div className="prose prose-lg max-w-none prose-img:my-4 prose-img:rounded-md prose-headings:mt-6 prose-headings:mb-4 prose-p:my-3 prose-a:text-blue-600 overflow-hidden break-words">
                      <div dangerouslySetInnerHTML={{ __html: cleanArticleContent(articleData.content) }} />
                      
                      {/* Special footer for EPR articles */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Source: European Pharmaceutical Review - <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View original article</a>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : articleData.siteName === 'Drugs.com' || articleData.siteName === 'HealthDay' ? (
                  // Special handling for Drugs.com and HealthDay articles
                  <div className="drugs-com-article-container">
                    <div className="prose prose-lg max-w-none prose-img:my-4 prose-img:rounded-md prose-headings:mt-6 prose-headings:mb-4 prose-p:my-3 prose-a:text-blue-600 overflow-hidden break-words">
                      <div dangerouslySetInnerHTML={{ __html: cleanArticleContent(articleData.content) }} />
                      
                      {/* Special footer for Drugs.com/HealthDay articles */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Source: {articleData.siteName} - <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View original article</a>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal content rendering for other articles
                  <div className="prose prose-lg max-w-none prose-img:my-4 prose-img:rounded-md prose-headings:mt-6 prose-headings:mb-4 prose-p:my-3 prose-a:text-blue-600 overflow-hidden break-words" 
                       dangerouslySetInnerHTML={{ __html: cleanArticleContent(articleData.content) }} />
                )}
                
                {/* Show special note for TrialSite News articles when not using iframe */}
                {articleData.siteName === 'TrialSite News' && !newsItem.url.includes('trialsitenews.com') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4 text-sm text-blue-800">
                    <p>Note: TrialSite News may limit automatic content extraction. For the best experience, please visit the original article using the link below.</p>
                  </div>
                )}
                
                {/* Show special indicator for URL-to-Markdown content */}
                {articleData.content.includes('markdown-extracted-content') && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4 text-sm text-green-800">
                    <p>This article was extracted using an advanced URL-to-Markdown service for improved readability.</p>
                  </div>
                )}
                
                {/* Show special indicator for direct TrialSite extraction */}
                {articleData.content.includes('trialsite-direct-extraction') && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4 text-sm text-green-800">
                    <p>This article was extracted using specialized TrialSite News extraction techniques.</p>
                  </div>
                )}
                
                {/* Show special indicator for proxy-extracted content */}
                {articleData.content.includes('proxy-extracted-content') && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4 text-sm text-green-800">
                    <p>This article was extracted using a special proxy service for improved content access.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-700 mb-4">
                  {articleData?.siteName === 'TrialSite News' 
                    ? "TrialSite News content could not be automatically retrieved. This may be due to a paywall or access restrictions."
                    : "Full article content could not be retrieved automatically."}
                </p>
                <Button
                  onClick={() => window.open(newsItem.url, '_blank')}
                  className="flex items-center gap-2"
                >
                  Visit Original Article <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="text-right text-xs text-gray-500 mt-6">
              This is an auto-extracted version of the article.
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => window.open(newsItem.url, '_blank')}
            className="flex items-center gap-2"
          >
            View Original <ExternalLink className="h-4 w-4" />
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to clean article content before rendering
const cleanArticleContent = (html: string): string => {
  // This function cleans up common issues with extracted content
  
  // If it's empty or not a string, return empty string
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Add image error handling for all images - important for European sources
  const imgErrorHandler = ' onerror="this.onerror=null; this.style.display=\'none\';" ';
  html = html.replace(/<img ([^>]*)>/gi, (match, attributes) => {
    if (attributes.includes('onerror')) {
      return match; // Already has error handling
    } else {
      return `<img ${attributes} ${imgErrorHandler}>`;
    }
  });
  
  // Remove any inline JavaScript
  let cleaned = html.replace(/dataLayer\s*\|\|\s*\[\];.*?gtag\(.*?\);/gs, '');
  cleaned = cleaned.replace(/function\s+gtag\(\).*?{.*?}/gs, '');
  
  // Remove any script tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove any JSON-like content that might have been captured
  cleaned = cleaned.replace(/{[^{}]*(((?<!\\\{)\{[^{}]*\})[^{}]*)*\}/g, '');
  
  // Remove escaped unicode characters
  cleaned = cleaned.replace(/\\u003[a-zA-Z0-9]/g, '');
  
  // Remove any JavaScript-like content
  cleaned = cleaned.replace(/\w+\s*\|\|\s*\[\]\s*;/g, '');
  cleaned = cleaned.replace(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g, '');
  cleaned = cleaned.replace(/\w+\.\w+\s*=\s*function/g, '');
  cleaned = cleaned.replace(/new Date\(\)/g, '');
  cleaned = cleaned.replace(/gtag\([^)]*\)/g, '');
  
  // Remove anything that looks like a URL or path with special characters
  cleaned = cleaned.replace(/\\u003ca href=\\[^>]*>/g, '');
  cleaned = cleaned.replace(/target=\\_blank\\[^>]*>/g, '');
  
  // Remove code-like artifacts
  cleaned = cleaned.replace(/\],\"type\":\"/g, ' ');
  cleaned = cleaned.replace(/\",\"excerpt\":\"/g, ' ');
  
  // Clean up any double paragraph tags
  cleaned = cleaned.replace(/<p><p>/g, '<p>');
  cleaned = cleaned.replace(/<\/p><\/p>/g, '</p>');
  
  // Replace empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  
  // Add proper spacing between elements if missing
  cleaned = cleaned.replace(/<\/p><p>/g, '</p>\n<p>');
  
  // For European articles, make special fixes
  if (cleaned.includes('european-article')) {
    // Make all images responsive
    cleaned = cleaned.replace(/<img ([^>]*)>/gi, (match, attributes) => {
      const hasClass = attributes.includes('class="') || attributes.includes('class=\'');
      if (hasClass) {
        return match.replace(/class=["']([^"']*)["']/i, 'class="$1 max-w-full h-auto"');
      } else {
        return `<img ${attributes} class="max-w-full h-auto">`;
      }
    });
    
    // Add responsive class to figure elements
    cleaned = cleaned.replace(/<figure ([^>]*)>/gi, (match, attributes) => {
      const hasClass = attributes.includes('class="') || attributes.includes('class=\'');
      if (hasClass) {
        return match.replace(/class=["']([^"']*)["']/i, 'class="$1 max-w-full my-4"');
      } else {
        return `<figure ${attributes} class="max-w-full my-4">`;
      }
    });
    
    // Remove empty figure elements
    cleaned = cleaned.replace(/<figure[^>]*>\s*<\/figure>/gi, '');
    
    // Fix image captions
    cleaned = cleaned.replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gi, 
      '<figcaption class="text-sm text-gray-500 mt-1 mb-4 italic">$1</figcaption>');
  }
  
  // For Drugs.com articles, make special fixes
  if (cleaned.includes('drugs-com-article')) {
    // First, completely remove any navigation list at the start - most aggressive approach
    const navSection = cleaned.match(/<ul[^>]*>[\s\S]*?All News[\s\S]*?FDA Alerts[\s\S]*?<\/ul>/gi);
    if (navSection && navSection[0]) {
      cleaned = cleaned.replace(navSection[0], '');
    }
    
    // Then remove any "More news resources" section - most aggressive approach
    const resourceSection = cleaned.match(/<div[^>]*>[\s\S]*?More news resources[\s\S]*?<\/div>/gi);
    if (resourceSection && resourceSection[0]) {
      cleaned = cleaned.replace(resourceSection[0], '');
    }
    
    // Then remove the "Subscribe to our newsletter" section - most aggressive approach
    const subscribeSection = cleaned.match(/<div[^>]*>[\s\S]*?Subscribe to our newsletter[\s\S]*?<\/div>/gi);
    if (subscribeSection && subscribeSection[0]) {
      cleaned = cleaned.replace(subscribeSection[0], '');
    }
    
    // Remove all bullet points containing navigation or resource links
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?All News[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?Consumer[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?Pro[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?New Drugs[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?Pipeline[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?Clinical Trials[\s\S]*?<\/li>/gi, '');
    cleaned = cleaned.replace(/<li[^>]*>[\s\S]*?FDA Alerts[\s\S]*?<\/li>/gi, '');
    
    // Remove entire newsletter sections
    cleaned = cleaned.replace(/<section[^>]*>[\s\S]*?newsletter[\s\S]*?<\/section>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*subscribe[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    // Remove any remaining resource lists
    const resourcePatterns = [
      /<ul[^>]*>[\s\S]*?FDA Medwatch[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Drug Alerts[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Daily MedNews[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?News for Health[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Drug Approvals[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Drug Applications[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Drug Shortages[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Clinical Trial[\s\S]*?<\/ul>/gi,
      /<ul[^>]*>[\s\S]*?Generic Drug[\s\S]*?<\/ul>/gi,
      /<div[^>]*>[\s\S]*?More news resources[\s\S]*?<\/div>/gi,
      /<div[^>]*>[\s\S]*?Subscribe to our newsletter[\s\S]*?<\/div>/gi,
      /<p>[\s\S]*?© 20\d\d[\s\S]*?<\/p>/gi,
      /<p>[\s\S]*?Posted[\s\S]*?<\/p>/gi,
      /<p>[\s\S]*?Whatever your topic[\s\S]*?<\/p>/gi,
      /<p>[\s\S]*?subscribe to our newsletters[\s\S]*?<\/p>/gi
    ];
    
    for (const pattern of resourcePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove the bullets containing navigation links (All News, Consumer, etc.)
    const navigationLinks = [
      'All News',
      'Consumer',
      'Pro',
      'New Drugs',
      'Pipeline',
      'Clinical Trials',
      'FDA Alerts'
    ];
    
    // Create a regex pattern that matches list items containing these navigation links
    const navLinkPattern = new RegExp(`<li[^>]*>[\\s\\S]*?(${navigationLinks.join('|')})[\s\S]*?<\/li>`, 'gi');
    cleaned = cleaned.replace(navLinkPattern, '');
    
    // Remove heading for resource section
    cleaned = cleaned.replace(/<h3[^>]*>More news resources<\/h3>/gi, '');
    cleaned = cleaned.replace(/<h4[^>]*>More news resources<\/h4>/gi, '');
    cleaned = cleaned.replace(/<h3[^>]*>Subscribe to our newsletter<\/h3>/gi, '');
    cleaned = cleaned.replace(/<h4[^>]*>Subscribe to our newsletter<\/h4>/gi, '');
    
    // Remove entire sections containing "More news" or "Subscribe"
    cleaned = cleaned.replace(/<div[^>]*>[\s\S]*?More news resources[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*>[\s\S]*?Subscribe to our newsletter[\s\S]*?<\/div>/gi, '');
    
    // Check for and remove any unordered list that has mostly resource links
    const listMatches = cleaned.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
    for (const list of listMatches) {
      // Count how many typical resource link phrases appear in this list
      let resourceLinkCount = 0;
      const resourcePhrases = ['FDA', 'Drug', 'News', 'Clinical', 'Trial', 'Medwatch', 'Approvals', 'Generic'];
      
      for (const phrase of resourcePhrases) {
        const regex = new RegExp(phrase, 'gi');
        const matches = list.match(regex);
        if (matches) {
          resourceLinkCount += matches.length;
        }
      }
      
      // If this list has multiple resource link phrases, it's likely a resource list
      if (resourceLinkCount >= 2) {  // Lowered threshold to 2 for more aggressive removal
        cleaned = cleaned.replace(list, '');
      }
    }
    
    // Remove any lists with a mix of the navigation links - looking for lists with 
    // a combination of "All News", "Consumer", etc.
    const navListMatches = cleaned.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
    for (const list of navListMatches) {
      let navigationLinkCount = 0;
      
      for (const term of navigationLinks) {
        if (list.includes(term)) {
          navigationLinkCount++;
        }
      }
      
      // If this list has 2+ navigation links, remove it
      if (navigationLinkCount >= 1) {  // Even just 1 navigation link is enough to remove it
        cleaned = cleaned.replace(list, '');
      }
    }
    
    // Improve heading styles
    cleaned = cleaned.replace(/<h2([^>]*)>/gi, '<h2$1 class="text-xl font-bold mt-6 mb-4">');
    cleaned = cleaned.replace(/<h3([^>]*)>/gi, '<h3$1 class="text-lg font-bold mt-5 mb-3">');
    
    // Remove any footer links
    cleaned = cleaned.replace(/<a[^>]*>[^<]*Subscribe[^<]*<\/a>/gi, '');
    cleaned = cleaned.replace(/<a[^>]*>[^<]*newsletter[^<]*<\/a>/gi, '');
  }
  
  // Fix common issues with broken tags
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  
  // If the content contains raw text fragments that look like JavaScript or data
  if (cleaned.includes('dataLayer') || 
      cleaned.includes('function') || 
      cleaned.includes('CompanyAbout') ||
      cleaned.includes('props') ||
      cleaned.includes('YouTubeTwitterFacebook')) {
    
    // Try to extract just meaningful paragraphs
    const paragraphs = cleaned.match(/<p>(?!.*dataLayer|.*function|.*CompanyAbout).*?<\/p>/gs) || [];
    
    if (paragraphs.length > 0) {
      return paragraphs.join('\n');
    }
    
    // As a last resort, just extract the text and reformat it as paragraphs
    const text = cleaned.replace(/<[^>]*>/g, ' ')  // Remove all HTML tags
                        .replace(/\s+/g, ' ')      // Normalize whitespace
                        .trim();
    
    // Split into sentences and create new paragraphs
    const sentences = text.split(/\.\s+/);
    const newParagraphs = [];
    
    // Group sentences into paragraphs (3-4 sentences per paragraph)
    for (let i = 0; i < sentences.length; i += 3) {
      const paragraph = sentences.slice(i, i + 3).join('. ');
      if (paragraph.length > 20 && 
          !paragraph.includes('dataLayer') && 
          !paragraph.includes('function') &&
          !paragraph.includes('YouTube') &&
          !paragraph.includes('Suite 200')) {
        newParagraphs.push(`<p>${paragraph}.</p>`);
      }
    }
    
    return newParagraphs.join('\n');
  }
  
  return cleaned;
}; 