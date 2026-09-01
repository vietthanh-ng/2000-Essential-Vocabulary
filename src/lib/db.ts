import fs from "fs";
import path from "path";
import {
  Topic,
  VocabularyWord,
  SRSItem,
  TopicWithStats,
  ReviewGrade,
  LearningMode,
  AIAnalysisResult,
} from "@/types";
import { calculateNextSRS } from "./srs";
import { autoCategorizeWord } from "./categorizer";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "vocab-store.json");

interface DatabaseSchema {
  version: string;
  nextWordId: number;
  topics: Topic[];
  words: VocabularyWord[];
  srsItems: Record<string, SRSItem>; // wordId -> SRSItem
  settings: Record<string, string>;
}

let dbCache: DatabaseSchema | null = null;

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      dbCache = JSON.parse(content);
      if (!dbCache?.topics || !dbCache?.words || !dbCache?.srsItems) {
        throw new Error("Invalid or legacy schema format");
      }

      // Sync words with Oxford seed data to ensure latest natural sentences
      const oxfordFile = path.join(process.cwd(), "src", "data", "oxford-3000-data.json");
      if (fs.existsSync(oxfordFile)) {
        try {
          const oxfordData = JSON.parse(fs.readFileSync(oxfordFile, "utf-8"));
          const seedMap = new Map((oxfordData.words || []).map((w: any) => [w.id, w]));
          let updated = false;
          dbCache.words.forEach((w) => {
            const seed: any = seedMap.get(w.id);
            if (seed && (w.example !== seed.example || w.exampleVi !== seed.exampleVi || w.meaning !== seed.meaning)) {
              w.example = seed.example;
              w.exampleVi = seed.exampleVi;
              w.meaning = seed.meaning;
              w.synonyms = seed.synonyms || [];
              w.usageWhen = seed.usageWhen;
              w.nuances = seed.nuances || [];
              updated = true;
            }
          });
          if (updated) {
            persistDatabase();
          }
        } catch (e) {
          console.error("Error syncing oxford seed in db.ts:", e);
        }
      }
    } catch (e) {
      console.warn("Could not read db file, initializing with Oxford 3000 data:", e);
      dbCache = initDatabaseFromOxford();
      persistDatabase();
    }
  } else {
    dbCache = initDatabaseFromOxford();
    persistDatabase();
  }

  // Ensure all words have SRS items
  ensureSRSInitialized(dbCache!);
  return dbCache!;
}

function initDatabaseFromOxford(): DatabaseSchema {
  const oxfordFile = path.join(process.cwd(), "src", "data", "oxford-3000-data.json");
  let topics: Topic[] = [];
  let words: VocabularyWord[] = [];

  if (fs.existsSync(oxfordFile)) {
    try {
      const oxfordData = JSON.parse(fs.readFileSync(oxfordFile, "utf-8"));
      topics = oxfordData.topics || [];
      words = oxfordData.words || [];
    } catch (err) {
      console.error("Error reading Oxford 3000 seed file:", err);
    }
  }

  // Default initial topic if empty
  if (topics.length === 0) {
    topics = [
      {
        id: "topic_1_education_supplies",
        name: "Từ vựng về đồ dùng học tập",
        icon: "GraduationCap",
        category: "Education & Academic",
        description: "Từ vựng cơ bản và nâng cao chủ đề giáo dục và học tập.",
      },
    ];
  }

  const srsItems: Record<string, SRSItem> = {};
  const today = getTodayDateString();

  words.forEach((w) => {
    srsItems[w.id] = {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };
  });

  return {
    version: "2.0",
    nextWordId: words.length + 1,
    topics,
    words,
    srsItems,
    settings: {
      daily_goal: "20",
      default_voice: "en-US",
    },
  };
}

function ensureSRSInitialized(db: DatabaseSchema) {
  const today = getTodayDateString();
  let modified = false;

  db.words.forEach((w) => {
    if (!db.srsItems[w.id]) {
      db.srsItems[w.id] = {
        wordId: w.id,
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: today,
        history: [],
      };
      modified = true;
    }
  });

  if (modified) {
    persistDatabase();
  }
}

function persistDatabase() {
  if (!dbCache) return;
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error("Error persisting database to disk:", e);
  }
}

// ----------------------------------------------------
// Topic Queries
// ----------------------------------------------------

export function getAllTopicsWithStats(): TopicWithStats[] {
  const db = loadDatabase();
  const today = getTodayDateString();

  return db.topics.map((t) => {
    const topicWords = db.words.filter((w) => w.topicId === t.id);
    const totalWords = topicWords.length;

    let learnedWords = 0;
    let dueWords = 0;
    let masteredWords = 0;

    topicWords.forEach((w) => {
      const srs = db.srsItems[w.id];
      if (srs) {
        if (srs.repetition > 0) learnedWords++;
        if (srs.nextReviewDate <= today) dueWords++;
        if (srs.repetition >= 5 && srs.interval >= 21) masteredWords++;
      }
    });

    const masteryRate = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

    return {
      ...t,
      totalWords,
      learnedWords,
      dueWords,
      masteredWords,
      masteryRate,
      masteryPercentage: masteryRate,
    };
  });
}

export function getTopicById(topicId: string): Topic | null {
  const db = loadDatabase();
  return db.topics.find((t) => t.id === topicId) || null;
}

// ----------------------------------------------------
// Word Queries
// ----------------------------------------------------

export function getWords(options?: {
  topicId?: string;
  search?: string;
  status?: "all" | "due" | "learning" | "mastered" | "new" | "level1" | "level2" | "level3" | "level4" | string;
  limit?: number;
  offset?: number;
}): { items: (VocabularyWord & { srs: SRSItem })[]; total: number } {
  const db = loadDatabase();
  const today = getTodayDateString();

  let filtered = db.words;

  if (options?.topicId && options.topicId !== "all") {
    filtered = filtered.filter((w) => w.topicId === options.topicId);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (options?.status && options.status !== "all") {
    filtered = filtered.filter((w) => {
      const srs = db.srsItems[w.id];
      if (options.status === "level1") return w.levelGrade === 1;
      if (options.status === "level2") return w.levelGrade === 2;
      if (options.status === "level3") return w.levelGrade === 3;
      if (options.status === "level4") return w.levelGrade === 4;

      if (!srs) return options.status === "new";

      if (options.status === "due") return srs.nextReviewDate <= today;
      if (options.status === "mastered") return srs.repetition >= 5 && srs.interval >= 21;
      if (options.status === "learning") return srs.repetition > 0 && !(srs.repetition >= 5 && srs.interval >= 21);
      if (options.status === "new") return srs.repetition === 0;
      return true;
    });
  }

  const total = filtered.length;
  if (options?.offset) filtered = filtered.slice(options.offset);
  if (options?.limit) filtered = filtered.slice(0, options.limit);

  const items = filtered.map((w) => ({
    ...w,
    srs: db.srsItems[w.id] || {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    },
  }));

  return { items, total };
}

export function getDueWordsForStudy(topicId?: string): (VocabularyWord & { srs: SRSItem })[] {
  const db = loadDatabase();
  const today = getTodayDateString();

  let candidateWords = db.words;
  if (topicId && topicId !== "all") {
    candidateWords = candidateWords.filter((w) => w.topicId === topicId);
  }

  // Filter words where nextReviewDate <= today
  const due = candidateWords.filter((w) => {
    const srs = db.srsItems[w.id];
    return !srs || srs.nextReviewDate <= today;
  });

  return due.map((w) => ({
    ...w,
    srs: db.srsItems[w.id] || {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    },
  }));
}

export function getWordById(wordId: string): (VocabularyWord & { srs: SRSItem }) | null {
  const db = loadDatabase();
  const word = db.words.find((w) => w.id === wordId);
  if (!word) return null;
  return {
    ...word,
    srs: db.srsItems[word.id] || {
      wordId: word.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: getTodayDateString(),
      history: [],
    },
  };
}

export function getWordByText(text: string): (VocabularyWord & { srs: SRSItem }) | null {
  const db = loadDatabase();
  const clean = text.trim().toLowerCase();
  const word = db.words.find((w) => w.word.toLowerCase() === clean);
  if (!word) return null;
  return {
    ...word,
    srs: db.srsItems[word.id] || {
      wordId: word.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: getTodayDateString(),
      history: [],
    },
  };
}

// ----------------------------------------------------
// Word Management & Quick Add
// ----------------------------------------------------

export function addOrUpdateWord(
  data: {
    word: string;
    ipa?: string;
    pos?: string;
    meaning: string;
    example?: string;
    exampleVi?: string;
    topicId?: string;
    difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Master";
    tags?: string[];
    senses?: any[];
    collocations?: any[];
    notes?: string;
  }
): VocabularyWord & { srs: SRSItem } {
  const db = loadDatabase();
  const cleanWord = data.word.trim();
  const today = getTodayDateString();
  const now = new Date().toISOString();

  // If topicId not provided, auto-categorize
  let targetTopicId = data.topicId;
  if (!targetTopicId) {
    const autoCat = autoCategorizeWord(cleanWord, data.meaning, db.topics);
    targetTopicId = autoCat.topicId;
  }

  // Check if exists
  const existingIdx = db.words.findIndex((w) => w.word.toLowerCase() === cleanWord.toLowerCase());

  if (existingIdx >= 0) {
    const existing = db.words[existingIdx];
    existing.ipa = data.ipa || existing.ipa;
    existing.partOfSpeech = data.pos || existing.partOfSpeech;
    existing.meaning = data.meaning || existing.meaning;
    existing.example = data.example || existing.example;
    existing.exampleVi = data.exampleVi || existing.exampleVi;
    existing.topicId = targetTopicId;
    existing.difficulty = data.difficulty || existing.difficulty;
    existing.tags = data.tags || existing.tags;
    existing.senses = data.senses || existing.senses;
    existing.collocations = data.collocations || existing.collocations;
    existing.notes = data.notes !== undefined ? data.notes : existing.notes;

    persistDatabase();
    return getWordById(existing.id)!;
  } else {
    const newWord: VocabularyWord = {
      id: `word_${db.nextWordId++}`,
      word: cleanWord,
      ipa: data.ipa || `/${cleanWord}/`,
      partOfSpeech: data.pos || "n",
      meaning: data.meaning,
      example: data.example || `The word "${cleanWord}" is frequently tested in IELTS exams.`,
      exampleVi: data.exampleVi,
      topicId: targetTopicId,
      createdAt: now,
      difficulty: data.difficulty || "Intermediate",
      tags: data.tags || [],
      senses: data.senses,
      collocations: data.collocations,
      notes: data.notes,
    };

    db.words.unshift(newWord);
    db.srsItems[newWord.id] = {
      wordId: newWord.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };

    persistDatabase();
    return getWordById(newWord.id)!;
  }
}

export function deleteWord(wordId: string): boolean {
  const db = loadDatabase();
  const initLen = db.words.length;
  db.words = db.words.filter((w) => w.id !== wordId);
  delete db.srsItems[wordId];

  if (db.words.length < initLen) {
    persistDatabase();
    return true;
  }
  return false;
}

// ----------------------------------------------------
// SRS Review Updates
// ----------------------------------------------------

export function updateSRSGrade(
  wordId: string,
  grade: ReviewGrade,
  mode: LearningMode = "flashcard"
): SRSItem {
  const db = loadDatabase();
  const today = getTodayDateString();
  const now = new Date().toISOString();

  let srs = db.srsItems[wordId];
  if (!srs) {
    srs = {
      wordId,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };
    db.srsItems[wordId] = srs;
  }

  // Calculate new SM-2 schedule
  const next = calculateNextSRS(grade, srs.repetition, srs.interval, srs.easeFactor);

  srs.repetition = next.repetition;
  srs.interval = next.interval;
  srs.easeFactor = next.easeFactor;
  srs.nextReviewDate = next.nextReviewDate;
  srs.history.push({
    reviewedAt: now,
    grade,
    mode,
  });

  persistDatabase();
  return srs;
}

// ----------------------------------------------------
// Global Learning Stats
// ----------------------------------------------------

export function getGlobalStats() {
  const db = loadDatabase();
  const today = getTodayDateString();

  const totalWords = db.words.length;
  let dueWords = 0;
  let learnedWords = 0;
  let masteredWords = 0;
  let studiedTodayCount = 0;

  const reviewDatesSet = new Set<string>();

  Object.values(db.srsItems).forEach((srs) => {
    if (srs.nextReviewDate <= today) dueWords++;
    if (srs.repetition > 0) learnedWords++;
    if (srs.repetition >= 5 && srs.interval >= 21) masteredWords++;

    srs.history?.forEach((h) => {
      const dateStr = h.reviewedAt.split("T")[0];
      reviewDatesSet.add(dateStr);
      if (dateStr === today) studiedTodayCount++;
    });
  });

  // Calculate streak
  const sortedDates = Array.from(reviewDatesSet).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cur = new Date();

  if (!reviewDatesSet.has(today)) {
    cur.setDate(cur.getDate() - 1);
  }

  while (true) {
    const curStr = cur.toISOString().split("T")[0];
    if (reviewDatesSet.has(curStr)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }

  const dailyGoal = parseInt(db.settings.daily_goal || "20", 10);

  return {
    totalWords,
    dueWords,
    learnedWords,
    masteredWords,
    totalTopics: db.topics.length,
    studiedTodayCount,
    dailyGoal,
    streak,
  };
}

export function getAppSetting(key: string): string | null {
  const db = loadDatabase();
  return db.settings[key] || null;
}

export function setAppSetting(key: string, value: string) {
  const db = loadDatabase();
  db.settings[key] = value;
  persistDatabase();
}
