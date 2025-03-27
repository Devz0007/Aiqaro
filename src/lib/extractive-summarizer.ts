/**
 * Extractive summarization utility
 * Analyzes text to extract the most important sentences as a summary
 */

/**
 * Generate a summary from text by extracting the most important sentences
 */
export function generateSummary(
  text: string, 
  options: {
    sentenceCount?: number;
    minLength?: number;
    maxLength?: number;
    format?: 'paragraph' | 'bullets';
  } = {}
): string {
  const {
    minLength = 3,
    maxLength = 5,
    format = 'paragraph'
  } = options;
  
  // Extract sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  // If there are too few sentences, return the original text
  if (sentences.length <= minLength) return text;
  
  // Clean sentences
  const cleanedSentences = sentences.map(s => s.trim());
  
  // Calculate position-based scores (first sentences are typically more important in news)
  const positionScores = cleanedSentences.map((_, i) => {
    // First 3 sentences get higher scores (especially the first one)
    if (i === 0) return 1.5;
    if (i === 1) return 1.3;
    if (i === 2) return 1.1;
    
    // Remaining sentences get diminishing scores
    return Math.max(0.5, 1 - (i / sentences.length));
  });
  
  // Calculate word frequency scores
  const wordFrequency: Record<string, number> = {};
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 
    'by', 'about', 'as', 'of', 'is', 'was', 'were', 'be', 'been', 'being', 'have', 
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 
    'might', 'must', 'can', 'could', 'that', 'this', 'these', 'those', 'there', 'their'
  ]);
  
  cleanedSentences.forEach(sentence => {
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopWords.has(word));
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });
  
  // Calculate content scores based on word frequency
  const contentScores = cleanedSentences.map(sentence => {
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    if (words.length === 0) return 0;
    
    // Sum the frequency of non-stopwords in the sentence
    const score = words.reduce(
      (total, word) => total + (stopWords.has(word) ? 0 : (wordFrequency[word] || 0)), 
      0
    );
    
    // Normalize by sentence length to avoid bias toward longer sentences
    return score / words.length;
  });
  
  // Calculate similarity between the title (assumed to be the first sentence) and other sentences
  const titleWords = new Set(
    cleanedSentences[0].toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopWords.has(word))
  );
  
  const titleSimilarityScores = cleanedSentences.map((sentence, i) => {
    if (i === 0) return 0; // Skip the title itself
    
    const sentenceWords = new Set(
      sentence.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0 && !stopWords.has(word))
    );
    
    if (sentenceWords.size === 0) return 0;
    
    // Count words in common with the title
    let commonWords = 0;
    for (const word of sentenceWords) {
      if (titleWords.has(word)) {
        commonWords++;
      }
    }
    
    // Similarity score based on overlap
    return commonWords / Math.sqrt(titleWords.size * sentenceWords.size);
  });
  
  // Combine scores with weights
  const combinedScores = cleanedSentences.map((_, i) => 
    (positionScores[i] * 0.4) +       // Position is important in news
    (contentScores[i] * 0.4) +        // Content words are important
    (titleSimilarityScores[i] * 0.2)  // Relation to the title
  );
  
  // Determine sentence count based on text length
  let sentenceCount = options.sentenceCount;
  if (!sentenceCount) {
    // Adaptive sentence count based on text length
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 150) sentenceCount = minLength;
    else if (wordCount < 500) sentenceCount = Math.min(Math.floor(sentences.length * 0.3), maxLength);
    else sentenceCount = maxLength;
  }
  
  // Ensure we don't take more sentences than available
  sentenceCount = Math.min(sentenceCount, sentences.length);
  
  // Get top sentences while maintaining original order
  const topIndices = combinedScores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index)
    .map(item => item.index);
  
  // Create summary with original sentence order
  const summaryText = topIndices.map(index => cleanedSentences[index]).join(' ');
  
  // Format summary as requested
  return format === 'bullets' ? formatAsBulletPoints(summaryText) : summaryText;
}

/**
 * Convert a text into bullet points
 */
export function formatAsBulletPoints(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences
    .map(sentence => `• ${sentence.trim()}`)
    .join('\n\n');
} 