"use client";

import React, { useState } from "react";
import { Layers, Search, Sparkles, BookOpen } from "lucide-react";
import TopicIcon from "@/components/TopicIcon";
import { TopicMetrics } from "@/types/schema";

interface TopicCardGridProps {
  topics: TopicMetrics[];
  onSelectTopicForStudy: (topicId: string) => void;
  onViewTopicWords?: (topicId: string) => void;
}

export default function TopicCardGrid({
  topics,
  onSelectTopicForStudy,
  onViewTopicWords,
}: TopicCardGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = topics.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="text-indigo-600 dark:text-indigo-400" />
            <span>Danh mục Chủ đề Từ vựng IELTS (Smart Topic Bank)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi tiến độ ghi nhớ và bắt đầu các phiên ôn tập Spaced Repetition theo từng chuyên đề
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chủ đề IELTS..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        </div>
      </div>

      {/* Grid of Topic Cards */}
      {filteredTopics.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 text-sm">Không tìm thấy chủ đề phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Topic Header: Icon, Name & Due Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TopicIcon name={topic.icon} size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {topic.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        IELTS Core Topic
                      </span>
                    </div>
                  </div>

                  {topic.dueWords > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse whitespace-nowrap">
                      {topic.dueWords} cần ôn
                    </span>
                  )}
                </div>

                {topic.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {topic.description}
                  </p>
                )}
              </div>

              {/* Progress Bar & Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">{topic.totalWords} từ vựng</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Thành thạo: {topic.masteryPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${topic.masteryPercentage}%` }}
                  />
                </div>

                {/* Action button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectTopicForStudy(topic.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Study Due ({topic.dueWords > 0 ? topic.dueWords : "Tất cả"})</span>
                  </button>

                  {onViewTopicWords && (
                    <button
                      type="button"
                      onClick={() => onViewTopicWords(topic.id)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                      title="Xem danh sách từ"
                    >
                      <BookOpen size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
