// src/lib/moderation/filter.ts

// Add bad words in Kabyle, French, Arabic, and English here
export const BANNED_WORDS = [
  "insult1", 
  "insult2", 
  "spam",
  "scam",
  "idiot",
  "stupid",
  "connard",
  "abruti",
  "ahbal", // Kabyle/Arabic insult
  "thagwath", // Example Kabyle bad word
  "http://spamlink.com"
];

export function containsBannedWords(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check if any banned word is inside the text
  return BANNED_WORDS.some(word => lowerText.includes(word));
}