"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles,
  Key,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DashboardHeaderProps {
  stats: {
    totalWords: number;
    dueWords: number;
    masteredWords: number;
    learnedWords: number;
    masteryRate: number;
  };
  onStartStudyAll: () => void;
}

export default function DashboardHeader({ stats, onStartStudyAll }: DashboardHeaderProps) {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiGuide, setShowApiGuide] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setHasApiKey(data.hasCustomApiKey);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-indigo-100">
              <Sparkles size={14} />
              <span>Kho Gần 2,000 Từ Vựng Oxford IELTS</span>
            </span>

            {hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold">
                <ShieldCheck size={14} />
                <span>AI Đã Sẵn Sàng</span>
              </span>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold transition-colors"
              >
                <Key size={13} />
                <span>Chưa có API Key</span>
              </Link>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lộ trình học từ vựng IELTS có phương pháp & chống quên
          </h1>

          <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Học tập trung từng chủ đề (15 từ mỗi đợt) qua quy trình 3 bước: 1. Nghe chép chính tả 2 hàng $\rightarrow$ 2. Điền từ vào câu $\rightarrow$ 3. Thẻ Flashcard & phân loại 4 mức độ nhớ.
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
          <button
            type="button"
            onClick={onStartStudyAll}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 font-extrabold text-sm sm:text-base shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Bắt đầu học ngay</span>
            <ArrowRight size={18} />
          </button>

          <Link
            href="/settings"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs backdrop-blur-md transition-all whitespace-nowrap"
          >
            <Key size={14} />
            <span>{hasApiKey ? "Quản lý API Key" : "🔑 Bổ sung API cá nhân"}</span>
          </Link>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Guide Banner for Adding Personal API Key */}
      <div className="rounded-2xl border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Khóa Google Gemini API Key Cá Nhân</span>
                {hasApiKey ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
                    Đã cấu hình
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold">
                    Khuyến nghị cấu hình
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {hasApiKey
                  ? "Ứng dụng đang sử dụng khóa API riêng của bạn, bảo mật 100% trên máy tính cá nhân."
                  : "Gán khóa API riêng (miễn phí 100%) để AI tự động phân tích đa sắc thái nghĩa và câu ví dụ cho mọi từ vựng mới."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowApiGuide(!showApiGuide)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>{showApiGuide ? "Ẩn hướng dẫn" : "Cách lấy API"}</span>
              {showApiGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Key size={13} />
              <span>Bổ sung API cá nhân</span>
            </Link>
          </div>
        </div>

        {/* Step-by-Step API Guide Dropdown */}
        {showApiGuide && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 animate-in fade-in">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              📌 Hướng dẫn 3 bước lấy khóa Google Gemini API Key miễn phí 100% (chỉ mất 30 giây):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
              <li>
                Truy cập trang tạo khóa của Google:{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink size={11} />
                </a>{" "}
                (Đăng nhập bằng tài khoản Gmail của bạn).
              </li>
              <li>
                Bấm nút <strong>"Create API key"</strong> màu xanh $\rightarrow$ Chọn một project bất kỳ và bấm <strong>"Create API key in existing project"</strong>.
              </li>
              <li>
                Sao chép mã API Key $\rightarrow$ Quay lại ứng dụng này, bấm nút <strong>"Bổ sung API cá nhân"</strong> và dán vào là xong!
              </li>
            </ol>
            <p className="text-[11px] text-slate-400 italic pt-1">
              * Khóa API của bạn được lưu 100% trong bộ nhớ máy tính cục bộ của bạn, không gửi hay chia sẻ cho bất kỳ máy chủ bên ngoài nào.
            </p>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Words */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng kho từ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white my-1.5">
            {stats.totalWords}
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            Oxford 2,000 IELTS
          </span>
        </div>

        {/* Learned Words */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã học</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 my-1.5">
            {stats.learnedWords}
          </div>
          <span className="text-xs text-slate-500">
            Đã phân loại mức độ
          </span>
        </div>

        {/* Due For Review Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cần ôn tập</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 my-1.5">
            {stats.dueWords}
          </div>
          <span className="text-xs text-slate-500">
            Theo thuật toán SM-2
          </span>
        </div>

        {/* Mastered Words */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thành thạo (Mức 4)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 my-1.5">
            {stats.masteredWords}
          </div>
          <span className="text-xs text-emerald-600 font-semibold">
            {stats.masteryRate}% Hoàn thành
          </span>
        </div>
      </div>
    </div>
  );
}
