"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Headphones,
  Edit3,
  Layers,
  RotateCw,
  Volume2,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { speakText } from "@/lib/speech";
import { WordWithSRS, LearningMode } from "@/types/schema";
import {
  getTopicBatch,
  getNextTopicBatch,
  getWordsByLevel,
  submitWordLevelGrade,
  getTopicsWithMetrics,
} from "@/lib/db-indexeddb";

function LearnContent() {
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get("topicId") || undefined;
  const initialLevel = searchParams.get("level") ? (parseInt(searchParams.get("level")!, 10) as 1 | 2 | 3 | 4) : undefined;

  const [words, setWords] = useState<WordWithSRS[]>([]);
  const [currentTopicName, setCurrentTopicName] = useState<string>("");
  const [currentTopicId, setCurrentTopicId] = useState<string | undefined>(initialTopicId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<LearningMode>("dictation");
  const [isFlipped, setIsFlipped] = useState(false);

  // Dictation 2 Rows State
  const [dictationWordInput, setDictationWordInput] = useState("");
  const [dictationWordChecked, setDictationWordChecked] = useState(false);
  const [isWordCorrect, setIsWordCorrect] = useState(false);

  const [dictationSentenceInput, setDictationSentenceInput] = useState("");
  const [dictationSentenceChecked, setDictationSentenceChecked] = useState(false);
  const [isSentenceCorrect, setIsSentenceCorrect] = useState(false);

  // Cloze State
  const [clozeInput, setClozeInput] = useState("");
  const [clozeChecked, setClozeChecked] = useState(false);
  const [isClozeCorrect, setIsClozeCorrect] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadSessionWords();
  }, [currentTopicId, initialLevel]);

  const loadSessionWords = async () => {
    setLoading(true);
    setCompleted(false);
    setCurrentIndex(0);
    resetExerciseState();

    try {
      if (initialLevel) {
        const levelWords = await getWordsByLevel(initialLevel);
        setWords(levelWords);
        setCurrentTopicName(`Mức độ ${initialLevel} (${levelWords.length} từ)`);
      } else {
        const allTopics = await getTopicsWithMetrics();
        const targetId = currentTopicId || allTopics[0]?.id;
        if (targetId) {
          const batchData = await getTopicBatch(targetId, 15);
          setWords(batchData.words);
          setCurrentTopicName(batchData.topic?.name || "Chủ đề IELTS");
          setCurrentTopicId(targetId);
        }
      }
    } catch (err) {
      console.error("Error loading session words:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextTopic = async () => {
    try {
      setLoading(true);
      const nextData = await getNextTopicBatch(currentTopicId, 15);
      setWords(nextData.words);
      setCurrentTopicName(nextData.topic.name);
      setCurrentTopicId(nextData.topic.id);
      setCurrentIndex(0);
      setCompleted(false);
      resetExerciseState();
    } catch (err) {
      console.error("Error switching topic:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  useEffect(() => {
    resetExerciseState();
    if (activeMode === "dictation" && currentWord) {
      const sentenceToRead = currentWord.example || currentWord.word;
      speakText(sentenceToRead);
    }
  }, [currentIndex, activeMode]);

  const resetExerciseState = () => {
    setDictationWordInput("");
    setDictationWordChecked(false);
    setIsWordCorrect(false);

    setDictationSentenceInput("");
    setDictationSentenceChecked(false);
    setIsSentenceCorrect(false);

    setClozeInput("");
    setClozeChecked(false);
    setIsClozeCorrect(false);

    setIsFlipped(false);
  };

  const handleCheckWord = () => {
    if (!currentWord || !dictationWordInput.trim()) return;
    const cleanUser = dictationWordInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    setIsWordCorrect(cleanUser === cleanTarget);
    setDictationWordChecked(true);
  };

  const handleCheckSentence = () => {
    if (!currentWord || !dictationSentenceInput.trim()) return;
    const cleanUser = dictationSentenceInput.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
    const cleanTarget = (currentWord.example || currentWord.word).trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
    setIsSentenceCorrect(cleanUser === cleanTarget);
    setDictationSentenceChecked(true);
  };

  const handleCheckCloze = () => {
    if (!currentWord || !clozeInput.trim()) return;
    const cleanUser = clozeInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    setIsClozeCorrect(cleanUser === cleanTarget);
    setClozeChecked(true);
  };

  const handleLevelGrade = async (levelGrade: 1 | 2 | 3 | 4) => {
    if (!currentWord || submitting) return;
    setSubmitting(true);

    try {
      await submitWordLevelGrade(currentWord.id, levelGrade, activeMode);

      if (currentIndex + 1 < words.length) {
        resetExerciseState();
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCompleted(true);
        triggerConfetti();
      }
    } catch (err) {
      console.error("Error submitting grade:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const getClozeSentence = () => {
    if (!currentWord) return "";
    const ex = currentWord.example;
    const regex = new RegExp(`\\b${currentWord.word}\\b`, "gi");
    return ex.replace(regex, `[ _______ ]`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                Phòng Ôn Tập 3 Bước
              </span>
              <span className="text-xs text-slate-400">
                {words.length > 0 ? `Từ ${currentIndex + 1} / ${words.length}` : ""}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {currentTopicName}
            </h1>
          </div>
        </div>

        {/* Switch Topic Button */}
        <button
          type="button"
          onClick={handleNextTopic}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Đổi chủ đề / Học 15 từ tiếp theo</span>
        </button>
      </div>

      {/* Mode Switcher */}
      {!completed && words.length > 0 && (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveMode("dictation");
              resetExerciseState();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "dictation"
                ? "bg-white dark:bg-slate-900 text-purple-600 shadow-md"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Headphones size={15} />
            <span>1. Nghe chép chính tả</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("cloze");
              resetExerciseState();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "cloze"
                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-md"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Edit3 size={15} />
            <span>2. Điền từ vào câu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("flashcard");
              resetExerciseState();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "flashcard"
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-md"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers size={15} />
            <span>3. Thẻ Flashcard</span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {!completed && words.length > 0 && (
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      )}

      {/* Main Container */}
      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang chuẩn bị dữ liệu học tập...</p>
        </div>
      ) : completed || words.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Hoàn thành xuất sắc toàn bộ {words.length} từ! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Mức độ của từng từ vựng đã được cập nhật chính xác vào hệ thống. Bạn có thể bấm nút bên dưới để chuyển sang học ngay 15 từ của chủ đề tiếp theo!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleNextTopic}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              Học tiếp 15 từ của chủ đề khác
            </button>
            <Link
              href="/"
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {/* ============================================================ */}
          {/* STEP 1: 🎧 DICTATION - 2 ROWS: WORD & SENTENCE */}
          {/* ============================================================ */}
          {activeMode === "dictation" && (
            <div className="space-y-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-center space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-purple-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Headphones size={26} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Lắng nghe câu âm thanh và kiểm tra từng hàng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Từ vựng có <strong>{currentWord.word.length} ký tự</strong> (Bắt đầu bằng chữ "{currentWord.word[0].toUpperCase()}")
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => speakText(currentWord.example || currentWord.word)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    <Volume2 size={16} />
                    <span>Nghe đọc CẢ CÂU (Tốc độ chuẩn IELTS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakText(currentWord.word)}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs cursor-pointer"
                  >
                    <Volume2 size={14} />
                    <span>Chỉ nghe 1 từ</span>
                  </button>
                </div>

                <div className="p-3.5 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-xs font-semibold text-purple-800 dark:text-purple-300">
                  Nghĩa tiếng Việt: {currentWord.meaning}
                </div>
              </div>

              {/* 2 INPUT ROWS */}
              <div className="space-y-4">
                {/* HÀNG 1: GÕ TỪ BẠN NGHE ĐƯỢC */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200">
                      1️⃣ Hàng 1: Gõ TỪ bạn nghe được ({currentWord.word.length} ký tự)
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dictationWordInput}
                      onChange={(e) => setDictationWordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dictationWordInput.trim()) {
                          e.preventDefault();
                          handleCheckWord();
                        }
                      }}
                      placeholder={`Gõ từ vựng... (ví dụ: ${currentWord.word[0]}...)`}
                      className="flex-1 p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base font-bold text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleCheckWord}
                      disabled={!dictationWordInput.trim()}
                      className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer whitespace-nowrap"
                    >
                      Kiểm tra từ
                    </button>
                  </div>

                  {dictationWordChecked && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
                        isWordCorrect
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                          : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300"
                      }`}
                    >
                      <div>
                        <span className="font-bold">
                          {isWordCorrect ? "Chính xác tuyệt đối! 🎉 " : "Chưa chính xác: "}
                        </span>
                        <span>
                          Từ đúng là: <strong className="font-mono uppercase">{currentWord.word}</strong> {currentWord.ipa}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText(currentWord.word)}
                        className="p-1 text-purple-600"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* HÀNG 2: GÕ CẢ CÂU BẠN NGHE ĐƯỢC */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200">
                      2️⃣ Hàng 2: Gõ CẢ CÂU bạn nghe được
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dictationSentenceInput}
                      onChange={(e) => setDictationSentenceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dictationSentenceInput.trim()) {
                          e.preventDefault();
                          handleCheckSentence();
                        }
                      }}
                      placeholder="Gõ toàn bộ câu bạn vừa nghe..."
                      className="flex-1 p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleCheckSentence}
                      disabled={!dictationSentenceInput.trim()}
                      className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer whitespace-nowrap"
                    >
                      Kiểm tra câu
                    </button>
                  </div>

                  {dictationSentenceChecked && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isSentenceCorrect ? "text-emerald-600" : "text-amber-600"}`}>
                          {isSentenceCorrect ? "✅ Viết đúng cả câu hoàn hảo!" : "👉 Đối chiếu với câu gốc:"}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakText(currentWord.example)}
                          className="p-1 text-purple-600"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        "{currentWord.example}"
                      </p>
                      {currentWord.exampleVi && (
                        <p className="text-slate-500 italic pt-0.5">{currentWord.exampleVi}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(dictationWordChecked || dictationSentenceChecked) && (
                <GradingFourLevels onGrade={handleLevelGrade} submitting={submitting} />
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: ✍️ CLOZE TEST */}
          {/* ============================================================ */}
          {activeMode === "cloze" && (
            <div className="space-y-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-3">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  ✍️ Điền từ vào chỗ trống
                </span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  "{getClozeSentence()}"
                </p>

                {currentWord.exampleVi && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                    👉 Bản dịch: {currentWord.exampleVi}
                  </p>
                )}

                <div className="inline-block px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold shadow-sm">
                  Nghĩa: {currentWord.meaning} (Bắt đầu bằng "{currentWord.word[0].toUpperCase()}")
                </div>
              </div>

              {!clozeChecked ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clozeInput}
                    onChange={(e) => setClozeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && clozeInput.trim()) {
                        e.preventDefault();
                        handleCheckCloze();
                      }
                    }}
                    placeholder="Nhập từ cần điền vào câu..."
                    autoFocus
                    className="flex-1 p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCheckCloze}
                    disabled={!clozeInput.trim()}
                    className="px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Kiểm tra
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                      isClozeCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">
                        {isClozeCorrect ? "Chính xác tuyệt vời! 🎉" : "Chưa chính xác rồi!"}
                      </p>
                      <p className="mt-0.5">
                        Đáp án đúng: <strong className="font-mono text-sm uppercase">{currentWord.word}</strong> {currentWord.ipa}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakText(currentWord.word)}
                      className="p-2 bg-white dark:bg-slate-800 rounded-xl"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <GradingFourLevels onGrade={handleLevelGrade} submitting={submitting} />
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: 🎴 FLASHCARD */}
          {/* ============================================================ */}
          {activeMode === "flashcard" && (
            <div>
              {!isFlipped ? (
                <div
                  onClick={() => setIsFlipped(true)}
                  className="min-h-[320px] p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between items-center text-center cursor-pointer hover:border-blue-500 transition-all group"
                >
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 uppercase shadow-sm">
                    {currentWord.partOfSpeech}
                  </span>

                  <div className="my-auto space-y-3">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white capitalize group-hover:scale-105 transition-transform">
                      {currentWord.word}
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-mono text-slate-500">{currentWord.ipa}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentWord.word);
                        }}
                        className="p-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span>Bấm để lật xem định nghĩa, sắc thái & ví dụ</span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[320px] p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white capitalize">
                        {currentWord.word}
                      </h3>
                      <button
                        type="button"
                        onClick={() => speakText(currentWord.word)}
                        className="p-1.5 rounded-full bg-blue-50 text-blue-600"
                      >
                        <Volume2 size={16} />
                      </button>
                      <span className="text-xs font-mono text-slate-400">{currentWord.ipa}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      <RotateCw size={12} />
                      <span>Lật lại</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[11px] font-bold text-blue-600 uppercase block mb-0.5">
                        Định nghĩa chính:
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {currentWord.meaning}
                      </p>
                      {currentWord.usageWhen && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 italic">
                          💡 Khi nào dùng: {currentWord.usageWhen}
                        </p>
                      )}
                    </div>

                    {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 mr-2">
                          Từ đồng nghĩa:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {currentWord.synonyms.join(", ")}
                        </span>
                      </div>
                    )}

                    {currentWord.example && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            "{currentWord.example}"
                          </p>
                          <button
                            type="button"
                            onClick={() => speakText(currentWord.example)}
                            className="p-1 text-indigo-600 flex-shrink-0"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        {currentWord.exampleVi && (
                          <p className="text-slate-500 italic">{currentWord.exampleVi}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <GradingFourLevels onGrade={handleLevelGrade} submitting={submitting} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GradingFourLevels({
  onGrade,
  submitting,
}: {
  onGrade: (levelGrade: 1 | 2 | 3 | 4) => void;
  submitting: boolean;
}) {
  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
      <p className="text-center text-[11px] font-semibold text-slate-400 mb-2.5">
        Chọn mức độ thuộc từ:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onGrade(1)}
          disabled={submitting}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xs font-extrabold">Mức 1: Chưa nhớ</span>
          <span className="text-[10px] font-normal text-rose-500 mt-0.5">Học lại ngay</span>
        </button>

        <button
          type="button"
          onClick={() => onGrade(2)}
          disabled={submitting}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xs font-extrabold">Mức 2: Hơi khó</span>
          <span className="text-[10px] font-normal text-amber-500 mt-0.5">Ôn lại sớm</span>
        </button>

        <button
          type="button"
          onClick={() => onGrade(3)}
          disabled={submitting}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xs font-extrabold">Mức 3: Nhớ tốt</span>
          <span className="text-[10px] font-normal text-blue-500 mt-0.5">Nhớ chuẩn</span>
        </button>

        <button
          type="button"
          onClick={() => onGrade(4)}
          disabled={submitting}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xs font-extrabold">Mức 4: Thành thạo</span>
          <span className="text-[10px] font-normal text-emerald-500 mt-0.5">Đã thuộc</span>
        </button>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang tải phòng ôn tập...</p>
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}
