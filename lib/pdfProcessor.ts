import { extractTextFromPDF } from './pdf-utils';

export class PDFProcessor {
  private pdfText: string = '';
  
  async loadPDF(buffer: Buffer): Promise<void> {
    this.pdfText = await extractTextFromPDF(buffer);
  }
  
  searchKeywords(keywords: string[]): Record<string, string[]> {
    const results: Record<string, string[]> = {};
    
    for (const keyword of keywords) {
      const cleanKeyword = keyword.trim();
      if (!cleanKeyword) continue;
      
      const sentences = this.pdfText.split(/[.!?\n]/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0);
      
      const matches = sentences.filter(sentence => 
        sentence.toLowerCase().includes(cleanKeyword.toLowerCase())
      );
      
      results[cleanKeyword] = matches;
    }
    
    return results;
  }
  
  extractContextTitle(keyword: string): string | null {
    // List of known headings/categories
    const knownHeadings = [
      'Heat Recovery',
      'Drive Module',
      'Process Data Interfaces',
      'Control and Visualization',
      'Technical Data',
      'Energy Efficiency',
      'Dimensions',
      'Performance Features',
      'Safety Devices'
    ];
    
    // Split the text into lines
    const lines = this.pdfText.split('\n');
    
    // Find the line with the keyword
    let keywordLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        keywordLineIndex = i;
        break;
      }
    }
    
    if (keywordLineIndex === -1) return null;
    
    // Search backwards for a heading
    for (let i = keywordLineIndex; i >= 0; i--) {
      const line = lines[i].trim();
      
      // Check if the line contains a known heading
      for (const heading of knownHeadings) {
        if (line.includes(heading)) {
          return heading;
        }
      }
      
      // Check if the line looks like a heading (e.g., uppercase, short)
      if (
        (line === line.toUpperCase() && line.length > 3 && line.length < 30) ||
        (line.match(/^\d+\.\s+[A-Z]/) && line.length < 50)
      ) {
        return line;
      }
    }
    
    return null;
  }
} 