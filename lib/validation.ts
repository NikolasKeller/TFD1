import { z } from 'zod';

// Validierungsschema für PDF-Dateien
export function validatePDFFile(file: File | null): boolean {
  if (!file) return false;
  
  // Überprüfe den MIME-Typ
  if (file.type !== 'application/pdf') return false;
  
  // Überprüfe die Dateigröße (max. 10 MB)
  const maxSize = 10 * 1024 * 1024; // 10 MB in Bytes
  if (file.size > maxSize) return false;
  
  return true;
}

// Validierungsschema für Suchanfragen
export const SearchQuerySchema = z.object({
  keywords: z.string().min(1, "Please enter at least one keyword"),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>; 