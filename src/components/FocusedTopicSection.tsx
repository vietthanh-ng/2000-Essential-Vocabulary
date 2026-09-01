"use client";

import React from "react";
import { Sparkles, RefreshCw, ArrowRight, Play, BookOpen, Volume2, CheckCircle2 } from "lucide-react";
import TopicIcon from "@/components/TopicIcon";
import { speakText } from "@/lib/speech";
import { Topic, WordWithSRS } from "@/types/schema";

interface FocusedTopicSectionProps {
  currentTopic: Topic | null;
  batchWords: WordWithSRS[];
  loadingBatch: boolean;
  onSwitchNextTopic: () => void;
  onStartStudyBatch: () => void;
}

export default function FocusedTopicSection({
  currentTopic,
  batchWords,
  loadingBatch,
  onSwitchNextTopic,
  onStartStudyBatch,
}: FocusedTopicSectionProps) {
  if (!currentTopic && !loadingBatch) return null;

  const learnedCount = batchWords.filter((w) => w.levelGrade !== undefined).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <TopicIcon name={currentTopic?.icon} size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Chủ đề đang học ({batchWords.length} từ)
              </span>
              <span className="text-xs text-slate-400">
                • Đã thuộc: {learnedCount}/{batchWords.length} từ
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {currentTopic?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentTopic?.description || "Học tập trung toàn diện 15 từ vựng của chủ đề này từ kho Oxford 2,000"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Topic Button */}
          <button
            type="button"
            onClick={onSwitchNextTopic}
            disabled={loadingBatch}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            title="Tự động bốc đợt từ tiếp theo chưa ở Mức 4 để học"
          >
            <RefreshCw size={14} className={loadingBatch ? "animate-spin" : ""} />
            <span>Đổi chủ đề / Học đợt tiếp theo</span>
          </button>

          {/* Start Study Batch */}
          <button
            type="button"
            onClick={onStartStudyBatch}
            disabled={loadingBatch || batchWords.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Play size={14} className="fill-white" />
            <span>Vào phòng học ({batchWords.length} từ này)</span>
          </button>
        </div>
      </div>

      {/* 15 Words Preview List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Danh sách từ vựng đợt học này:</span>
          <span>Bấm 🔊 để nghe phát âm cả câu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {batchWords.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white capitalize">
                        {item.word}
                      </h4>
                      <button
                        type="button"
                        onClick={() => speakText(item.word)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-full"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                    {item.ipa && (
                      <span className="text-[11px] font-mono text-slate-400 ml-7 block">
                        {item.ipa}
                      </span>
                    )}
                  </div>

                  {/* Level Pill */}
                  {item.levelGrade ? (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.levelGrade === 4
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : item.levelGrade === 3
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : item.levelGrade === 2
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      Mức {item.levelGrade}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-500">
                      Chưa học
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-2">
                  👉 {item.meaning}
                </p>

                {item.usageWhen && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 italic line-clamp-1">
                    💡 {item.usageWhen}
                  </p>
                )}
              </div>

              {/* Example with translation below */}
              {item.example && (
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/60 text-[11px] space-y-1">
                  <div className="flex items-start justify-between gap-1 text-slate-800 dark:text-slate-200 font-medium">
                    <p className="line-clamp-2">"{item.example}"</p>
                    <button
                      type="button"
                      onClick={() => speakText(item.example)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded flex-shrink-0"
                      title="Nghe đọc cả câu"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                  {item.exampleVi && (
                    <p className="text-slate-500 line-clamp-2">{item.exampleVi}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
