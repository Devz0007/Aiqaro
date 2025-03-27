import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Special handling for specific domains
    const isTrialSite = url.includes('trialsitenews.com');
    const isEuropeanSite = url.includes('europharma') || 
                           url.includes('pharmaceutical-review') || 
                           url.includes('epr.') ||
                           url.includes('european-pharmaceutical-review');
    const isDrugsCom = url.includes('drugs.com') || url.includes('healthday.com');
    
    // Initialize html variable to store the fetched content
    let html = '';
    
    // Add a random delay (0.5-3 seconds) for Drugs.com to appear more human-like
    if (isDrugsCom) {
      const randomDelay = Math.floor(Math.random() * 2500) + 500;
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
    
    // Determine if we should use a proxy for Drugs.com requests
    const shouldUseProxy = isDrugsCom;
    
    // Set up fetch options with appropriate headers to mimic a real browser
    let fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Connection': 'keep-alive',
        'dnt': '1'
      },
      redirect: 'follow' as RequestRedirect
    };
    
    let response;
    
    try {
      // For Drugs.com, first try using an open proxy service
      if (shouldUseProxy) {
        console.log("Using alternative method to fetch Drugs.com content");
        
        try {
          // First approach: Try using a free web proxy service
          response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
            headers: { 'Origin': 'https://trialbridge.ai' }
          });
          
          if (response.ok) {
            const proxyData = await response.json();
            if (proxyData && proxyData.contents) {
              html = proxyData.contents;
              console.log("Successfully retrieved content via AllOrigins proxy");
              
              // Continue directly to processing without another fetch
              const $ = cheerio.load(html);
              // The rest of the processing will happen with this content
            } else {
              console.log("AllOrigins response was not in expected format, falling back to direct fetch");
              // Will fall through to direct fetch below
            }
          } else {
            console.log(`AllOrigins proxy request failed with status ${response.status}, falling back to direct fetch`);
            // Will fall through to direct fetch below
          }
        } catch (proxyError) {
          console.error("Error using proxy service:", proxyError);
          console.log("Falling back to direct fetch approach");
          // Will fall through to direct fetch below
        }
      }
      
      // If we don't have HTML content yet (either proxy not used or failed), try direct fetch
      if (!html) {
        response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          console.log(`Direct fetch failed with status ${response.status}`);
          
          // If direct fetch fails, try using Googlebot UA as a last resort
          if (response.status === 403 || response.status === 429) {
            console.log("Retrying with Googlebot user agent");
            const googleBotOptions = {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
              }
            };
            
            response = await fetch(url, googleBotOptions);
          }
        }
        
        if (!response.ok) {
          return NextResponse.json(
            { 
              error: `Failed to fetch article: ${response.status}`,
              fullContent: false 
            },
            { status: response.status }
          );
        }
        
        html = await response.text();
      }
    } catch (fetchError) {
      console.error("Error fetching article:", fetchError);
      return NextResponse.json(
        { 
          error: `Failed to fetch article: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          fullContent: false 
        },
        { status: 500 }
      );
    }
    
    let mainContent = '';
    let mainTitle = '';
    let mainByline = '';
    let siteName = '';
    let mainExcerpt = '';

    // Use Cheerio for easier HTML manipulation
    const $ = cheerio.load(html);
    
    // Special handling for European sites
    if (isEuropeanSite) {
      // Try European site specific selectors first
      const contentSelectors = ['.article-fulltext', '.content-main', '.main-content', 'article', '.article-body'];
      const titleSelectors = ['h1.title', '.article-title', 'h1'];
      
      // Find content
      for (const selector of contentSelectors) {
        const content = $(selector).html();
        if (content && content.length > 300) {
          mainContent = content;
          break;
        }
      }
      
      // Find title
      for (const selector of titleSelectors) {
        const title = $(selector).first().text().trim();
        if (title) {
          mainTitle = title;
          break;
        }
      }
      
      // Fix image paths and remove problematic images for European sites
      if (mainContent) {
        // Process with cheerio for better image handling
        const contentCheerio = cheerio.load(mainContent);
        
        // Remove image containers with no valid images
        contentCheerio('.wp-caption, figure').each(function() {
          const container = contentCheerio(this);
          const img = container.find('img');
          
          // If there's no img element or it has no src/data-src, remove the container
          if (!img.length || (!img.attr('src') && !img.attr('data-src') && !img.attr('data-lazy-src'))) {
            container.remove();
          }
        });
        
        // Process remaining images
        contentCheerio('img').each(function() {
          const img = contentCheerio(this);
          let imgSrc = img.attr('src');
          
          // Check for data-src attributes (common for lazy loading)
          if (!imgSrc || imgSrc.includes('data:image') || imgSrc.includes('base64') || imgSrc.includes('placeholder')) {
            const dataSrc = img.attr('data-src') || img.attr('data-lazy-src');
            if (dataSrc) {
              img.attr('src', dataSrc);
              imgSrc = dataSrc;
            } else {
              // If no valid src can be found, remove the img element
              img.remove();
              return;
            }
          }
          
          // Fix relative paths
          if (imgSrc && (imgSrc.startsWith('/') || !imgSrc.startsWith('http'))) {
            const baseUrl = new URL(url).origin;
            const newSrc = imgSrc.startsWith('/') ? `${baseUrl}${imgSrc}` : `${baseUrl}/${imgSrc}`;
            img.attr('src', newSrc);
          }
          
          // Add error handling to prevent broken image display
          img.attr('onerror', "this.onerror=null; this.style.display='none';");
          
          // Add responsive styling
          img.attr('class', (img.attr('class') || '') + ' max-w-full h-auto');
        });
        
        mainContent = contentCheerio.html();
        siteName = 'European Pharmaceutical Review';
        mainByline = $('.author').text().trim() || $('.byline').text().trim() || '';
        mainExcerpt = $('meta[name="description"]').attr('content') || '';
        
        // Add some custom CSS for European articles to ensure proper spacing
        mainContent = `
          <div class="european-article">
            <style>
              .european-article img { max-width: 100%; height: auto; margin: 1rem 0; }
              .european-article figure { margin: 1.5rem 0; }
              .european-article .wp-caption { margin: 1.5rem 0; }
              .european-article p { margin-bottom: 1rem; }
            </style>
            ${mainContent}
          </div>
        `;
        
        // If we got content, return it directly
        if (mainContent && mainTitle) {
          return NextResponse.json({
            title: mainTitle,
            content: mainContent,
            byline: mainByline,
            siteName: siteName,
            excerpt: mainExcerpt,
            fullContent: true
          });
        }
      }
    }
    
    // Special handling for TrialSite News
    if (isTrialSite) {
      console.log("Processing TrialSite article");
      
      try {
        // First, try direct HTML scraping specifically designed for TrialSite
        const trialSiteContent = await extractTrialSiteDirectly($, url);
        
        if (trialSiteContent && trialSiteContent.content) {
          console.log("Successfully extracted content using direct TrialSite scraping");
          return NextResponse.json({
            title: trialSiteContent.title,
            content: trialSiteContent.content,
            byline: trialSiteContent.author || $('.author, .byline, .author-name').first().text().trim(),
            siteName: 'TrialSite News',
            excerpt: trialSiteContent.excerpt || $('meta[name="description"]').attr('content') || '',
            fullContent: true
          });
        }
        
        // Then try using an external article extraction API for TrialSite News
        const extractedContent = await extractWithExternalAPI(url);
        
        if (extractedContent && extractedContent.content) {
          console.log("Successfully extracted content using external API");
          return NextResponse.json({
            title: extractedContent.title || $('title').text().trim(),
            content: extractedContent.content,
            byline: extractedContent.author || $('.author, .byline, .author-name').first().text().trim(),
            siteName: 'TrialSite News',
            excerpt: extractedContent.excerpt || $('meta[name="description"]').attr('content') || '',
            fullContent: true
          });
        }
        
        // If external API fails, fall back to our custom extraction
        console.log("External API extraction failed, falling back to custom extraction");
        
        // For TrialSite, focus on extracting the actual article text
        // rather than preserving the HTML structure, which seems problematic
        const extractedText = extractCleanTextFromTrialSite($, url);
        
        if (extractedText) {
          const title = $('h1').first().text().trim() || $('title').text().trim();
          const author = $('.author, .byline, .author-name').first().text().trim();
          
          return NextResponse.json({
            title: title,
            content: extractedText,
            byline: author,
            siteName: 'TrialSite News',
            excerpt: $('meta[name="description"]').attr('content') || '',
            fullContent: true
          });
        }
        
        // If we couldn't extract clean text, return a failure response
        return NextResponse.json({
          title: $('title').text().trim() || 'TrialSite News Article',
          content: '',
          byline: '',
          siteName: 'TrialSite News',
          excerpt: $('meta[name="description"]').attr('content') || '',
          fullContent: false
        });
        
      } catch (error) {
        console.error("Error extracting TrialSite content:", error);
        return NextResponse.json({
          title: $('title').text().trim() || 'TrialSite News Article',
          content: '',
          byline: '',
          siteName: 'TrialSite News',
          excerpt: $('meta[name="description"]').attr('content') || '',
          fullContent: false
        });
      }
    }
    
    // Special handling for Drugs.com articles
    if (isDrugsCom) {
      console.log("Processing Drugs.com/HealthDay article");
      
      try {
        // Create a new cheerio instance with the original HTML
        const $ = cheerio.load(html);
        
        // Add a class marker to the body for client-side detection
        $('body').addClass('drugs-com-article');
        
        // Remove top navigation well
        $('.ddc-navWell-child').remove();
        $('#lis-article-nav').remove();
        $('.ddc-navWell').remove();
        
        // Remove all navigation links at the top
        $('ul li a:contains("All News")').closest('li').remove();
        $('ul li a:contains("Consumer")').closest('li').remove();
        $('ul li a:contains("Pro")').closest('li').remove();
        $('ul li a:contains("New Drugs")').closest('li').remove();
        $('ul li a:contains("Pipeline")').closest('li').remove();
        $('ul li a:contains("Clinical Trials")').closest('li').remove();
        $('ul li a:contains("FDA Alerts")').closest('li').remove();
        
        // Remove entire news resources section
        $('h3:contains("More news resources")').closest('div').remove();
        $('h4:contains("More news resources")').closest('div').remove();
        
        // Remove entire subscribe section
        $('h3:contains("Subscribe to our newsletter")').closest('div').remove();
        $('h4:contains("Subscribe to our newsletter")').closest('div').remove();
        
        // Remove any ul that contains FDA Medwatch, Drug Alerts, etc.
        $('ul:contains("FDA Medwatch")').remove();
        $('ul:contains("Drug Alerts")').remove();
        $('ul:contains("Daily MedNews")').remove();
        $('ul:contains("News for Health")').remove();
        $('ul:contains("Drug Approvals")').remove();
        $('ul:contains("Drug Applications")').remove();
        $('ul:contains("Drug Shortages")').remove();
        $('ul:contains("Clinical Trial")').remove();
        $('ul:contains("Generic Drug")').remove();
        
        // Remove any footer elements that contain subscription info
        $('footer').remove();
        $('.ddc-footer').remove();
        
        // Remove any links to subscribing to newsletters
        $('a:contains("Subscribe")').remove();
        $('a:contains("newsletter")').remove();
        
        // Remove any copyright notices
        $('p:contains("© 20")').remove();

        // Instead of modifying the 'html' constant, work with the modified DOM in memory
        // and continue processing with it
        
        // Find the article title
        const title = $('h1').first().text().trim() || $('title').text().trim();
        
        // Find the article content
        const contentSelectors = [
          '.contentBox', 
          '.article-body', 
          'article',
          '.article-content',
          '.content-body',
          'main .content'
        ];
        
        let articleContent = '';
        let contentElement = null;
        
        // Try each selector until we find content
        for (const selector of contentSelectors) {
          contentElement = $(selector);
          if (contentElement.length) {
            // Clone to avoid modifying the original
            const cleanContent = contentElement.clone();
            
            // More aggressive removal of navigation, resource lists, and other non-content elements
            // Remove top navigation links
            cleanContent.find('ul:contains("All News")').remove();
            cleanContent.find('ul:contains("Consumer")').remove();
            cleanContent.find('ul:contains("New Drugs")').remove();
            cleanContent.find('ul:contains("Pipeline")').remove();
            cleanContent.find('ul:contains("Clinical Trials")').remove();
            cleanContent.find('ul:contains("FDA Alerts")').remove();
            
            // Remove by content matches
            cleanContent.find('h3:contains("More news resources"), h4:contains("More news resources")').remove();
            cleanContent.find('h3:contains("Subscribe to our newsletter"), h4:contains("Subscribe to our newsletter")').remove();
            cleanContent.find('ul:contains("FDA Medwatch")').remove();
            cleanContent.find('ul:contains("Daily MedNews")').remove();
            cleanContent.find('ul:contains("Drug Approvals")').remove();
            cleanContent.find('ul:contains("Drug Shortages")').remove();
            cleanContent.find('ul:contains("Clinical Trial Results")').remove();
            cleanContent.find('p:contains("Whatever your topic of interest")').remove();
            cleanContent.find('p:contains("© 20")').remove();
            cleanContent.find('p:contains("Posted")').remove();
            
            // Remove by class or ID
            cleanContent.find('.subscribe, .newsletter, .copyright, .resource-links, .news-resources, .footer-links, .footer, .site-footer, .article-footer, .header, .site-header, .article-header, .breadcrumbs').remove();
            cleanContent.find('#footer, #header, #sidebar, #nav, #navigation, #breadcrumbs').remove();
            cleanContent.find('style, script, nav, .nav, .navigation').remove();
            
            // Remove any links to resource pages
            cleanContent.find('a[href*="fda-medwatch"], a[href*="drug-alerts"], a[href*="news"], a[href*="professionals"], a[href*="approvals"], a[href*="applications"], a[href*="shortages"], a[href*="clinical-trials"], a[href*="generic"]').each(function() {
              const $a = $(this);
              // Remove the entire list item if it's in a list
              if ($a.closest('li').length) {
                $a.closest('li').remove();
              } else {
                // Otherwise just remove the link itself
                $a.remove();
              }
            });
            
            // Get HTML content after cleaning
            articleContent = cleanContent.html() || '';
            
            if (articleContent && articleContent.length > 300) {
              break;
            }
          }
        }
        
        // If we found content, clean it further
        if (articleContent && articleContent.length > 300) {
          // Clean up the content further using cheerio
          const contentCheerio = cheerio.load(`<div class="drugs-com-article">${articleContent}</div>`);
          
          // Remove bullet-point lists containing news resources
          contentCheerio('ul').each(function() {
            const $ul = contentCheerio(this);
            const text = $ul.text().toLowerCase();
            
            // Check if this list is a resource list
            if (text.includes('fda medwatch') || 
                text.includes('drug alerts') || 
                text.includes('daily mednews') || 
                text.includes('news for health professionals') || 
                text.includes('drug approvals') || 
                text.includes('drug applications') ||
                text.includes('drug shortages') ||
                text.includes('clinical trial results') ||
                text.includes('generic drug approvals')) {
              $ul.remove();
            }
          });
          
          // Remove remaining resource links one by one
          contentCheerio('li').each(function() {
            const $li = contentCheerio(this);
            const text = $li.text().trim().toLowerCase();
            
            if (text.includes('fda medwatch') || 
                text.includes('drug alerts') || 
                text.includes('daily mednews') || 
                text.includes('news for') || 
                text.includes('drug approvals') || 
                text.includes('drug applications') ||
                text.includes('drug shortages') ||
                text.includes('clinical trial') ||
                text.includes('generic drug')) {
              $li.remove();
            }
          });
          
          // Remove any top navigation links that might have been missed
          contentCheerio('a').each(function() {
            const $a = contentCheerio(this);
            const text = $a.text().trim().toLowerCase();
            
            if (text === 'all news' || 
                text === 'consumer' || 
                text === 'pro' || 
                text === 'new drugs' || 
                text === 'pipeline' || 
                text === 'clinical trials' ||
                text === 'fda alerts') {
              // If this is part of a list, remove the entire list item
              if ($a.closest('li').length) {
                $a.closest('li').remove();
              } else {
                $a.remove();
              }
            }
          });
          
          // Remove the "More news resources" section and all content after it
          let moreResourcesFound = false;
          contentCheerio('h3, h4').each(function() {
            const $heading = contentCheerio(this);
            const text = $heading.text().trim();
            
            if (text.includes('More news resources') || text.includes('Subscribe to our newsletter')) {
              moreResourcesFound = true;
              $heading.remove();
              
              // Remove all siblings after this heading
              let $next = $heading.next();
              while ($next.length) {
                const $current = $next;
                $next = $next.next();
                $current.remove();
              }
              
              // Also remove the parent container if it's a div
              if ($heading.parent().is('div')) {
                $heading.parent().remove();
              }
            }
          });
          
          // If we found the "More news resources" section, also try to remove its container
          if (moreResourcesFound) {
            contentCheerio('div').each(function() {
              const $div = contentCheerio(this);
              const text = $div.text().trim();
              
              if (text.includes('More news resources') || 
                  text.includes('Subscribe to our newsletter') ||
                  text.includes('Whatever your topic of interest')) {
                $div.remove();
              }
            });
          }
          
          // Get the cleaned content
          articleContent = contentCheerio.html();
          
          // Add custom styles for Drugs.com articles
          articleContent = `
            <div class="drugs-com-article">
              <style>
                .drugs-com-article img { max-width: 100%; height: auto; margin: 1rem 0; }
                .drugs-com-article ul { margin-bottom: 1rem; }
                .drugs-com-article p { margin-bottom: 1rem; }
                .drugs-com-article .footnote { font-size: 0.8rem; color: #666; margin-top: 2rem; }
                .drugs-com-article ul li { margin-bottom: 0.5rem; }
              </style>
              ${articleContent}
            </div>
          `;
          
          // Get the author/byline if available
          const byline = $('.author, .byline').first().text().trim() || 
                       $('meta[name="author"]').attr('content') || '';
          
          // Get the excerpt if available
          const excerpt = $('meta[name="description"]').attr('content') || '';
          
          return NextResponse.json({
            title: title,
            content: articleContent,
            byline: byline,
            siteName: url.includes('drugs.com') ? 'Drugs.com' : 'HealthDay',
            excerpt: excerpt,
            fullContent: true
          });
        }
      } catch (error) {
        console.error("Error extracting Drugs.com content:", error);
        // Continue to default extraction if the special handling fails
      }
    }
    
    // Use Readability as a fallback for general websites
    const dom = new JSDOM(html, { url });
    
    // Fix images before parsing - ensure they have proper src attributes
    const document = dom.window.document;
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Fix for lazy-loaded images
      if (!img.src || img.src.includes('data:image')) {
        if (img.dataset.src) img.src = img.dataset.src;
        else if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;
      }
      
      // Fix relative image paths
      if (img.src && (img.src.startsWith('/') || !img.src.startsWith('http'))) {
        const baseUrl = new URL(url).origin;
        img.src = img.src.startsWith('/') ? `${baseUrl}${img.src}` : `${baseUrl}/${img.src}`;
      }
    });
    
    // Standard Readability extraction
    const reader = new Readability(dom.window.document, {
      keepClasses: true, // Keep classes to maintain styling
    });
    
    const article = reader.parse();
    
    if (!article) {
      return NextResponse.json(
        { 
          error: 'Unable to parse article content',
          fullContent: false 
        },
        { status: 422 }
      );
    }
    
    // Consider any content as full content since we're showing everything
    const fullContent = article.content && article.content.length > 0;
    
    // Process content to fix any remaining image issues
    let processedContent = article.content || '';
    
    // Fix image URLs if they're relative
    if (processedContent) {
      const tempCheerio = cheerio.load(processedContent);
      
      tempCheerio('img').each(function() {
        const img = tempCheerio(this);
        let src = img.attr('src');
        
        // Handle lazy loaded images
        if (!src || src.includes('data:image')) {
          const dataSrc = img.attr('data-src') || img.attr('data-lazy-src');
          if (dataSrc) {
            img.attr('src', dataSrc);
            src = dataSrc;
          }
        }
        
        // Fix relative URLs
        if (src && (src.startsWith('/') || !src.startsWith('http'))) {
          const baseUrl = new URL(url).origin;
          const newSrc = src.startsWith('/') ? `${baseUrl}${src}` : `${baseUrl}/${src}`;
          img.attr('src', newSrc);
        }
      });
      
      processedContent = tempCheerio.html();
    }
    
    return NextResponse.json({
      title: article.title,
      content: processedContent,
      byline: article.byline,
      siteName: article.siteName,
      excerpt: article.excerpt,
      fullContent: fullContent
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process article',
        fullContent: false
      },
      { status: 500 }
    );
  }
}

// Helper function to extract TrialSite News article text
function extractTrialSiteArticle($: cheerio.CheerioAPI): string {
  // First, try to identify the article content specifically
  // TrialSite often has article content in specific elements
  
  // Try to find the main article div with content
  const articleElement = $('#article-container, article, .article, .post, .post-content').first();
  
  if (articleElement.length) {
    // Process the content to remove navigation, header, footer, sidebar and ads
    const articleContent = articleElement.clone();
    
    // Remove non-content elements
    articleContent.find('header, footer, nav, aside, .sidebar, .navigation, .ad, .ads, .advertisement, script, style, .social-share, .related-posts, .comments').remove();
    
    // Extract only the main content elements
    const paragraphs = articleContent.find('p, h2, h3, h4, h5, h6, ul, ol, blockquote');
    
    if (paragraphs.length >= 3) {
      // Recreate the content with only the essential elements
      let cleanContent = '<div class="trialsite-article">';
      
      paragraphs.each(function() {
        const elementHtml = $(this).prop('outerHTML') || $(this).html() || '';
        if (elementHtml && elementHtml.length > 0) {
          cleanContent += elementHtml;
        }
      });
      
      cleanContent += '</div>';
      return cleanContent;
    }
  }
  
  // Second approach: find div with the most paragraph content
  let bestDiv: any = null;
  let maxTextLength = 0;
  
  $('div').each(function() {
    const div = $(this);
    if (div.find('p').length >= 3) {
      // Calculate total text length of paragraphs
      let textLength = 0;
      div.find('p').each(function() {
        textLength += $(this).text().trim().length;
      });
      
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
        bestDiv = div;
      }
    }
  });
  
  if (bestDiv && maxTextLength > 500) {
    // Clean up the content
    const contentDiv = bestDiv.clone();
    
    // Remove unwanted elements
    contentDiv.find('script, style, .ad, .ads, .advertisement, .sidebar, .navigation, nav, .related').remove();
    
    // Get the content with proper formatting
    return `<div class="extracted-article">${contentDiv.html()}</div>`;
  }
  
  // No suitable content found
  return '';
}

// Helper function to extract clean text from TrialSite News articles
function extractCleanTextFromTrialSite($: cheerio.CheerioAPI, url: string): string {
  // First, try to find all paragraph elements that look like article content
  const paragraphs: string[] = [];
  
  // Find all paragraph elements
  $('p').each(function() {
    const text = $(this).text().trim();
    
    // Filter out paragraphs that are likely not article content
    if (text.length > 40 && 
        !text.includes('© 2025') && 
        !text.includes('Terms of Service') &&
        !text.includes('Salt Lake City') && 
        !text.includes('Privacy Policy') &&
        !text.includes('function') &&
        !text.includes('dataLayer') &&
        !text.includes('YouTube') &&
        !text.includes('Follow Us')) {
      paragraphs.push(`<p>${text}</p>`);
    }
  });
  
  // If we found enough paragraphs, assume it's the article content
  if (paragraphs.length >= 3) {
    return `<div class="clean-text-extraction">${paragraphs.join('')}</div>`;
  }
  
  // If we couldn't find paragraphs, try extracting from the main body text
  const bodyText = $('body').text();
  
  // Remove obvious JavaScript and irrelevant content
  const cleanText = bodyText
    .replace(/dataLayer\s*\|\|\s*\[\];.*?gtag\(.*?\);/gs, '')
    .replace(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g, '')
    .replace(/CompanyAbout\s+UsTerms\s+of\s+ServicePrivacy/g, '')
    .replace(/Follow\s+Us\s+YouTube\s+Twitter\s+Facebook/g, '')
    .replace(/Salt\s+Lake\s+City,\s+UT\s+84101/g, '')
    .replace(/©\s+\d{4}\s+-\s+Trial\s+Site\s+News/g, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\\\w+/g, '')
    .replace(/\s+/g, ' ');
  
  // Split into sentences and create paragraphs
  const sentences = cleanText.split(/[.!?](?:\s+|$)/).filter(s => s.trim().length > 40);
  
  if (sentences.length < 3) {
    return ''; // Not enough content to be useful
  }
  
  // Group sentences into paragraphs (3-4 sentences per paragraph)
  const formattedParagraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join('. ').trim();
    if (paragraph.length > 40) {
      formattedParagraphs.push(`<p>${paragraph}.</p>`);
    }
  }
  
  if (formattedParagraphs.length === 0) {
    return '';
  }
  
  return `<div class="extracted-content">
    <div class="article-note">
      <p><em>Note: This is an automatically extracted version of the article from TrialSite News. 
      Some formatting issues may be present.</em></p>
    </div>
    ${formattedParagraphs.join('')}
    <p class="original-link">
      <a href="${url}" target="_blank" rel="noopener noreferrer">
        View Original Article on TrialSite News
      </a>
    </p>
  </div>`;
}

// Use an external article extraction API service
async function extractWithExternalAPI(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    // First try using a proxy service for TrialSite News
    if (url.includes('trialsitenews.com')) {
      // Try the proxy service approach first
      const proxyResult = await tryProxyService(url);
      if (proxyResult) return proxyResult;
      
      // Then try URL-to-Markdown service
      const markdownResult = await tryUrlToMarkdownService(url);
      if (markdownResult) return markdownResult;
    }
    
    // Check if any API keys are configured
    const hasExtractorKey = Boolean(process.env.EXTRACTOR_API_KEY);
    const hasMercuryKey = Boolean(process.env.MERCURY_API_KEY);
    const hasAylienKeys = Boolean(process.env.AYLIEN_APP_ID && process.env.AYLIEN_API_KEY);
    
    if (!hasExtractorKey && !hasMercuryKey && !hasAylienKeys) {
      console.log("No API keys configured for external extraction services");
      
      // Try a simpler API that doesn't require authentication
      return await trySimpleExtraction(url);
    }
    
    // Try multiple extraction services for better reliability
    // 1. First try with Article Extractor API
    if (hasExtractorKey) {
      const extractionResult = await tryExtractorAPI(url);
      if (extractionResult) return extractionResult;
    }
    
    // 2. Fall back to Mercury Web Parser if the first one fails
    if (hasMercuryKey) {
      const mercuryResult = await tryMercuryAPI(url);
      if (mercuryResult) return mercuryResult;
    }
    
    // 3. Try AYLIEN if the other services fail
    if (hasAylienKeys) {
      const aylienResult = await tryAylienAPI(url);
      if (aylienResult) return aylienResult;
    }
    
    // If all keyed services failed, try the simple API
    const simpleResult = await trySimpleExtraction(url);
    if (simpleResult) return simpleResult;
    
    // All extraction services failed
    console.log("All external API extraction attempts failed");
    return null;
  } catch (error) {
    console.error('Error using external extraction APIs:', error);
    return null;
  }
}

// Try extracting content using a proxy service
async function tryProxyService(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    console.log("Trying proxy service for TrialSite extraction");
    
    // Use multiple proxy services for reliability
    const proxyServices = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    let responseHtml = null;
    
    // Try each proxy service until one works
    for (const proxyUrl of proxyServices) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-GPC': '1',
            'Cache-Control': 'max-age=0',
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          responseHtml = await response.text();
          if (responseHtml && responseHtml.length > 1000) {
            console.log(`Successfully fetched content via proxy: ${proxyUrl.substring(0, 30)}...`);
            break;
          }
        }
      } catch (err) {
        console.log(`Proxy service failed (${proxyUrl.substring(0, 30)}...): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    if (!responseHtml) {
      console.log("All proxy services failed");
      return null;
    }
    
    // Parse the HTML
    const $ = cheerio.load(responseHtml);
    
    // Get the title
    const title = $('h1.entry-title').first().text().trim() || 
                  $('h1').first().text().trim() || 
                  $('title').text().replace(' - TrialSite News', '').trim();
    
    // Find the article content using TrialSite specific selectors
    const contentSelectors = [
      '.entry-content', 
      'article.post .post-content',
      '.post-content',
      '.article-content',
      '.site-content article',
      '.elementor-widget-container',
      '.main-content'
    ];
    
    let articleContent = '';
    for (const selector of contentSelectors) {
      const contentElement = $(selector);
      
      if (contentElement.length) {
        // Clone to avoid modifying original
        const cleanContent = contentElement.clone();
        
        // Remove non-article elements
        cleanContent.find('style, script, .comments-area, .tags-links, nav, .navigation, .share-buttons, .jp-relatedposts, .sharedaddy, .meta, aside, .sidebar, footer, header, .widget').remove();
        
        // Get HTML content
        const html = cleanContent.html();
        
        if (html && html.length > 500) {
          articleContent = html;
          break;
        }
      }
    }
    
    // If no content found with selectors, try to get all paragraphs
    if (!articleContent || articleContent.length < 500) {
      const paragraphs: string[] = [];
      
      // Find all paragraphs that look like article content
      $('p').each(function() {
        const p = $(this);
        const text = p.text().trim();
        
        // Skip likely non-content paragraphs
        if (text.length < 30 || 
            text.includes('© 20') || 
            text.includes('Salt Lake City') || 
            text.includes('Terms of Service') ||
            text.includes('Privacy Policy')) {
          return;
        }
        
        paragraphs.push(`<p>${p.html()}</p>`);
      });
      
      if (paragraphs.length >= 3) {
        articleContent = paragraphs.join('\n');
      }
    }
    
    // If we couldn't extract content, return null
    if (!articleContent || articleContent.length < 300) {
      console.log("Couldn't extract meaningful content from proxy response");
      return null;
    }
    
    // Get the author if available
    const author = $('.author-name, .author, .byline, .meta-author').first().text().trim() || 
                   $('meta[name="author"]').attr('content') || '';
    
    // Get the excerpt if available
    const excerpt = $('meta[name="description"]').attr('content') || 
                   $('.excerpt').first().text().trim() || 
                   $('meta[property="og:description"]').attr('content') || '';
    
    // Fix image URLs
    const contentCheerio = cheerio.load(articleContent);
    contentCheerio('img').each(function() {
      const img = contentCheerio(this);
      let imgSrc = img.attr('src');
      
      if (!imgSrc) return;
      
      // Fix relative paths
      if (imgSrc.startsWith('/') || !imgSrc.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        const newSrc = imgSrc.startsWith('/') ? `${baseUrl}${imgSrc}` : `${baseUrl}/${imgSrc}`;
        img.attr('src', newSrc);
      }
    });
    
    articleContent = contentCheerio.html() || articleContent;
    
    return {
      title,
      content: `
        <div class="proxy-extracted-content">
          ${articleContent}
          <div class="extraction-note mt-4 text-sm text-gray-500">
            <p>Article extracted via proxy service.</p>
          </div>
        </div>
      `,
      author,
      excerpt
    };
  } catch (error) {
    console.error('Error using proxy service:', error);
    return null;
  }
}

// URL-to-Markdown service extraction
async function tryUrlToMarkdownService(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    console.log("Trying URL-to-Markdown service for extraction");
    
    // Use a backup URL-to-Markdown service as the main Heroku service may be unreliable
    const backupMarkdownUrl = `https://url-to-markdown.onrender.com/?url=${encodeURIComponent(url)}&title=true`;
    const originalMarkdownUrl = `https://urltomarkdown.herokuapp.com/?url=${encodeURIComponent(url)}&title=true`;
    
    // Try the backup service first
    let response = await fetch(backupMarkdownUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, text/markdown',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    }).catch(err => {
      console.log("Backup markdown service failed, will try original:", err);
      return null;
    });
    
    // If backup fails, try the original service
    if (!response || !response.ok) {
      console.log("Trying original Markdown service...");
      response = await fetch(originalMarkdownUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, text/markdown',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
        cache: 'no-store'
      });
    }
    
    if (!response || !response.ok) {
      console.error('Both URL-to-Markdown services failed');
      return null;
    }
    
    // Get the title from the header
    const title = response.headers.get('X-Title') 
      ? decodeURIComponent(response.headers.get('X-Title') || '')
      : '';
    
    // Get the markdown content
    const markdownContent = await response.text();
    
    // Check if we actually got real content, not just address information
    if (markdownContent && 
        markdownContent.length > 300 && 
        !markdownContent.includes('159 W Broadway') && 
        !markdownContent.includes('Suite 200') &&
        !markdownContent.includes('Salt Lake City, UT 84101')) {
      
      // Convert markdown to HTML for our renderer
      const htmlContent = markdownToHtml(markdownContent);
      
      return {
        title: title,
        content: `
          <div class="markdown-extracted-content">
            ${htmlContent}
            <div class="extraction-note mt-4 text-sm text-gray-500">
              <p>Article extracted using URL-to-Markdown service.</p>
            </div>
          </div>
        `,
        author: '', // The service doesn't extract author information
        excerpt: ''  // The service doesn't provide excerpts
      };
    } else {
      console.log("URL-to-Markdown returned only company info or insufficient content");
      return null;
    }
  } catch (error) {
    console.error('Error using URL-to-Markdown service:', error);
    return null;
  }
}

// Simple function to convert markdown to HTML
function markdownToHtml(markdown: string): string {
  try {
    // Since we don't want to add dependencies, use a more robust regex-based conversion
    
    // First, split the content into blocks based on double newlines
    const blocks = markdown.split(/\n\n+/);
    let html = '';
    
    for (const block of blocks) {
      if (block.trim() === '') continue;
      
      // Check what kind of block this is
      if (block.startsWith('# ')) {
        // Header level 1
        html += `<h1>${block.substring(2).trim()}</h1>`;
      } else if (block.startsWith('## ')) {
        // Header level 2
        html += `<h2>${block.substring(3).trim()}</h2>`;
      } else if (block.startsWith('### ')) {
        // Header level 3
        html += `<h3>${block.substring(4).trim()}</h3>`;
      } else if (block.startsWith('#### ')) {
        // Header level 4
        html += `<h4>${block.substring(5).trim()}</h4>`;
      } else if (block.startsWith('##### ')) {
        // Header level 5
        html += `<h5>${block.substring(6).trim()}</h5>`;
      } else if (block.startsWith('###### ')) {
        // Header level 6
        html += `<h6>${block.substring(7).trim()}</h6>`;
      } else if (block.startsWith('* ')) {
        // Unordered list
        const items = block.split(/\n\* /);
        html += '<ul>';
        for (const item of items) {
          if (item.startsWith('* ')) {
            html += `<li>${processInlineMarkdown(item.substring(2).trim())}</li>`;
          } else {
            html += `<li>${processInlineMarkdown(item.trim())}</li>`;
          }
        }
        html += '</ul>';
      } else if (block.startsWith('1. ')) {
        // Ordered list
        const items = block.split(/\n\d+\. /);
        html += '<ol>';
        for (const item of items) {
          if (/^\d+\. /.test(item)) {
            html += `<li>${processInlineMarkdown(item.replace(/^\d+\. /, '').trim())}</li>`;
          } else if (item.trim() !== '') {
            html += `<li>${processInlineMarkdown(item.trim())}</li>`;
          }
        }
        html += '</ol>';
      } else if (block.startsWith('> ')) {
        // Blockquote
        html += `<blockquote>${processInlineMarkdown(block.substring(2).trim())}</blockquote>`;
      } else if (block.startsWith('```')) {
        // Code block
        const code = block.replace(/^```.*\n/, '').replace(/```$/, '');
        html += `<pre><code>${escapeHtml(code)}</code></pre>`;
      } else if (block.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        // Horizontal rule
        html += '<hr>';
      } else {
        // Regular paragraph
        html += `<p>${processInlineMarkdown(block)}</p>`;
      }
    }
    
    return html;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Fallback to the basic conversion
    return `<p>${markdown.replace(/\n\n/g, '</p><p>')}</p>`;
  }
}

// Process inline markdown elements
function processInlineMarkdown(text: string): string {
  // Escape HTML special characters except for already escaped ones
  let processed = text.replace(/[&<>"']/g, match => {
    if (match === '&' && /&[a-zA-Z0-9#]+;/.test(text.substring(text.indexOf(match)))) {
      return match; // Keep already escaped entities
    }
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match] || match;
  });
  
  // Bold
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                       .replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
                       .replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Strike-through
  processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Inline code
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links
  processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Auto-link URLs
  processed = processed.replace(
    /(?<!["']|href="|src="|>)(https?:\/\/[^\s<]+)(?!["']|<\/a>)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Line breaks
  processed = processed.replace(/  \n/g, '<br>');
  
  return processed;
}

// Helper function to escape HTML in code blocks
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Simple extraction API that doesn't require authentication
async function trySimpleExtraction(url: string): Promise<{
  title?: string,
  content: string,
  author?: string,
  excerpt?: string
} | null> {
  try {
    // Using a simple page extraction API
    const extractionEndpoint = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(extractionEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Simple extraction failed:', response.status);
      return null;
    }
    
    const html = await response.text();
    
    // Parse the HTML
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Try to extract the main article
    const article = new Readability(doc).parse();
    
    if (article && article.content) {
      return {
        title: article.title || undefined,
        content: `
          <div class="extracted-content">
            ${article.content}
            <div class="extraction-note mt-4 text-sm text-gray-500">
              <p>Article extracted via simple extraction method.</p>
            </div>
          </div>
        `,
        author: article.byline || undefined,
        excerpt: article.excerpt || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error using simple extraction:', error);
    return null;
  }
}

// Article Extractor API service
async function tryExtractorAPI(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    const extractionEndpoint = 'https://extractorapi.com/api/v1/extractor';
    
    const response = await fetch(extractionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXTRACTOR_API_KEY || '', // Use environment variable for API key
      },
      body: JSON.stringify({ url }),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Article Extractor API failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.content) {
      let formattedContent = `
        <div class="extracted-api-content">
          ${data.content}
          <div class="extraction-note mt-4 text-sm text-gray-500">
            <p>Article extracted via professional extraction service.</p>
          </div>
        </div>
      `;
      
      return {
        title: data.title,
        content: formattedContent,
        author: data.author,
        excerpt: data.description || data.excerpt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error using Article Extractor API:', error);
    return null;
  }
}

// Mercury Web Parser service
async function tryMercuryAPI(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    const mercuryEndpoint = 'https://mercury.postlight.com/parser';
    
    const response = await fetch(`${mercuryEndpoint}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MERCURY_API_KEY || '',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Mercury API extraction failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.content) {
      let formattedContent = `
        <div class="mercury-extracted-content">
          ${data.content}
          <div class="extraction-note mt-4 text-sm text-gray-500">
            <p>Article extracted via Mercury Web Parser.</p>
          </div>
        </div>
      `;
      
      return {
        title: data.title,
        content: formattedContent,
        author: data.author,
        excerpt: data.excerpt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error using Mercury API:', error);
    return null;
  }
}

// AYLIEN Text API service
async function tryAylienAPI(url: string): Promise<{ 
  title?: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    const aylienEndpoint = 'https://api.aylien.com/api/v1/extract';
    
    const response = await fetch(`${aylienEndpoint}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'X-AYLIEN-TextAPI-Application-ID': process.env.AYLIEN_APP_ID || '',
        'X-AYLIEN-TextAPI-Application-Key': process.env.AYLIEN_API_KEY || '',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('AYLIEN API extraction failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.article) {
      let formattedContent = `
        <div class="aylien-extracted-content">
          ${data.article}
          <div class="extraction-note mt-4 text-sm text-gray-500">
            <p>Article extracted via AYLIEN Text API.</p>
          </div>
        </div>
      `;
      
      return {
        title: data.title,
        content: formattedContent,
        author: data.author,
        excerpt: data.description
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error using AYLIEN API:', error);
    return null;
  }
}

// Direct extraction of TrialSite News articles
async function extractTrialSiteDirectly($: cheerio.CheerioAPI, url: string): Promise<{ 
  title: string, 
  content: string, 
  author?: string, 
  excerpt?: string 
} | null> {
  try {
    console.log("Trying direct TrialSite extraction");
    
    // Get the article title - TrialSite usually has an h1 with the article title
    const title = $('h1.entry-title').first().text().trim() || 
                  $('h1').first().text().trim() || 
                  $('title').text().replace(' - TrialSite News', '').trim();
    
    if (!title || title.length < 5) {
      console.log("Couldn't find a valid title in TrialSite article");
      return null;
    }
    
    // Find the actual article content - TrialSite typically uses these selectors
    const contentSelectors = [
      '.entry-content', 
      'article.post',
      '.post-content',
      '.article-content',
      'article .content',
      '.single-content'
    ];
    
    let articleContent = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        // Clone to avoid modifying the original DOM
        const cleanElement = element.clone();
        
        // Remove irrelevant elements
        cleanElement.find('style, script, .sharedaddy, .jp-relatedposts, .social-share, .wp-block-embed-twitter, iframe, .wp-block-embed-youtube, .tags-links, .article-meta, footer, header, .post-navigation, .main-navigation, .breadcrumbs, .navigation, .sidebar, .widget, .comments, .related-post').remove();
        
        // Get the HTML
        articleContent = cleanElement.html() || '';
        
        // If we found decent content, break
        if (articleContent.length > 500) {
          break;
        }
      }
    }
    
    // If no content found via selectors, try to extract paragraphs from the main body
    if (!articleContent || articleContent.length < 500) {
      console.log("Using fallback paragraph extraction for TrialSite");
      
      const paragraphs: string[] = [];
      
      // Get all paragraphs that look like article content
      $('p').each(function() {
        const p = $(this);
        const text = p.text().trim();
        
        // Skip paragraphs that are likely not part of the article
        if (text.length < 40 || 
            text.includes('Suite 200') || 
            text.includes('Salt Lake City') || 
            text.includes('© 2024') || 
            text.includes('Rights Reserved') || 
            text.includes('Terms of Service') ||
            text.includes('Privacy Policy')) {
          return;
        }
        
        // Get the HTML content of the paragraph
        const pHtml = $(this).html() || '';
        if (pHtml) {
          paragraphs.push(`<p>${pHtml}</p>`);
        }
      });
      
      if (paragraphs.length >= 3) {
        articleContent = paragraphs.join('\n');
      }
    }
    
    // If we still have no content, we failed
    if (!articleContent || articleContent.length < 300) {
      console.log("Failed to extract TrialSite content directly");
      return null;
    }
    
    // Process article content to fix image URLs
    const contentCheerio = cheerio.load(articleContent);
    contentCheerio('img').each(function() {
      const img = contentCheerio(this);
      let imgSrc = img.attr('src');
      
      // Check for data-src attributes (common for lazy loading)
      if (!imgSrc || imgSrc.includes('data:image')) {
        const dataSrc = img.attr('data-src') || img.attr('data-lazy-src');
        if (dataSrc) {
          img.attr('src', dataSrc);
          imgSrc = dataSrc;
        }
      }
      
      // Fix relative paths
      if (imgSrc && (imgSrc.startsWith('/') || !imgSrc.startsWith('http'))) {
        const baseUrl = new URL(url).origin;
        const newSrc = imgSrc.startsWith('/') ? `${baseUrl}${imgSrc}` : `${baseUrl}/${imgSrc}`;
        img.attr('src', newSrc);
      }
    });
    
    // Clean the content
    articleContent = contentCheerio.html() || articleContent;
    
    // Get the author if available
    const author = $('.author-name').first().text().trim() || 
                   $('.author').first().text().trim() || 
                   $('.byline').first().text().trim() || 
                   $('meta[name="author"]').attr('content') || '';
    
    // Get the excerpt if available
    const excerpt = $('meta[name="description"]').attr('content') || 
                   $('.excerpt').first().text().trim() || 
                   $('meta[property="og:description"]').attr('content') || '';
    
    return {
      title,
      content: `
        <div class="trialsite-direct-extraction">
          ${articleContent}
          <div class="extraction-note mt-4 text-sm text-gray-500">
            <p>Article extracted directly from TrialSite News.</p>
          </div>
        </div>
      `,
      author,
      excerpt
    };
  } catch (error) {
    console.error('Error in direct TrialSite extraction:', error);
    return null;
  }
} 