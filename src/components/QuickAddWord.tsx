"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Volume2,
  ChevronDown,
  Loader2,
  AlertCircle,
  Tag,
  BookOpen,
} from "lucide-react";
import { speakText } from "@/lib/speech";
import TopicIcon from "@/components/TopicIcon";
import { Topic, VocabularyWord } from "@/types/schema";
import { quickAddVocabularyWord } from "@/lib/db-indexeddb";
import { autoCategorizeWord } from "@/lib/categorizer";

interface QuickAddWordProps {
  topics: Topic[];
  onWordAdded: (newWord: VocabularyWord) => void;
}

export default function QuickAddWord({ topics, onWordAdded }: QuickAddWordProps) {
  const [inputWord, setInputWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("n");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFetchWordDetails = async (wordToFetch?: string) => {
    const cleanWord = (wordToFetch || inputWord).trim();
    if (!cleanWord) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Call analyze API
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể phân tích từ");
      }

      const data = json.data;
      setIpa(data.phoneticUs || data.phoneticUk || `/${cleanWord}/`);
      setPartOfSpeech(data.pos || data.senses?.[0]?.partOfSpeech || "n");
      setMeaning(data.meaningVi || data.senses?.[0]?.definitionVi || `Nghĩa của ${cleanWord}`);
      setExample(
        data.exampleEn ||
          data.senses?.[0]?.examples?.[0]?.sentenceEn ||
          `The term "${cleanWord}" is commonly used in IELTS academic contexts.`
      );

      // Auto categorize topic
      const autoCat = autoCategorizeWord(cleanWord, data.meaningVi || data.senses?.[0]?.definitionVi, topics);
      setSelectedTopicId(data.suggestedTopicId || autoCat.topicId || topics[0]?.id || "");
      setShowPreview(true);
    } catch (err: any) {
      // Fallback offline auto-generation
      setIpa(`/${cleanWord}/`);
      setPartOfSpeech("n");
      setMeaning(`Định nghĩa từ vựng "${cleanWord}"`);
      setExample(`The term "${cleanWord}" is essential for IELTS reading and writing tasks.`);
      const autoCat = autoCategorizeWord(cleanWord, "", topics);
      setSelectedTopicId(autoCat.topicId || topics[0]?.id || "");
      setShowPreview(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!inputWord.trim() || !meaning.trim()) {
      setErrorMsg("Vui lòng nhập từ và định nghĩa");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const savedWord = await quickAddVocabularyWord({
        word: inputWord.trim(),
        ipa: ipa.trim(),
        partOfSpeech: partOfSpeech.trim(),
        meaning: meaning.trim(),
        example: example.trim(),
        topicId: selectedTopicId || topics[0]?.id,
      });

      setSuccessMsg(`Đã lưu "${savedWord.word}" vào IndexedDB và nạp vào chu kỳ SRS!`);
      setInputWord("");
      setIpa("");
      setMeaning("");
      setExample("");
      setShowPreview(false);
      onWordAdded(savedWord);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu vào cơ sở dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Thêm từ vựng nhanh (Quick Add & Auto-Categorization)
            </h2>
            <p className="text-xs text-slate-500">
              Gõ từ mới để hệ thống tự động điền IPA, định nghĩa, ví dụ và phân loại chủ đề IELTS
            </p>
          </div>
        </div>
      </div>

      {/* Main Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputWord.trim()) {
                e.preventDefault();
                handleFetchWordDetails();
              }
            }}
            placeholder="Nhập từ vựng tiếng Anh (ví dụ: sustainable, deteriorate, ubiquitous)..."
            disabled={loading}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <button
          type="button"
          onClick={() => handleFetchWordDetails()}
          disabled={loading || !inputWord.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang phân tích...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Tra từ & Điền tự động</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Instant Preview & Edit Fields */}
      {showPreview && (
        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IPA Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Phiên âm IPA
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ipa}
                  onChange={(e) => setIpa(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => speakText(inputWord, { lang: "en-US" })}
                  title="Nghe phát âm US"
                  className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors flex-shrink-0"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>

            {/* Part of Speech */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Từ loại (POS)
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="n">Noun (Danh từ)</option>
                <option value="v">Verb (Động từ)</option>
                <option value="adj">Adjective (Tính từ)</option>
                <option value="adv">Adverb (Trạng từ)</option>
                <option value="phrasal v">Phrasal Verb (Cụm động từ)</option>
                <option value="idiom">Idiom (Thành ngữ)</option>
              </select>
            </div>

            {/* Auto Suggested Topic Tag with 1-Click Dropdown */}
            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                🏷️ Chủ đề tự động phân loại
              </label>
              <button
                type="button"
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <TopicIcon name={currentTopic?.icon} size={14} className="text-indigo-600 flex-shrink-0" />
                  <span className="truncate">{currentTopic?.name}</span>
                </div>
                <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
              </button>

              {/* Topic Dropdown */}
              {showTopicDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
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
          </div>

          {/* Meaning & Example */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Định nghĩa tiếng Việt
              </label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Câu ví dụ ngữ cảnh chuẩn IELTS
              </label>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={16} />
              <span>{saving ? "Đang lưu..." : "Lưu vào kho từ & nạp vào SRS"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
