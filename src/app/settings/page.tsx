"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Key,
  HardDrive,
  Volume2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { getGlobalSpeechRate, setGlobalSpeechRate } from "@/lib/speech";

const formatRateStr = (val: number | string): string => {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "1";
  if (Math.abs(num - 0.5) < 0.01) return "0.5";
  if (Math.abs(num - 0.75) < 0.01) return "0.75";
  if (Math.abs(num - 1.0) < 0.01) return "1";
  if (Math.abs(num - 1.25) < 0.01) return "1.25";
  if (Math.abs(num - 1.5) < 0.01) return "1.5";
  return String(num);
};

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [defaultVoice, setDefaultVoice] = useState("en-US");
  const [speechRate, setSpeechRate] = useState("1");
  const [dailyGoal, setDailyGoal] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.geminiApiKeys) && json.geminiApiKeys.length > 0) {
          setHasCustomApiKey(true);
          setApiKey(json.geminiApiKeys.join("\n"));
          const first = json.geminiApiKeys[0];
          setMaskedKey(`${first.slice(0, 4)}...${first.slice(-4)} (${json.geminiApiKeys.length} keys in pool)`);
        } else if (json.hasCustomApiKey && json.maskedApiKey) {
          setHasCustomApiKey(true);
          setMaskedKey(json.maskedApiKey);
        } else {
          if (typeof window !== "undefined") {
            localStorage.removeItem("gemini_api_key");
            localStorage.removeItem("gemini_api_keys");
          }
          setHasCustomApiKey(false);
          setApiKey("");
          setMaskedKey("");
        }
        setDefaultVoice(json.defaultVoice || "en-US");
        setDailyGoal(json.dailyGoal || 15);
        if (json.speechRate !== undefined) {
          const rateVal = Number(json.speechRate);
          setSpeechRate(formatRateStr(rateVal));
          setGlobalSpeechRate(rateVal);
        } else {
          setSpeechRate(formatRateStr(getGlobalSpeechRate()));
        }
      } else {
        setSpeechRate(formatRateStr(getGlobalSpeechRate()));
      }
    } catch (e) {
      console.error(e);
      setSpeechRate(formatRateStr(getGlobalSpeechRate()));
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    const rawKeys = apiKey
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);
    const keyToTest = rawKeys[0] || (typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "") || "";
    if (!keyToTest) {
      setErrorMsg("Vui lòng nhập ít nhất 1 mã Google Gemini API Key để kiểm tra");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: "space",
          apiKey: keyToTest,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("gemini_api_key", keyToTest);
          localStorage.setItem("gemini_api_keys", JSON.stringify(rawKeys.length > 0 ? rawKeys : [keyToTest]));
        }
        // Save to backend config as well
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geminiApiKeys: rawKeys.length > 0 ? rawKeys : [keyToTest] }),
        }).catch(() => {});

        setHasCustomApiKey(true);
        setMaskedKey(`${keyToTest.slice(0, 4)}...${keyToTest.slice(-4)} (${Math.max(1, rawKeys.length)} keys)`);
        setTestResult({
          success: true,
          msg: `✅ Kết nối thành công & đã lưu ${Math.max(1, rawKeys.length)} khóa vào Key Pool!`,
        });
      } else {
        setTestResult({
          success: false,
          msg: `❌ Không thể kết nối: ${json.error || "Khóa API không hợp lệ hoặc đã hết hạn mức"}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `❌ Lỗi kết nối: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    setTestResult(null);

    const rawKeys = apiKey
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);
    const currentRateNum = parseFloat(speechRate) || 1.0;
    setGlobalSpeechRate(currentRateNum);

    try {
      const payload: any = {
        defaultVoice,
        dailyGoal,
        speechRate: currentRateNum,
        geminiApiKeys: rawKeys,
      };
      if (rawKeys.length > 0) {
        payload.geminiApiKey = rawKeys[0];
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        if (typeof window !== "undefined" && rawKeys.length > 0) {
          localStorage.setItem("gemini_api_key", rawKeys[0]);
          localStorage.setItem("gemini_api_keys", JSON.stringify(rawKeys));
        }
        setSuccessMsg(`✅ Đã lưu cấu hình và ${rawKeys.length} khóa Gemini AI vào Key Pool thành công!`);
        loadSettings();
      } else {
        throw new Error(json.error || "Không thể lưu cài đặt");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/backup");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vocab-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Lỗi khi xuất dữ liệu");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportMsg("");
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const result = await res.json();
      if (result.success) {
        setImportMsg("✅ Khôi phục dữ liệu thành công! Hãy tải lại trang.");
      } else {
        throw new Error(result.error || "Lỗi khôi phục");
      }
    } catch (err: any) {
      alert(err.message || "File JSON không hợp lệ");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parsedKeysCount = apiKey
    .split(/[\n,]/)
    .map((k) => k.trim())
    .filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-indigo-600 dark:text-indigo-400" />
          <span>Cài đặt Khóa API & Quản lý dữ liệu</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Cấu hình Key Pool Google Gemini AI, tùy chọn giọng đọc và sao lưu dữ liệu cục bộ
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Gemini API Key Section */}
        <div id="api-key" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Hệ Thống Key Pool Google Gemini AI (Hỗ trợ nạp nhiều Key)
              </h2>
              <p className="text-xs text-slate-500">
                Nhập danh sách Gemini API Keys của bạn (mỗi dòng 1 key) để tự động luân chuyển Round-Robin & chống quá tải 429/503
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Nhập danh sách Gemini API Keys (1 key / dòng):</span>
                {parsedKeysCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[11px]">
                    ⚡ Key Pool: {parsedKeysCount} keys
                  </span>
                )}
              </label>
              {hasCustomApiKey && (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <ShieldCheck size={14} /> Đã kích hoạt Key Pool ({maskedKey})
                </span>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán danh sách API Keys của bạn vào đây (Mỗi dòng 1 key)&#10;ví dụ:&#10;AIzaSyA...111&#10;AQ.Aa...222"
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={testing || (!apiKey.trim() && !hasCustomApiKey)}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  {testing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang thử kết nối...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Kiểm tra & Nạp Key Pool</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200"
                }`}
              >
                <span>{testResult.msg}</span>
              </div>
            )}

            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-200">
                <HelpCircle size={16} />
                <span>Cách lấy Google Gemini API Key miễn phí 100% (Mất 30 giây):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1 leading-relaxed">
                <li>
                  Truy cập trang Google AI Studio:{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                  >
                    <span>https://aistudio.google.com/app/apikey</span>
                    <ExternalLink size={11} />
                  </a>
                </li>
                <li>
                  Bấm nút <strong>"Create API key"</strong> $\rightarrow$ Chọn project và bấm xác nhận để lấy mã.
                </li>
                <li>
                  Sao chép mã API Key $\rightarrow$ Dán vào ô bên trên và bấm nút <strong>"Lưu cài đặt"</strong> bên dưới.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Study Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Volume2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Tùy chọn Giọng đọc & Mục tiêu
              </h2>
              <p className="text-xs text-slate-500">Giọng đọc phát âm và số từ học mỗi phiên</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giọng đọc mặc định
              </label>
              <select
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="en-US">🇺🇸 Anh - Mỹ (English US)</option>
                <option value="en-GB">🇬🇧 Anh - Anh (English UK)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tốc độ đọc Voice (Audio Rate)
              </label>
              <select
                value={speechRate}
                onChange={(e) => {
                  const valStr = formatRateStr(e.target.value);
                  setSpeechRate(valStr);
                  setGlobalSpeechRate(parseFloat(valStr));
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="0.5">0.5x (Chậm rõ khẩu hình)</option>
                <option value="0.75">0.75x (Chậm vừa)</option>
                <option value="1">1.0x (Chuẩn tốc độ)</option>
                <option value="1.25">1.25x (Nhanh vừa)</option>
                <option value="1.5">1.5x (Nhanh phản xạ)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số từ vựng mỗi đợt học
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 15)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>{saving ? "Đang lưu..." : "Lưu cài đặt"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Backup Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <HardDrive size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Sao lưu & Khôi phục dữ liệu
            </h2>
            <p className="text-xs text-slate-500">
              Dữ liệu của bạn được bảo mật và lưu trữ 100% cục bộ trên trình duyệt máy tính
            </p>
          </div>
        </div>

        {importMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{importMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm cursor-pointer"
          >
            <Download size={16} />
            <span>Xuất file sao lưu (JSON Backup)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm cursor-pointer"
          >
            <Upload size={16} />
            <span>{importing ? "Đang nhập..." : "Khôi phục dữ liệu từ file JSON"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
