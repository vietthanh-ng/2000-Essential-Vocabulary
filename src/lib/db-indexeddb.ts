import Dexie, { Table } from "dexie";
import { Topic, VocabularyWord, SRSItem, TopicMetrics, WordWithSRS, LevelCategoryStats } from "@/types/schema";
import { calculateSM2 } from "./sm2";
import { autoCategorizeWord } from "./categorizer";
import oxfordSeedData from "@/data/oxford-3000-data.json";

class VocabularyDB extends Dexie {
  topics!: Table<Topic, string>;
  words!: Table<VocabularyWord, string>;
  srs!: Table<SRSItem, string>;

  constructor() {
    super("IELTSVocabularyDB_V3");
    this.version(1).stores({
      topics: "&id, name, icon",
      words: "&id, word, topicId, levelGrade, createdAt",
      srs: "&wordId, nextReviewDate, repetition, interval",
    });
  }
}

export const db = new VocabularyDB();

/**
 * Initializes Dexie IndexedDB with seed data from Oxford 3,000 JSON
 */
export async function initializeDatabase(): Promise<void> {
  if (typeof window === "undefined") return;

  const topicCount = await db.topics.count();
  if (topicCount === 0) {
    const topics: Topic[] = (oxfordSeedData.topics || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      icon: t.icon || "BookOpen",
      description: t.description || `Chủ đề từ vựng ${t.name}`,
      keywords: t.keywords || [],
      category: t.category || "IELTS Core Topics",
    }));

    if (topics.length > 0) {
      await db.topics.bulkAdd(topics);
    }
  }

  const wordCount = await db.words.count();
  if (wordCount === 0) {
    const today = new Date().toISOString().split("T")[0];
    const words: VocabularyWord[] = (oxfordSeedData.words || []).map((w: any) => ({
      id: w.id,
      word: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech || "n",
      meaning: w.meaning,
      example: w.example,
      exampleVi: w.exampleVi,
      topicId: w.topicId,
      createdAt: w.createdAt || new Date().toISOString(),
      levelGrade: undefined, // initially unassigned
      usageWhen: w.usageWhen,
      nuances: w.nuances || [],
      synonyms: w.synonyms || [],
    }));

    if (words.length > 0) {
      await db.words.bulkAdd(words);

      const initialSRS: SRSItem[] = words.map((w) => ({
        wordId: w.id,
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: today,
        history: [],
      }));

      await db.srs.bulkAdd(initialSRS);
    }
  } else {
    // Automatically sync/refresh existing words with updated authentic sentences from oxfordSeedData
    const seedMap = new Map((oxfordSeedData.words || []).map((w: any) => [w.id, w]));
    const allWords = await db.words.toArray();
    let updated = false;
    for (const w of allWords) {
      const seed = seedMap.get(w.id);
      if (seed) {
        if (
          w.example !== seed.example ||
          w.exampleVi !== seed.exampleVi ||
          w.meaning !== seed.meaning
        ) {
          w.example = seed.example;
          w.exampleVi = seed.exampleVi;
          w.meaning = seed.meaning;
          w.synonyms = seed.synonyms || [];
          w.usageWhen = seed.usageWhen;
          w.nuances = seed.nuances || [];
          updated = true;
        }
      }
    }
    if (updated) {
      await db.words.bulkPut(allWords);
    }
  }
}

/**
 * Fetches dashboard summary and level distribution
 */
export async function getDashboardSummary() {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  const allWords = await db.words.toArray();
  const allSRS = await db.srs.toArray();

  let level1Count = 0; // Chưa nhớ (Again)
  let level2Count = 0; // Hơi khó (Hard)
  let level3Count = 0; // Nhớ tốt (Good)
  let level4Count = 0; // Thành thạo (Mastered)
  let unassignedCount = 0;
  let dueWords = 0;

  const srsMap = new Map<string, SRSItem>(allSRS.map((s) => [s.wordId, s]));

  allWords.forEach((w) => {
    const srs = srsMap.get(w.id);
    if (srs && srs.nextReviewDate <= today) {
      dueWords++;
    }

    if (w.levelGrade === 1) level1Count++;
    else if (w.levelGrade === 2) level2Count++;
    else if (w.levelGrade === 3) level3Count++;
    else if (w.levelGrade === 4) level4Count++;
    else unassignedCount++;
  });

  const totalWords = allWords.length;
  const learnedWords = level1Count + level2Count + level3Count + level4Count;
  const masteryRate = totalWords > 0 ? Math.round((level4Count / totalWords) * 100) : 0;

  return {
    totalWords,
    dueWords,
    learnedWords,
    masteredWords: level4Count,
    unassignedCount,
    masteryRate,
    level1Count,
    level2Count,
    level3Count,
    level4Count,
  };
}

/**
 * Fetches all topics with calculated metrics
 */
export async function getTopicsWithMetrics(): Promise<TopicMetrics[]> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  const allTopics = await db.topics.toArray();
  const allWords = await db.words.toArray();
  const allSRS = await db.srs.toArray();

  const srsMap = new Map<string, SRSItem>(allSRS.map((s) => [s.wordId, s]));

  return allTopics.map((topic) => {
    const topicWords = allWords.filter((w) => w.topicId === topic.id);
    const totalWords = topicWords.length;

    let dueWords = 0;
    let learnedWords = 0;
    let masteredWords = 0;

    topicWords.forEach((w) => {
      const srs = srsMap.get(w.id);
      if (srs && srs.nextReviewDate <= today) dueWords++;
      if (w.levelGrade !== undefined) learnedWords++;
      if (w.levelGrade === 4) masteredWords++;
    });

    const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

    return {
      ...topic,
      totalWords,
      dueWords,
      learnedWords,
      masteredWords,
      masteryPercentage,
      masteryRate: masteryPercentage,
    };
  });
}

/**
 * Retrieves due words for a specific topic or globally
 */
export async function getDueWords(topicId?: string): Promise<WordWithSRS[]> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  let words = await db.words.toArray();
  if (topicId && topicId !== "all") {
    words = words.filter((w) => w.topicId === topicId);
  }

  const topics = await db.topics.toArray();
  const topicMap = new Map<string, Topic>(topics.map((t) => [t.id, t]));

  const allSRS = await db.srs.toArray();
  const srsMap = new Map<string, SRSItem>(allSRS.map((s) => [s.wordId, s]));

  const dueList: WordWithSRS[] = [];

  words.forEach((word) => {
    const srs = srsMap.get(word.id) || {
      wordId: word.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };

    if (srs.nextReviewDate <= today) {
      dueList.push({
        ...word,
        srs,
        topic: topicMap.get(word.topicId),
      });
    }
  });

  return dueList;
}

/**
 * Returns a batch of ~15 words for a specific topic.
 *
 * QUY TẮC BỐC TỪ THÔNG MINH:
 * - LOẠI BỎ các từ đã đạt Mức 4 (Đã thuộc/thành thạo).
 * - ƯU TIÊN các từ đang ở Mức 1 (Chưa nhớ) -> Mức 2 (Hơi khó) -> Mức 3 (Nhớ tốt) -> Từ mới chưa học.
 * - Chỉ khi toàn bộ từ trong chủ đề đều đã đạt Mức 4 thì mới bốc lại để ôn lại.
 */
export async function getTopicBatch(topicId: string, batchSize: number = 15): Promise<{
  topic: Topic | null;
  words: WordWithSRS[];
  totalInTopic: number;
  unmasteredCount: number;
}> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  const topic = await db.topics.get(topicId);
  const wordsInTopic = await db.words.where("topicId").equals(topicId).toArray();

  const allSRS = await db.srs.toArray();
  const srsMap = new Map<string, SRSItem>(allSRS.map((s) => [s.wordId, s]));

  // Lọc ra các từ CHƯA đạt Mức 4 (tức là level 1, 2, 3 hoặc undefined)
  const unmasteredWords = wordsInTopic.filter((w) => w.levelGrade !== 4);

  // Sắp xếp ưu tiên:
  // 1. Level 1 (Chưa nhớ - ưu tiên cao nhất)
  // 2. Level 2 (Hơi khó)
  // 3. Level 3 (Nhớ tốt - cần củng cố)
  // 4. Undefined (Từ mới chưa học)
  const priorityScore = (level?: number) => {
    if (level === 1) return 1;
    if (level === 2) return 2;
    if (level === 3) return 3;
    if (level === undefined || level === null) return 4;
    return 5; // level 4
  };

  let targetList = unmasteredWords.length > 0 ? unmasteredWords : wordsInTopic;

  targetList.sort((a, b) => {
    const pA = priorityScore(a.levelGrade);
    const pB = priorityScore(b.levelGrade);
    if (pA !== pB) return pA - pB;

    const srsA = srsMap.get(a.id);
    const srsB = srsMap.get(b.id);
    const dueA = (srsA?.nextReviewDate || "") <= today ? 0 : 1;
    const dueB = (srsB?.nextReviewDate || "") <= today ? 0 : 1;
    return dueA - dueB;
  });

  const batch = targetList.slice(0, batchSize).map((w) => ({
    ...w,
    srs: srsMap.get(w.id) || {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    },
    topic: topic || undefined,
  }));

  return {
    topic: topic || null,
    words: batch,
    totalInTopic: wordsInTopic.length,
    unmasteredCount: unmasteredWords.length,
  };
}

/**
 * Switch to next topic batch of ~15 words (Finding next topic with unmastered words)
 */
export async function getNextTopicBatch(currentTopicId?: string, batchSize: number = 15): Promise<{
  topic: Topic;
  words: WordWithSRS[];
  totalInTopic: number;
  unmasteredCount: number;
}> {
  await initializeDatabase();
  const allTopics = await db.topics.toArray();

  if (allTopics.length === 0) {
    throw new Error("No topics found in database");
  }

  let curIdx = currentTopicId ? allTopics.findIndex((t) => t.id === currentTopicId) : -1;
  let nextIndex = (curIdx + 1) % allTopics.length;

  // Tìm chủ đề tiếp theo còn từ chưa thuộc (unmastered)
  let attempts = 0;
  while (attempts < allTopics.length) {
    const candidateTopic = allTopics[nextIndex];
    const candidateWords = await db.words.where("topicId").equals(candidateTopic.id).toArray();
    const hasUnmastered = candidateWords.some((w) => w.levelGrade !== 4);

    if (hasUnmastered) {
      const batchData = await getTopicBatch(candidateTopic.id, batchSize);
      return {
        topic: candidateTopic,
        words: batchData.words,
        totalInTopic: batchData.totalInTopic,
        unmasteredCount: batchData.unmasteredCount,
      };
    }

    nextIndex = (nextIndex + 1) % allTopics.length;
    attempts++;
  }

  // Nếu tất cả chủ đề đều đã học hết Mức 4, chọn chủ đề tiếp theo thông thường
  const fallbackTopic = allTopics[(curIdx + 1) % allTopics.length];
  const fallbackBatch = await getTopicBatch(fallbackTopic.id, batchSize);

  return {
    topic: fallbackTopic,
    words: fallbackBatch.words,
    totalInTopic: fallbackBatch.totalInTopic,
    unmasteredCount: fallbackBatch.unmasteredCount,
  };
}

/**
 * Direct IndexedDB query for the Library Page with real-time level filtering
 */
export async function getFilteredWordsFromIndexedDB(options?: {
  topicId?: string;
  search?: string;
  status?: string;
}): Promise<{
  items: WordWithSRS[];
  total: number;
  counts: {
    all: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    new: number;
  };
}> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  let words = await db.words.toArray();
  const allTopics = await db.topics.toArray();
  const topicMap = new Map(allTopics.map((t) => [t.id, t]));

  const allSRS = await db.srs.toArray();
  const srsMap = new Map(allSRS.map((s) => [s.wordId, s]));

  // Topic filter
  if (options?.topicId && options.topicId !== "all") {
    words = words.filter((w) => w.topicId === options.topicId);
  }

  // Search filter
  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    words = words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.example?.toLowerCase().includes(q) ||
        w.exampleVi?.toLowerCase().includes(q) ||
        w.synonyms?.some((s) => s.toLowerCase().includes(q))
    );
  }

  // Real-time counts for level tabs (Before applying statusFilter)
  const counts = {
    all: words.length,
    level1: words.filter((w) => w.levelGrade === 1).length,
    level2: words.filter((w) => w.levelGrade === 2).length,
    level3: words.filter((w) => w.levelGrade === 3).length,
    level4: words.filter((w) => w.levelGrade === 4).length,
    new: words.filter((w) => w.levelGrade === undefined || w.levelGrade === null).length,
  };

  // Status / Level filter
  if (options?.status && options.status !== "all") {
    const s = options.status;
    words = words.filter((w) => {
      if (s === "level1") return w.levelGrade === 1;
      if (s === "level2") return w.levelGrade === 2;
      if (s === "level3") return w.levelGrade === 3;
      if (s === "level4") return w.levelGrade === 4;
      if (s === "new") return w.levelGrade === undefined || w.levelGrade === null;

      const srs = srsMap.get(w.id);
      if (s === "due") return srs && srs.nextReviewDate <= today;
      if (s === "mastered") return w.levelGrade === 4 || (srs && srs.repetition >= 5 && srs.interval >= 21);
      if (s === "learning") return w.levelGrade !== undefined && w.levelGrade !== 4;
      return true;
    });
  }

  const items: WordWithSRS[] = words.map((w) => ({
    ...w,
    srs: srsMap.get(w.id) || {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    },
    topic: topicMap.get(w.topicId),
  }));

  return {
    items,
    total: items.length,
    counts,
  };
}

/**
 * Retrieves all words assigned to a specific Level (Mức 1, 2, 3, 4)
 */
export async function getWordsByLevel(level: 1 | 2 | 3 | 4): Promise<WordWithSRS[]> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];

  const words = await db.words.where("levelGrade").equals(level).toArray();
  const allTopics = await db.topics.toArray();
  const topicMap = new Map(allTopics.map((t) => [t.id, t]));

  const allSRS = await db.srs.toArray();
  const srsMap = new Map(allSRS.map((s) => [s.wordId, s]));

  return words.map((w) => ({
    ...w,
    srs: srsMap.get(w.id) || {
      wordId: w.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    },
    topic: topicMap.get(w.topicId),
  }));
}

/**
 * Deletes a word from IndexedDB
 */
export async function deleteWordFromIndexedDB(wordId: string): Promise<boolean> {
  await initializeDatabase();
  await db.words.delete(wordId);
  await db.srs.delete(wordId);
  return true;
}

/**
 * Updates word level (1: Chưa nhớ, 2: Hơi khó, 3: Nhớ tốt, 4: Thành thạo) and SM-2 schedule
 */
export async function submitWordLevelGrade(
  wordId: string,
  levelGrade: 1 | 2 | 3 | 4,
  mode: string = "flashcard"
): Promise<{ word: VocabularyWord; srs: SRSItem }> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const word = await db.words.get(wordId);
  if (!word) throw new Error("Word not found");

  word.levelGrade = levelGrade;
  await db.words.put(word);

  let srs = await db.srs.get(wordId);
  if (!srs) {
    srs = {
      wordId,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };
  }

  const sm2Grade = levelGrade === 1 ? 1 : levelGrade === 2 ? 2 : levelGrade === 3 ? 4 : 5;
  const next = calculateSM2(sm2Grade, srs.repetition, srs.interval, srs.easeFactor);

  srs.repetition = next.repetition;
  srs.interval = next.interval;
  srs.easeFactor = next.easeFactor;
  srs.nextReviewDate = next.nextReviewDate;
  srs.history.push({
    reviewedAt: now,
    grade: levelGrade,
    mode,
  });

  await db.srs.put(srs);
  return { word, srs };
}

/**
 * Quick Adds a new vocabulary word into IndexedDB
 */
export async function quickAddVocabularyWord(data: {
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  exampleVi?: string;
  topicId?: string;
  levelGrade?: 1 | 2 | 3 | 4;
  usageWhen?: string;
  nuances?: string[];
  synonyms?: string[];
}): Promise<WordWithSRS> {
  await initializeDatabase();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();
  const cleanWord = data.word.trim();

  let targetTopicId = data.topicId;
  if (!targetTopicId) {
    const allTopics = await db.topics.toArray();
    const suggested = autoCategorizeWord(cleanWord, data.meaning, allTopics);
    targetTopicId = suggested.topicId;
  }

  const existing = await db.words.where("word").equalsIgnoreCase(cleanWord).first();

  if (existing) {
    existing.ipa = data.ipa || existing.ipa;
    existing.partOfSpeech = data.partOfSpeech || existing.partOfSpeech;
    existing.meaning = data.meaning || existing.meaning;
    existing.example = data.example || existing.example;
    existing.exampleVi = data.exampleVi || existing.exampleVi;
    existing.topicId = targetTopicId;
    existing.levelGrade = data.levelGrade !== undefined ? data.levelGrade : existing.levelGrade;
    existing.usageWhen = data.usageWhen || existing.usageWhen;
    existing.nuances = data.nuances || existing.nuances;
    existing.synonyms = data.synonyms || existing.synonyms;

    await db.words.put(existing);
    const srs = (await db.srs.get(existing.id)) || {
      wordId: existing.id,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };
    return { ...existing, srs };
  } else {
    const newId = `word_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newWord: VocabularyWord = {
      id: newId,
      word: cleanWord,
      ipa: data.ipa || `/${cleanWord}/`,
      partOfSpeech: data.partOfSpeech || "n",
      meaning: data.meaning,
      example: data.example || `The term "${cleanWord}" is commonly used in IELTS contexts.`,
      exampleVi: data.exampleVi || `Thuật ngữ "${cleanWord}" thường được sử dụng trong bài thi IELTS.`,
      topicId: targetTopicId,
      createdAt: now,
      levelGrade: data.levelGrade,
      usageWhen: data.usageWhen,
      nuances: data.nuances,
      synonyms: data.synonyms,
    };

    await db.words.add(newWord);

    const newSRS: SRSItem = {
      wordId: newId,
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      history: [],
    };

    await db.srs.add(newSRS);
    return { ...newWord, srs: newSRS };
  }
}
