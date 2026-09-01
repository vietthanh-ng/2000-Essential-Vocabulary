export interface Topic {
  id: string;
  name: string;
  icon: string;
  description?: string;
  keywords?: string[];
  category?: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleVi?: string;
  topicId: string;
  createdAt: string;
  levelGrade?: 1 | 2 | 3 | 4; // 1: Chưa nhớ, 2: Hơi khó, 3: Nhớ tốt, 4: Thành thạo
  usageWhen?: string;
  nuances?: string[];
  synonyms?: string[];
  senses?: any[];
  collocations?: any[];
  notes?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Master";
  tags?: string[];
}

export interface SRSItem {
  wordId: string;
  repetition: number;
  interval: number; // in days
  easeFactor: number; // default: 2.5
  nextReviewDate: string; // ISO string YYYY-MM-DD
  history: {
    reviewedAt: string;
    grade: number; // 1 to 4
    mode?: string;
  }[];
}

export interface TopicMetrics extends Topic {
  totalWords: number;
  dueWords: number;
  learnedWords: number;
  masteredWords: number;
  masteryPercentage: number; // 0 - 100
  masteryRate?: number;
}

export type LearningMode = "dictation" | "cloze" | "flashcard";

export interface WordWithSRS extends VocabularyWord {
  srs: SRSItem;
  topic?: Topic;
}

export interface LevelCategoryStats {
  level1Count: number; // Chưa nhớ (Again)
  level2Count: number; // Hơi khó (Hard)
  level3Count: number; // Nhớ tốt (Good)
  level4Count: number; // Thành thạo (Mastered)
}
