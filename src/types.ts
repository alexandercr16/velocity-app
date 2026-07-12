export type Mode = "beginner" | "medium" | "pro";

export interface ModeMeta {
  name: string;
  isTTS: boolean;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface Document {
  rawText: string;
  paragraphs: string[];
  paraWordCounts: number[];
  words: string[];
  sourceLabel: string;
  title: string;
}

export interface LibraryEntry {
  id: string;
  title: string;
  rawText: string;
  wordCount: number;
  savedAt: number;
}

export interface Settings {
  mode: Mode;
  wpm: number;
  ttsRate: number;
}

export interface LastSession {
  document: Document;
  mode: Mode;
  wpm: number;
  ttsRate: number;
  currentIndex: number;
  savedAt: number;
}
