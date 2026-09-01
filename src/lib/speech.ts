// File: src/lib/speech.ts

/**
 * High-Quality English Audio Engine (Target IELTS Pronunciation)
 * - Tự động chọn đúng giọng đọc tiếng Anh bản xứ (US / UK)
 * - Tuyệt đối không để trình duyệt dùng giọng tiếng Việt mặc định của hệ điều hành
 * - Hỗ trợ Web Audio / Google HD Native Pronunciation fallback khi máy tính chưa cài voice tiếng Anh
 */

let englishVoicesLoaded = false;
let englishUSVoice: SpeechSynthesisVoice | null = null;
let englishUKVoice: SpeechSynthesisVoice | null = null;

export function getEnglishVoice(lang: "en-US" | "en-GB" = "en-US"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Lọc nghiêm ngặt: CHỈ LẤY các voice có lang bắt đầu bằng "en" (tiếng Anh), LOẠI BỎ hoàn toàn vi-VN
  const allEnglishVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("en") && !v.lang.toLowerCase().startsWith("vi")
  );

  if (allEnglishVoices.length === 0) {
    return null;
  }

  if (lang === "en-GB") {
    // Ưu tiên giọng Anh - Anh (UK) chất lượng cao
    const ukVoice =
      allEnglishVoices.find((v) => v.lang === "en-GB" || v.lang.includes("en_GB")) ||
      allEnglishVoices.find((v) => v.name.includes("Daniel") || v.name.includes("Oliver") || v.name.includes("George") || v.name.includes("Serena")) ||
      allEnglishVoices[0];
    return ukVoice;
  } else {
    // Ưu tiên giọng Anh - Mỹ (US) chất lượng cao
    const usVoice =
      allEnglishVoices.find((v) => v.name.includes("Google") && v.lang.includes("en")) ||
      allEnglishVoices.find((v) => v.name.includes("Samantha") || v.name.includes("Ava") || v.name.includes("Allison") || v.name.includes("Alex") || v.name.includes("Zira")) ||
      allEnglishVoices.find((v) => v.lang === "en-US" || v.lang.includes("en_US")) ||
      allEnglishVoices[0];
    return usVoice;
  }
}

// Nạp danh sách voices ngay khi trình duyệt sẵn sàng
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const initVoices = () => {
    englishUSVoice = getEnglishVoice("en-US");
    englishUKVoice = getEnglishVoice("en-GB");
    englishVoicesLoaded = true;
  };

  window.speechSynthesis.onvoiceschanged = initVoices;
  initVoices();
}

// Tốc độ phát mặc định và các mốc tốc độ hỗ trợ (0.5x, 0.75x, 1.0x, 1.25x, 1.5x)
export const SUPPORTED_SPEED_RATES = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
export type SpeedRate = (typeof SUPPORTED_SPEED_RATES)[number];

export function getGlobalSpeechRate(): number {
  if (typeof window === "undefined") return 1.0;
  const saved = localStorage.getItem("vocab_speech_rate");
  if (saved) {
    const val = parseFloat(saved);
    if (!isNaN(val) && val >= 0.5 && val <= 2.0) {
      return val;
    }
  }
  return 1.0;
}

export function setGlobalSpeechRate(rate: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vocab_speech_rate", String(rate));
  window.dispatchEvent(new CustomEvent("vocab_speech_rate_changed", { detail: rate }));
}

/**
 * Phát âm thanh chuẩn bản xứ với cơ chế Hybrid & tùy chỉnh tốc độ:
 * 1. Web Speech API với giọng tiếng Anh nghiêm ngặt (Samantha / Google / Alex / Daniel)
 * 2. Fallback sang HD Audio Stream nếu trình duyệt không có sẵn giọng đọc tiếng Anh
 */
export function playPronunciation(
  text: string,
  lang: "en-US" | "en-GB" = "en-US",
  customRate?: number
): void {
  if (typeof window === "undefined") return;

  const cleanText = text.trim();
  if (!cleanText) return;

  const rate = customRate !== undefined ? customRate : getGlobalSpeechRate();
  const targetRate = Math.max(0.5, Math.min(2.0, rate));

  // Lấy voice tiếng Anh
  const voice = getEnglishVoice(lang);

  if ("speechSynthesis" in window && voice) {
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = targetRate; // Áp dụng tốc độ tùy chọn (0.5x -> 2.0x)
      utterance.pitch = 1.0;

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          playHDNativeAudio(cleanText, lang, targetRate);
        }
      }, 10);
      return;
    } catch (err) {
      console.warn("SpeechSynthesis error, switching to HD Native Audio:", err);
    }
  }

  // Fallback: Phát trực tiếp âm thanh HD chuẩn bản xứ (Google Native TTS Stream)
  playHDNativeAudio(cleanText, lang, targetRate);
}

/**
 * Phát âm thanh HD chuẩn quốc tế không cần phụ thuộc vào cài đặt giọng của máy
 */
function playHDNativeAudio(
  text: string,
  lang: "en-US" | "en-GB" = "en-US",
  rate: number = 1.0
): void {
  try {
    const tl = lang === "en-GB" ? "en-GB" : "en";
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    const targetRate = Math.max(0.5, Math.min(2.0, rate));

    const applyRate = () => {
      try {
        audio.playbackRate = targetRate;
      } catch (e) {}
    };

    audio.onloadedmetadata = applyRate;
    audio.onplay = applyRate;

    audio.play().then(() => {
      applyRate();
    }).catch((e) => {
      console.warn("HD Audio autoplay prevented:", e);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Alias cho speakText
export interface SpeakOptions {
  lang?: "en-US" | "en-GB";
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function speakText(text: string, options: SpeakOptions = {}): boolean {
  playPronunciation(text, options.lang || "en-US", options.rate);
  return true;
}
