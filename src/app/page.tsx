"use client";

import React, { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import FocusedTopicSection from "@/components/FocusedTopicSection";
import LevelCategorySection from "@/components/LevelCategorySection";
import TopicCardGrid from "@/components/TopicCardGrid";
import ActiveStudySession from "@/components/ActiveStudySession";
import {
  getTopicsWithMetrics,
  getDashboardSummary,
  getTopicBatch,
  getNextTopicBatch,
  getWordsByLevel,
  getDueWords,
  db,
} from "@/lib/db-indexeddb";
import { TopicMetrics, WordWithSRS, Topic } from "@/types/schema";

export default function DashboardPage() {
  const [topics, setTopics] = useState<TopicMetrics[]>([]);
  const [stats, setStats] = useState({
    totalWords: 0,
    dueWords: 0,
    learnedWords: 0,
    masteredWords: 0,
    unassignedCount: 0,
    masteryRate: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    level4Count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Current Focused Topic Batch (~15 words)
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [batchWords, setBatchWords] = useState<WordWithSRS[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(false);

  // Active study session modal
  const [activeSession, setActiveSession] = useState<{
    isOpen: boolean;
    words: WordWithSRS[];
    topicName?: string;
  }>({
    isOpen: false,
    words: [],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [topicsData, summaryData] = await Promise.all([
        getTopicsWithMetrics(),
        getDashboardSummary(),
      ]);

      setTopics(topicsData);
      setStats(summaryData);

      // Load initial batch for the first topic
      if (topicsData.length > 0) {
        const firstTopic = topicsData[0];
        const batchData = await getTopicBatch(firstTopic.id, 15);
        setCurrentTopic(firstTopic);
        setBatchWords(batchData.words);
      }
    } catch (err) {
      console.error("Error loading initial data from IndexedDB:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNextTopic = async () => {
    try {
      setLoadingBatch(true);
      const nextBatch = await getNextTopicBatch(currentTopic?.id, 15);
      setCurrentTopic(nextBatch.topic);
      setBatchWords(nextBatch.words);
    } catch (err) {
      console.error("Error switching to next topic:", err);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleStartStudyBatch = () => {
    if (batchWords.length === 0) return;
    setActiveSession({
      isOpen: true,
      words: batchWords,
      topicName: `Chủ đề: ${currentTopic?.name || "IELTS Oxford"} (${batchWords.length} từ)`,
    });
  };

  const handleStudyLevel = async (level: 1 | 2 | 3 | 4, label: string) => {
    const levelWords = await getWordsByLevel(level);
    if (levelWords.length === 0) return;

    setActiveSession({
      isOpen: true,
      words: levelWords,
      topicName: `Ôn tập ${label} (${levelWords.length} từ)`,
    });
  };

  const handleStartStudyTopic = async (topicId: string) => {
    const batchData = await getTopicBatch(topicId, 15);
    const targetTopic = topics.find((t) => t.id === topicId) || null;

    setCurrentTopic(targetTopic);
    setBatchWords(batchData.words);

    setActiveSession({
      isOpen: true,
      words: batchData.words,
      topicName: `Chủ đề: ${targetTopic?.name || "IELTS Oxford"} (15 từ)`,
    });
  };

  const handleStartStudyAll = async () => {
    if (batchWords.length > 0) {
      handleStartStudyBatch();
    } else {
      handleSwitchNextTopic();
    }
  };

  const refreshAll = async () => {
    const [topicsData, summaryData] = await Promise.all([
      getTopicsWithMetrics(),
      getDashboardSummary(),
    ]);
    setTopics(topicsData);
    setStats(summaryData);

    if (currentTopic) {
      const batchData = await getTopicBatch(currentTopic.id, 15);
      setBatchWords(batchData.words);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      {/* 1. Header Overview Stats */}
      <DashboardHeader stats={stats} onStartStudyAll={handleStartStudyAll} />

      {/* 2. Focused Topic Learning Section (~15 words batch + Next Topic Button) */}
      <FocusedTopicSection
        currentTopic={currentTopic}
        batchWords={batchWords}
        loadingBatch={loadingBatch}
        onSwitchNextTopic={handleSwitchNextTopic}
        onStartStudyBatch={handleStartStudyBatch}
      />

      {/* 3. Four Level Categories Section (Mức 1 Chưa nhớ, Mức 2 Hơi khó, Mức 3 Nhớ tốt, Mức 4 Thành thạo) */}
      <LevelCategorySection
        stats={{
          level1Count: stats.level1Count,
          level2Count: stats.level2Count,
          level3Count: stats.level3Count,
          level4Count: stats.level4Count,
        }}
        onStudyLevel={handleStudyLevel}
      />

      {/* 4. Full Oxford Topics Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang đồng bộ dữ liệu IndexedDB...</p>
        </div>
      ) : (
        <TopicCardGrid
          topics={topics}
          onSelectTopicForStudy={handleStartStudyTopic}
        />
      )}

      {/* 5. Active Study Session Modal (Dictation full sentence -> Cloze -> Flashcard) */}
      {activeSession.isOpen && (
        <ActiveStudySession
          words={activeSession.words}
          topicName={activeSession.topicName}
          onClose={() => setActiveSession({ isOpen: false, words: [] })}
          onSessionComplete={refreshAll}
        />
      )}
    </div>
  );
}
