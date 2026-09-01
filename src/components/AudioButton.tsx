"use client";

import React, { useState, useEffect } from "react";
import { Volume2, Gauge } from "lucide-react";
import { playPronunciation, getGlobalSpeechRate, setGlobalSpeechRate, SUPPORTED_SPEED_RATES, SpeedRate } from "@/lib/speech";

interface AudioButtonProps {
  text: string;
  lang?: "en-US" | "en-GB";
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  showSpeedSelector?: boolean;
}

export default function AudioButton({
  text,
  lang = "en-US",
  size = "md",
  className = "",
  label,
  showSpeedSelector = true,
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    setCurrentRate(getGlobalSpeechRate());

    const handleRateChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail !== undefined) {
        setCurrentRate(customEvent.detail);
      } else {
        setCurrentRate(getGlobalSpeechRate());
      }
    };

    window.addEventListener("vocab_speech_rate_changed", handleRateChange);
    return () => {
      window.removeEventListener("vocab_speech_rate_changed", handleRateChange);
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    playPronunciation(text, lang, currentRate);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const handleSelectRate = (e: React.MouseEvent, rate: number) => {
    e.stopPropagation();
    setCurrentRate(rate);
    setGlobalSpeechRate(rate);
    setShowSpeedMenu(false);
    // Auto re-play with new rate
    setIsPlaying(true);
    playPronunciation(text, lang, rate);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-2.5 py-1.5 text-sm gap-1.5",
    lg: "px-3 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <div className="relative inline-flex items-center gap-1 z-10">
      <button
        type="button"
        onClick={handleSpeak}
        title={`Nghe phát âm: "${text}" (${lang === "en-GB" ? "UK" : "US"}) - ${currentRate}x`}
        className={`inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 ${
          isPlaying
            ? "bg-blue-600 text-white scale-105 shadow-md shadow-blue-500/20"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50"
        } ${sizeClasses[size]} ${className}`}
      >
        <Volume2 size={iconSizes[size]} className={isPlaying ? "animate-pulse" : ""} />
        {label && <span>{label}</span>}
      </button>

      {showSpeedSelector && (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeedMenu(!showSpeedMenu);
            }}
            title="Thay đổi tốc độ phát âm (0.5x - 1.5x)"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <span>{currentRate}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute right-0 top-full mt-1.5 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1 z-50 min-w-[90px] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                Tốc độ đọc
              </div>
              {SUPPORTED_SPEED_RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={(e) => handleSelectRate(e, r)}
                  className={`flex items-center justify-between px-2 py-1 text-xs rounded-lg transition-colors ${
                    currentRate === r
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{r}x</span>
                  {r === 1.0 && <span className="text-[10px] opacity-75">(Chuẩn)</span>}
                  {r === 0.5 && <span className="text-[10px] opacity-75">(Chậm)</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
