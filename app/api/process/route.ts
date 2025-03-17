import { NextRequest, NextResponse } from 'next/server'
import { validatePDFFile } from '@/lib/validation'
import { PDFProcessor } from '@/lib/pdfProcessor'
import { SearchQuerySchema } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requirements = formData.get('requirements') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file found' }, { status: 400 });
    }
    
    // Validate the PDF file
    if (!validatePDFFile(file)) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process the PDF
    const processor = new PDFProcessor();
    await processor.loadPDF(buffer);
    
    // Split requirements into individual keywords and remove "-" or "/" at the beginning
    const keywords = requirements
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .map(k => {
        if (k.startsWith('-')) return k.substring(1).trim();
        if (k.startsWith('/')) return k.substring(1).trim();
        return k.trim();
      });

    console.log('Searching for keywords:', keywords);

    // Search for each keyword
    const searchResults = processor.searchKeywords(keywords);
    
    // Format the results
    const allMatches = keywords.map(keyword => {
      const matches = searchResults[keyword] || [];

      if (matches.length === 0) {
        return `No matches for: "${keyword}"`;
      }

      // Extract a context title for the keyword
      const contextTitle = processor.extractContextTitle(keyword) || `Information about ${keyword}`;

      // Format each match with keyword header and context title
      return `## ${contextTitle}\n\n` + 
        matches.slice(0, 1).map(match => formatText(match, 80)).join('\n\n');
    });

    // Combine all results
    const formattedResult = allMatches.join('\n\n');

    return NextResponse.json({
      technical_details: formattedResult,
      success: true
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ 
      technical_details: 'Processing error: ' + (error instanceof Error ? error.message : String(error)),
      success: false
    }, { status: 500 });
  }
}

function formatText(text: string, maxLength: number): string {
  // Remove excess whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Check for reference numbers at the beginning
  const refMatch = cleanText.match(/^(\d+[-\s]*\d*\s+(?:Seite\s+\d+\s+\/\s+)?\d+)/);
  const reference = refMatch ? refMatch[1] + '\n' : '';
  const remainingText = refMatch ? cleanText.slice(refMatch[1].length).trim() : cleanText;

  // Split the text into lines that are not longer than maxLength
  const words = remainingText.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return reference + lines.join('\n');
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
} 