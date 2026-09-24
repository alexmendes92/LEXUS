import { GoogleGenAI } from "@google/genai";

export const RECOMMENDED_FLASH_MODEL = 'gemini-3.8-flash';

/**
 * Normalizes file MIME types for Gemini API.
 * In many operating systems or browsers, PDF files or image files
 * might have an empty `file.type` or non-standard types like `application/x-pdf`.
 */
export function getSafeMimeType(file: File): string {
  if (file.type && file.type.trim() !== '') {
    const lower = file.type.toLowerCase();
    if (lower.includes('pdf')) return 'application/pdf';
    if (lower.includes('png')) return 'image/png';
    if (lower.includes('jpeg') || lower.includes('jpg')) return 'image/jpeg';
    if (lower.includes('webp')) return 'image/webp';
    if (lower.includes('gif')) return 'image/gif';
    return file.type;
  }

  // Fallback by extension
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';

  // Default fallback for documents in this app
  return 'application/pdf';
}

/**
 * Converts a browser File into a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Prepares an inlineData part for Gemini generateContent
 */
export async function fileToGenerativePart(file: File): Promise<{
  inlineData: {
    mimeType: string;
    data: string;
  };
}> {
  const mimeType = getSafeMimeType(file);
  const data = await fileToBase64(file);
  return {
    inlineData: {
      mimeType,
      data
    }
  };
}

/**
 * Initializes GoogleGenAI client with the configured API key
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

/**
 * Formats file size in readable KB / MB
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
