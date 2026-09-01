export * from "./schema";

export interface WordSense {
  id?: number;
  partOfSpeech: string;
  context: string;
  definitionVi: string;
  definitionEn: string;
  nuanceExplanation?: string;
  examples: { sentenceEn: string; sentenceVi: string }[];
  collocations: { collocation: string; meaningVi: string; exampleSentence?: string }[];
}

export interface ExampleSentence {
  id?: number;
  sentenceEn: string;
  sentenceVi: string;
  highlightWords?: string;
}

export interface CollocationItem {
  id?: number;
  collocation: string;
  meaningVi: string;
  exampleSentence?: string;
}

export type TopicWithStats = import("./schema").TopicMetrics;
export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface AIAnalysisResult {
  word: string;
  phoneticUs: string;
  phoneticUk: string;
  pos?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Master";
  suggestedTopicId?: string;
  tags: string[];
  meaningVi?: string;
  exampleEn?: string;
  exampleVi?: string;
  wordFamily: { word: string; partOfSpeech: string; meaningVi: string }[];
  synonyms: string[];
  antonyms: string[];
  senses: {
    partOfSpeech: string;
    context: string;
    definitionVi: string;
    definitionEn: string;
    nuanceExplanation: string;
    collocations: {
      collocation: string;
      meaningVi: string;
      exampleSentence?: string;
    }[];
    examples: {
      sentenceEn: string;
      sentenceVi: string;
    }[];
  }[];
}
