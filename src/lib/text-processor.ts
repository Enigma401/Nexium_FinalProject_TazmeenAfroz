// Text processing utility for chunking and preparation
interface TextChunk {
  content: string;
  index: number;
  wordCount: number;
  characterCount: number;
}

export interface ProcessedDocument {
  fullText: string;
  chunks: TextChunk[];
  metadata: {
    totalWords: number;
    totalCharacters: number;
    totalChunks: number;
    processingDate: Date;
  };
}

/**
 * Split text into manageable chunks for AI processing
 * This implements proper chunking strategy for LLM context limits
 */
export function chunkText(text: string, options: {
  chunkSize?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
} = {}): TextChunk[] {
  const {
    chunkSize = 1000, // characters per chunk
    overlap = 100,    // overlap between chunks
    preserveParagraphs = true
  } = options;

  console.log(`📝 Chunking text: ${text.length} characters into ~${chunkSize} char chunks`);

  if (text.length <= chunkSize) {
    return [{
      content: text.trim(),
      index: 0,
      wordCount: text.trim().split(/\s+/).length,
      characterCount: text.length
    }];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // If we're preserving paragraphs and not at the end, try to break at paragraph
    if (preserveParagraphs && endIndex < text.length) {
      const lastParagraphBreak = text.lastIndexOf('\n\n', endIndex);
      const lastSentenceBreak = text.lastIndexOf('.', endIndex);
      
      // Prefer paragraph break, fallback to sentence break
      if (lastParagraphBreak > startIndex + chunkSize / 2) {
        endIndex = lastParagraphBreak + 2;
      } else if (lastSentenceBreak > startIndex + chunkSize / 2) {
        endIndex = lastSentenceBreak + 1;
      }
    }

    const chunkContent = text.slice(startIndex, endIndex).trim();
    
    if (chunkContent) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        wordCount: chunkContent.split(/\s+/).length,
        characterCount: chunkContent.length
      });
      chunkIndex++;
    }

    // Move start index, accounting for overlap
    startIndex = Math.max(endIndex - overlap, startIndex + 1);
  }

  console.log(`✅ Created ${chunks.length} chunks from text`);
  return chunks;
}

/**
 * Process extracted PDF text for AI analysis
 */
export function processDocumentText(rawText: string): ProcessedDocument {
  console.log('🔄 Processing document text for AI analysis...');
  
  // Clean and normalize the text
  const cleanedText = rawText
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n') // Clean up paragraphs
    .trim();

  // Create chunks
  const chunks = chunkText(cleanedText, {
    chunkSize: 1500,  // Good size for resume content
    overlap: 200,     // Reasonable overlap
    preserveParagraphs: true
  });

  const wordCount = cleanedText.split(/\s+/).length;

  const processed: ProcessedDocument = {
    fullText: cleanedText,
    chunks,
    metadata: {
      totalWords: wordCount,
      totalCharacters: cleanedText.length,
      totalChunks: chunks.length,
      processingDate: new Date()
    }
  };

  console.log(`📊 Document processing complete:`, {
    words: wordCount,
    characters: cleanedText.length,
    chunks: chunks.length
  });

  return processed;
}
