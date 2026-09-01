"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Tag,
  ArrowRight,
  Layers,
  Award,
  HelpCircle,
  Plus,
  Settings,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { speakText } from "@/lib/speech";
import { quickAddVocabularyWord, getTopicsWithMetrics } from "@/lib/db-indexeddb";
import TopicIcon from "@/components/TopicIcon";
import { AIAnalysisResult, TopicMetrics } from "@/types";

export default function DeepSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [topics, setTopics] = useState<TopicMetrics[]>([]);

  // Add to library state
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState("🔍 Đang tra cứu và phân tích nghĩa...");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let seconds = 0;
      setLoadingStatusText("🔍 Đang tra cứu và phân tích nghĩa...");
      interval = setInterval(() => {
        seconds += 1;
        if (seconds >= 4) {
          setLoadingStatusText("⚡ Đang nhận phản hồi từ Gemini API...");
        } else if (seconds >= 2) {
          setLoadingStatusText("📝 Đang tạo collocations & ví dụ học thuật...");
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    checkApiKeyAndTopics();
  }, []);

  const checkApiKeyAndTopics = async () => {
    try {
      const [settingsRes, topicsData] = await Promise.all([
        fetch("/api/settings").then((r) => r.json()),
        getTopicsWithMetrics(),
      ]);

      if (settingsRes.success) {
        setHasApiKey(!!settingsRes.hasCustomApiKey);
        if (!settingsRes.hasCustomApiKey && typeof window !== "undefined") {
          localStorage.removeItem("gemini_api_key");
          localStorage.removeItem("gemini_api_keys");
        }
      }
      setTopics(topicsData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (wordToSearch?: string) => {
    const targetWord = (wordToSearch || searchTerm).trim();
    if (!targetWord) return;

    setLoading(true);
    setErrorMsg("");
    setSavedSuccess(false);
    setAnalysis(null);

    const localApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : null;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: targetWord,
          apiKey: localApiKey || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể phân tích từ vựng này.");
      }

      setAnalysis(json.data);
      setSelectedTopicId(json.data.suggestedTopicId || topics[0]?.id || "topic_1_education_supplies");
      setSelectedLevel(1);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tra cứu từ vựng.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!analysis) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const primarySense = analysis.senses?.[0];
      const exampleEn =
        analysis.exampleEn ||
        primarySense?.examples?.[0]?.sentenceEn ||
        `The word "${analysis.word}" is commonly used in English.`;
      const exampleVi =
        analysis.exampleVi ||
        primarySense?.examples?.[0]?.sentenceVi ||
        `Từ "${analysis.word}" được sử dụng phổ biến trong tiếng Anh.`;

      await quickAddVocabularyWord({
        word: analysis.word,
        ipa: analysis.phoneticUs || analysis.phoneticUk,
        partOfSpeech: analysis.pos || primarySense?.partOfSpeech || "noun",
        meaning: analysis.meaningVi || primarySense?.definitionVi || "Định nghĩa từ vựng",
        example: exampleEn,
        exampleVi: exampleVi,
        topicId: selectedTopicId || analysis.suggestedTopicId || topics[0]?.id,
        levelGrade: selectedLevel,
        usageWhen: primarySense?.nuanceExplanation || `Thường dùng trong văn cảnh học thuật và giao tiếp`,
        nuances: analysis.senses?.map((s) => `${s.partOfSpeech}: ${s.definitionVi}`) || [],
        synonyms: analysis.synonyms || [],
      });

      setSavedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi thêm từ vào kho.");
    } finally {
      setSaving(false);
    }
  };

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Sparkles size={14} />
          <span>Tra Cứu Từ Vựng AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Tra từ & Thêm vào kho từ vựng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Tra cứu bất kỳ từ tiếng Anh nào để nắm trọn vẹn: Định nghĩa chuẩn, sắc thái theo từng ngữ cảnh, collocations hữu ích, từ đồng nghĩa & trái nghĩa.
        </p>
      </div>

      {/* API Key Notification Banner if not configured */}
      {!hasApiKey && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <HelpCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mẹo kích hoạt tối đa sức mạnh AI: </span>
              <span>Bạn có thể gán khóa Google Gemini API Key (miễn phí 100%) trong mục Cài đặt để AI tự động phân tích sâu đa ngữ cảnh và collocations chuẩn xác nhất.</span>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-sm"
          >
            <Settings size={13} />
            <span>Vào Cài đặt API</span>
          </Link>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchTerm.trim() && !loading) {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Nhập từ vựng tiếng Anh (ví dụ: girlfriend, mitigate, sustainable, deterioration)..."
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base disabled:opacity-60"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={loading || !searchTerm.trim()}
          className="px-6 sm:px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang phân tích...</span>
            </>
          ) : (
            "Tra từ"
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Shimmer Skeleton Loading */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 animate-pulse">
          {/* Dynamic Status Text Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={18} />
            <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
              {loadingStatusText}
            </span>
          </div>

          {/* Shimmer Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2.5 flex-1">
              <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              <div className="flex gap-2">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
            </div>
            <div className="h-16 w-full sm:w-64 bg-blue-100/60 dark:bg-blue-950/40 rounded-2xl"></div>
          </div>

          {/* Shimmer Form */}
          <div className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>

          {/* Shimmer Senses */}
          <div className="space-y-4 pt-2">
            <div className="h-32 bg-slate-100 dark:bg-slate-800/40 rounded-2xl"></div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800/40 rounded-2xl"></div>
          </div>
        </div>
      )}

      {/* Analysis Result Card */}
      {analysis && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white capitalize">
                  {analysis.word}
                </h2>
                <AudioButton text={analysis.word} lang="en-US" size="md" label="US" />
                <AudioButton text={analysis.word} lang="en-GB" size="md" label="UK" />
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                {analysis.phoneticUs && (
                  <span className="font-mono text-slate-500">US: {analysis.phoneticUs}</span>
                )}
                {analysis.phoneticUk && (
                  <span className="font-mono text-slate-500">UK: {analysis.phoneticUk}</span>
                )}
                {analysis.pos && (
                  <span className="px-2.5 py-0.5 rounded-full font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                    {analysis.pos}
                  </span>
                )}
                {analysis.difficulty && (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    IELTS Band: {analysis.difficulty}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Meaning Summary */}
            {analysis.meaningVi && (
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 max-w-md">
                <span className="text-[10px] font-extrabold uppercase text-blue-600 block mb-0.5">
                  Định nghĩa tổng quan:
                </span>
                <p className="text-base font-extrabold text-blue-900 dark:text-blue-300">
                  {analysis.meaningVi}
                </p>
              </div>
            )}
          </div>

          {/* Section: Add to Library Form */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={15} className="text-indigo-600" />
                <span>Thêm từ này vào kho từ vựng</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Suggested Topic Dropdown */}
              <div className="space-y-1 relative">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  🏷️ Chủ đề phân loại:
                </label>
                <button
                  type="button"
                  onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <TopicIcon name={currentTopic?.icon} size={14} className="text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{currentTopic?.name}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                </button>

                {showTopicDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopicId(t.id);
                          setShowTopicDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          selectedTopicId === t.id
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <TopicIcon name={t.icon} size={13} />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Initial Level Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  🎯 Xếp vào mức độ thuộc ban đầu:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { lvl: 1 as const, label: "Mức 1", desc: "(Mới học / Chưa nhớ)" },
                    { lvl: 2 as const, label: "Mức 2", desc: "(Mới quen / Nhớ sơ)" },
                    { lvl: 3 as const, label: "Mức 3", desc: "(Khá thuộc / Ôn lại)" },
                    { lvl: 4 as const, label: "Mức 4", desc: "(Thành thạo / Đã thuộc)" },
                  ].map((item) => (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => setSelectedLevel(item.lvl)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                        selectedLevel === item.lvl
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-extrabold">{item.label}</span>
                      <span className={`text-[10px] ${selectedLevel === item.lvl ? "text-indigo-100" : "text-slate-400"}`}>
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Add Button */}
            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Đã lưu thành công vào Mức {selectedLevel} của chủ đề "{currentTopic?.name}"!</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Từ vựng sẽ được đưa vào chu kỳ ôn tập và xuất hiện trong Kho từ.
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>{saving ? "Đang lưu..." : savedSuccess ? "Lưu lại cập nhật" : "Thêm vào kho từ vựng"}</span>
              </button>
            </div>
          </div>

          {/* Senses & Context Nuances Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <BookOpen size={16} />
              <span>Các sắc thái nghĩa & Ngữ cảnh sử dụng chi tiết</span>
            </h3>

            <div className="space-y-4">
              {analysis.senses?.map((sense, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                      [{sense.partOfSpeech}] • Ngữ cảnh: {sense.context || "Đời sống & Học thuật"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {sense.definitionVi}
                    </h4>
                    {sense.definitionEn && (
                      <p className="text-xs text-slate-500 mt-0.5">{sense.definitionEn}</p>
                    )}
                  </div>

                  {sense.nuanceExplanation && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
                      <span className="font-bold">💡 Khi nào nên dùng:</span>
                      <p className="leading-relaxed">{sense.nuanceExplanation}</p>
                    </div>
                  )}

                  {/* Real-World Collocations (Only if genuine collocations exist) */}
                  {sense.collocations && sense.collocations.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        🔗 Collocations hữu ích thực tế:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sense.collocations.map((c, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
                            <span className="font-extrabold text-indigo-700 dark:text-indigo-300 block">
                              {c.collocation}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 text-[11px] block">
                              👉 {c.meaningVi}
                            </span>
                            {c.exampleSentence && (
                              <p className="text-slate-400 italic text-[11px] pt-1">
                                "{c.exampleSentence}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Authentic Example Sentences with Translation Below */}
                  {sense.examples && sense.examples.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        📝 Câu ví dụ học thuật chuẩn IELTS (Kèm bản dịch):
                      </span>
                      {sense.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="text-xs space-y-1 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
                              "{ex.sentenceEn}"
                            </p>
                            <button
                              type="button"
                              onClick={() => speakText(ex.sentenceEn)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg flex-shrink-0"
                              title="Nghe đọc câu"
                            >
                              <Volume2 size={15} />
                            </button>
                          </div>
                          {ex.sentenceVi && (
                            <p className="text-slate-500 font-medium italic pt-0.5">
                              👉 {ex.sentenceVi}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Genuine Synonyms & Antonyms */}
          {((analysis.synonyms && analysis.synonyms.length > 0) || (analysis.antonyms && analysis.antonyms.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {analysis.synonyms && analysis.synonyms.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-1.5">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                    🟢 Từ đồng nghĩa (Synonyms):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.synonyms.map((syn, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.antonyms && analysis.antonyms.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5">
                  <span className="font-extrabold text-rose-800 dark:text-rose-300 block">
                    🔴 Từ trái nghĩa (Antonyms):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.antonyms.map((ant, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800"
                      >
                        {ant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
