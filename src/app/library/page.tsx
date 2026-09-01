"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Library,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Volume2,
} from "lucide-react";
import AudioButton from "@/components/AudioButton";
import TopicIcon from "@/components/TopicIcon";
import { WordWithSRS, TopicMetrics } from "@/types/schema";
import {
  getFilteredWordsFromIndexedDB,
  getTopicsWithMetrics,
  deleteWordFromIndexedDB,
} from "@/lib/db-indexeddb";

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "all";
  const initialStatus = searchParams.get("status") || "all";

  const [items, setItems] = useState<WordWithSRS[]>([]);
  const [topics, setTopics] = useState<TopicMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({
    all: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    new: 0,
  });

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    fetchWords();
  }, [search, selectedTopic, statusFilter]);

  const loadTopics = async () => {
    try {
      const topicsData = await getTopicsWithMetrics();
      setTopics(topicsData);
    } catch (e) {
      console.error("Error loading topics:", e);
    }
  };

  const fetchWords = async () => {
    try {
      setLoading(true);
      const result = await getFilteredWordsFromIndexedDB({
        topicId: selectedTopic,
        search: search.trim() || undefined,
        status: statusFilter,
      });

      setItems(result.items);
      setTotalCount(result.total);
      if (result.counts) {
        setCounts(result.counts);
      }
    } catch (e) {
      console.error("Error querying words from IndexedDB:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, word: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ "${word}" khỏi kho từ vựng?`)) return;

    try {
      await deleteWordFromIndexedDB(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (e) {
      console.error("Error deleting word:", e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedWordId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Library className="text-indigo-600 dark:text-indigo-400" />
            <span>Kho Gần 2,000 Từ Vựng Oxford & IELTS</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Hiển thị {totalCount} từ vựng chuẩn Oxford phân chia theo {topics.length} chủ đề và 4 mức độ nhớ (Đồng bộ thời gian thực)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Sparkles size={16} />
            <span>Phòng ôn tập 3 bước</span>
          </Link>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ tiếng Anh, nghĩa tiếng Việt, câu ví dụ..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>

          {/* Topic Selector */}
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">📂 Tất cả chủ đề ({topics.length})</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.totalWords} từ)
                </option>
              ))}
            </select>
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: "all", label: `Tất cả (${counts.all})` },
            { id: "level1", label: `🔴 Mức 1: Chưa nhớ (${counts.level1})` },
            { id: "level2", label: `🟡 Mức 2: Hơi khó (${counts.level2})` },
            { id: "level3", label: `🔵 Mức 3: Nhớ tốt (${counts.level3})` },
            { id: "level4", label: `🟢 Mức 4: Thành thạo (${counts.level4})` },
            { id: "new", label: `Chưa học (${counts.new})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Words List */}
      {loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải danh sách từ vựng...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
          <p className="text-slate-500 text-sm font-semibold">
            Không tìm thấy từ vựng nào trong bộ lọc này.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Khi bạn học và đánh giá từ vựng ở Mức 1, 2, 3, 4, các từ sẽ tự động xuất hiện ngay tại đây!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedWordId === item.id;
            const itemTopic = item.topic || topics.find((t) => t.id === item.topicId);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white capitalize">
                          {item.word}
                        </h3>
                        <AudioButton text={item.word} size="sm" />
                        {item.ipa && (
                          <span className="text-xs text-slate-400 font-mono">{item.ipa}</span>
                        )}
                        {item.partOfSpeech && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mt-1">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  {/* Right Meta & Topic Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    {itemTopic && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        <TopicIcon name={itemTopic.icon} size={12} />
                        <span className="truncate max-w-[140px]">{itemTopic.name}</span>
                      </span>
                    )}

                    {/* Level Badge */}
                    <span
                      className={`px-3 py-1 rounded-full font-extrabold ${
                        item.levelGrade === 4
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : item.levelGrade === 3
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : item.levelGrade === 2
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : item.levelGrade === 1
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.levelGrade ? `Mức ${item.levelGrade}` : "Chưa học"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.word);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Xóa từ"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button type="button" className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-slate-800 space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Nuances & When to Use */}
                    {item.usageWhen && (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 text-amber-800 dark:text-amber-300">
                        <span className="font-bold block mb-0.5">💡 Ngữ cảnh sử dụng:</span>
                        <p>{item.usageWhen}</p>
                      </div>
                    )}

                    {/* Synonyms */}
                    {item.synonyms && item.synonyms.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 mr-2">
                          Từ đồng nghĩa:
                        </span>
                        <span>{item.synonyms.join(", ")}</span>
                      </div>
                    )}

                    {/* Example Sentence */}
                    {item.example && (
                      <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            "{item.example}"
                          </p>
                          <AudioButton text={item.example} size="sm" />
                        </div>
                        {item.exampleVi && <p className="text-slate-500 italic">{item.exampleVi}</p>}
                      </div>
                    )}

                    {/* SRS Meta Data */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 pt-1 border-t border-slate-200/50">
                      <div className="flex items-center gap-4">
                        <span><strong>Khoảng cách:</strong> {item.srs.interval} ngày</span>
                        <span><strong>Hệ số EF:</strong> {item.srs.easeFactor}</span>
                        <span><strong>Lịch sử ôn:</strong> {item.srs.history?.length || 0} lượt</span>
                      </div>
                      <div className="text-indigo-600 font-bold flex items-center gap-1">
                        <Clock size={13} />
                        <span>Ôn tiếp theo: {item.srs.nextReviewDate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải kho từ...</p>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
