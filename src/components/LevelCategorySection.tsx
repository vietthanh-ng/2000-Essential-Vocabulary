"use client";

import React from "react";
import { AlertCircle, HelpCircle, CheckCircle, Award, Sparkles, ArrowRight } from "lucide-react";

interface LevelCategorySectionProps {
  stats: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    level4Count: number;
  };
  onStudyLevel: (level: 1 | 2 | 3 | 4, label: string) => void;
}

export default function LevelCategorySection({ stats, onStudyLevel }: LevelCategorySectionProps) {
  const levels = [
    {
      level: 1 as const,
      label: "Mức 1: Chưa nhớ",
      desc: "Từ vựng bị quên, cần học và lặp lại ngay",
      count: stats.level1Count,
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
      borderColor: "border-rose-200 dark:border-rose-900/60",
      textColor: "text-rose-700 dark:text-rose-300",
      badgeColor: "bg-rose-200/70 dark:bg-rose-900 text-rose-800 dark:text-rose-200",
      icon: AlertCircle,
      actionText: "Ôn từ Chưa nhớ",
    },
    {
      level: 2 as const,
      label: "Mức 2: Hơi khó",
      desc: "Nhớ chưa vững, phải ngẫm nghĩ lâu",
      count: stats.level2Count,
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-900/60",
      textColor: "text-amber-700 dark:text-amber-300",
      badgeColor: "bg-amber-200/70 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
      icon: HelpCircle,
      actionText: "Ôn từ Hơi khó",
    },
    {
      level: 3 as const,
      label: "Mức 3: Nhớ tốt",
      desc: "Nhớ chuẩn xác nghĩa và ví dụ",
      count: stats.level3Count,
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-900/60",
      textColor: "text-blue-700 dark:text-blue-300",
      badgeColor: "bg-blue-200/70 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      icon: CheckCircle,
      actionText: "Ôn từ Nhớ tốt",
    },
    {
      level: 4 as const,
      label: "Mức 4: Đã thành thạo",
      desc: "Đã nằm lòng, phản xạ tức thì",
      count: stats.level4Count,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-900/60",
      textColor: "text-emerald-700 dark:text-emerald-300",
      badgeColor: "bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
      icon: Award,
      actionText: "Ôn từ Thành thạo",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
          <span>Kho phân loại theo 4 Mức độ thuộc từ</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Bấm trực tiếp vào từng mức để mở phòng ôn tập riêng cho nhóm từ vựng đó
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {levels.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.level}
              className={`p-5 rounded-3xl border ${item.bgColor} ${item.borderColor} flex flex-col justify-between space-y-4 transition-all hover:shadow-md`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-2xl ${item.badgeColor} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${item.badgeColor}`}>
                    {item.count} từ
                  </span>
                </div>

                <div>
                  <h3 className={`font-extrabold text-sm sm:text-base ${item.textColor}`}>
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStudyLevel(item.level, item.label)}
                disabled={item.count === 0}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  item.count > 0
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                    : "opacity-50 cursor-not-allowed bg-white/50 text-slate-400"
                }`}
              >
                <span>{item.count > 0 ? item.actionText : "Chưa có từ nào"}</span>
                {item.count > 0 && <ArrowRight size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
