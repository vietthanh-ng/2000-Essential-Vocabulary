"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Volume2,
  Tag,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AudioButton from "@/components/AudioButton";
import TopicIcon from "@/components/TopicIcon";
import { Topic, AIAnalysisResult } from "@/types";

interface QuickAddBarProps {
  topics: Topic[];
  onWordAdded?: () => void;
}

export default function QuickAddBar({ topics, onWordAdded }: QuickAddBarProps) {
  const [inputWord, setInputWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState<AIAnalysisResult | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputWord.trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setAnalyzed(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: clean }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể phân tích từ");
      }

      setAnalyzed(json.data);
      // Auto-set suggested topic
      setSelectedTopicId(json.data.suggestedTopicId || topics[0]?.id || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi phân tích từ");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (!analyzed) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const meaning = analyzed.meaningVi || analyzed.senses?.[0]?.definitionVi || "Chưa có định nghĩa";
      const example = analyzed.exampleEn || analyzed.senses?.[0]?.examples?.[0]?.sentenceEn || `IELTS vocabulary item: ${analyzed.word}`;
      const exampleVi = analyzed.exampleVi || analyzed.senses?.[0]?.examples?.[0]?.sentenceVi || "";

      const payload = {
        word: analyzed.word,
        ipa: analyzed.phoneticUs || analyzed.phoneticUk || `/${analyzed.word}/`,
        pos: analyzed.pos || analyzed.senses?.[0]?.partOfSpeech || "n",
        meaning: meaning,
        example: example,
        exampleVi: exampleVi,
        topicId: selectedTopicId || topics[0]?.id,
        difficulty: analyzed.difficulty || "Intermediate",
        tags: analyzed.tags || [],
        senses: analyzed.senses,
        collocations: analyzed.senses?.[0]?.collocations,
      };

      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Lỗi khi lưu từ vào cơ sở dữ liệu");
      }

      setSuccessMsg(`Đã lưu "${analyzed.word}" vào kho từ & nạp vào chu kỳ Spaced Repetition!`);
      setInputWord("");
      setAnalyzed(null);
      if (onWordAdded) onWordAdded();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu từ vựng");
    } finally {
      setSaving(false);
    }
  };

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-indigo-500/5 space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tra từ nhanh & Tự động phân loại chủ đề (Quick Add)
            </h2>
            <p className="text-xs text-slate-500">
              Nhập từ vựng mới để AI phân tích IPA, nghĩa, ví dụ và gán chủ đề IELTS tự động
            </p>
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder="Nhập từ vựng IELTS cần học (ví dụ: sustainable, ubiquitous, deteriorate)..."
            disabled={loading}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <button
          type="submit"
          disabled={loading || !inputWord.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AI đang phân tích...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Phân tích & Thêm từ</span>
            </>
          )}
        </button>
      </form>

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

      {/* Auto-Analyzed Word Preview & Confirmation Card */}
      {analyzed && !loading && (
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-4 animate-in fade-in duration-300">
          {/* Top Row: Word, IPA, Audio & Difficulty */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white capitalize">
                {analyzed.word}
              </h3>
              <AudioButton text={analyzed.word} size="sm" />
              {analyzed.phoneticUs && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {analyzed.phoneticUs}
                </span>
              )}
              {analyzed.pos && (
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                  {analyzed.pos}
                </span>
              )}
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              IELTS {analyzed.difficulty || "Intermediate"}
            </span>
          </div>

          {/* Meaning & Example */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">Ý nghĩa:</span>
              <span className="font-bold text-blue-700 dark:text-blue-400">
                {analyzed.meaningVi || analyzed.senses?.[0]?.definitionVi}
              </span>
            </div>

            {(analyzed.exampleEn || analyzed.senses?.[0]?.examples?.[0]?.sentenceEn) && (
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    "{analyzed.exampleEn || analyzed.senses?.[0]?.examples?.[0]?.sentenceEn}"
                  </p>
                  <AudioButton
                    text={analyzed.exampleEn || analyzed.senses?.[0]?.examples?.[0]?.sentenceEn || ""}
                    size="sm"
                  />
                </div>
                {(analyzed.exampleVi || analyzed.senses?.[0]?.examples?.[0]?.sentenceVi) && (
                  <p className="text-slate-500">
                    {analyzed.exampleVi || analyzed.senses?.[0]?.examples?.[0]?.sentenceVi}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Auto-Categorization Topic Tag & 1-Click Override */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <span className="text-xs font-semibold text-slate-500 block sm:inline mr-2">
                🏷️ Chủ đề tự động phân loại:
              </span>
              <button
                type="button"
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition-colors shadow-sm"
              >
                <TopicIcon name={currentTopic?.icon} size={14} className="text-indigo-600" />
                <span>{currentTopic?.name || "Chọn chủ đề"}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Topic Dropdown */}
              {showTopicDropdown && (
                <div className="absolute left-0 top-full mt-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase">
                    Thay đổi chủ đề (1-Click Override)
                  </p>
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setShowTopicDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        selectedTopicId === t.id
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <TopicIcon name={t.icon} size={14} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveWord}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={16} />
              <span>{saving ? "Đang lưu..." : "Xác nhận & Nạp vào SRS"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
