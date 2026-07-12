// Lightweight, dependency-free language guess so the Read Aloud voice list can
// default to voices that match the loaded text instead of a fixed locale.
// Not a substitute for a real language-ID model — good enough to pick between
// a handful of major languages/scripts.

const SCRIPT_RANGES: Array<{ code: string; test: RegExp }> = [
  { code: "ja", test: /[぀-ヿ]/ }, // Hiragana / Katakana
  { code: "ko", test: /[가-힯]/ }, // Hangul
  { code: "zh", test: /[一-鿿]/ }, // CJK Unified Ideographs
  { code: "ru", test: /[Ѐ-ӿ]/ }, // Cyrillic
  { code: "ar", test: /[؀-ۿ]/ }, // Arabic
  { code: "he", test: /[֐-׿]/ }, // Hebrew
  { code: "el", test: /[Ͱ-Ͽ]/ }, // Greek
  { code: "hi", test: /[ऀ-ॿ]/ }, // Devanagari
];

const STOPWORDS: Record<string, string[]> = {
  en: ["the", "and", "is", "of", "to", "in", "that", "it", "was", "for", "with", "as", "on", "are", "this"],
  es: ["el", "la", "de", "que", "y", "en", "los", "las", "un", "una", "es", "por", "con", "para", "su"],
  fr: ["le", "la", "de", "et", "les", "des", "un", "une", "est", "que", "en", "pour", "dans", "au", "du"],
  de: ["der", "die", "das", "und", "ist", "zu", "den", "mit", "des", "dem", "ein", "eine", "nicht", "auf", "für"],
  it: ["il", "la", "di", "che", "e", "un", "una", "per", "con", "non", "in", "del", "della", "le", "gli"],
  pt: ["o", "a", "de", "que", "e", "do", "da", "em", "um", "uma", "para", "com", "não", "os", "as"],
  nl: ["de", "het", "een", "en", "van", "is", "dat", "in", "op", "voor", "niet", "met", "zijn", "aan"],
};

export function detectLanguageCode(text: string): string {
  const sample = (text || "").slice(0, 2000);
  for (const { code, test } of SCRIPT_RANGES) {
    if (test.test(sample)) return code;
  }

  const words = sample.toLowerCase().match(/[a-zà-ÿ']+/g) || [];
  if (!words.length) return "en";
  const sampleWords = words.slice(0, 400);

  let bestCode = "en";
  let bestScore = -1;
  for (const [code, list] of Object.entries(STOPWORDS)) {
    const set = new Set(list);
    let score = 0;
    for (const w of sampleWords) if (set.has(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestCode = code;
    }
  }
  return bestScore > 0 ? bestCode : "en";
}
