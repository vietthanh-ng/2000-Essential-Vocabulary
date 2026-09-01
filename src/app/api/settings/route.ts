import { NextRequest, NextResponse } from "next/server";
import { getUserConfig, saveUserConfig } from "@/lib/config-store";
import { getAppSetting, setAppSetting } from "@/lib/db";

export async function GET() {
  try {
    const config = getUserConfig();
    const geminiApiKey = config.geminiApiKey || getAppSetting("gemini_api_key") || process.env.GEMINI_API_KEY || "";
    let geminiApiKeys: string[] = config.geminiApiKeys || [];
    if (geminiApiKeys.length === 0 && geminiApiKey) {
      geminiApiKeys = [geminiApiKey];
    }

    const defaultVoice = config.defaultVoice || getAppSetting("default_voice") || "en-US";
    const dailyGoal = config.dailyGoal || parseInt(getAppSetting("daily_goal") || "10", 10);
    const speechRate = config.speechRate || parseFloat(getAppSetting("speech_rate") || "1.0");

    const maskedApiKey = geminiApiKey
      ? `${geminiApiKey.slice(0, 4)}...${geminiApiKey.slice(-4)}`
      : "";

    return NextResponse.json({
      success: true,
      hasCustomApiKey: geminiApiKeys.length > 0 || !!geminiApiKey,
      maskedApiKey,
      geminiApiKeys,
      defaultVoice,
      dailyGoal,
      speechRate,
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { geminiApiKey, geminiApiKeys, defaultVoice, dailyGoal, speechRate } = body;

    const updates: any = {};

    if (Array.isArray(geminiApiKeys)) {
      const cleanKeys = geminiApiKeys.map((k: string) => String(k).trim()).filter(Boolean);
      updates.geminiApiKeys = cleanKeys;
      if (cleanKeys.length > 0) {
        updates.geminiApiKey = cleanKeys[0];
        setAppSetting("gemini_api_key", cleanKeys[0]);
        setAppSetting("gemini_api_keys", JSON.stringify(cleanKeys));
      }
    } else if (geminiApiKey !== undefined && geminiApiKey.trim()) {
      const singleKey = geminiApiKey.trim();
      updates.geminiApiKey = singleKey;
      updates.geminiApiKeys = [singleKey];
      setAppSetting("gemini_api_key", singleKey);
      setAppSetting("gemini_api_keys", JSON.stringify([singleKey]));
    }

    if (defaultVoice !== undefined) {
      updates.defaultVoice = defaultVoice;
      setAppSetting("default_voice", defaultVoice);
    }
    if (dailyGoal !== undefined) {
      updates.dailyGoal = Number(dailyGoal);
      setAppSetting("daily_goal", String(dailyGoal));
    }
    if (speechRate !== undefined) {
      updates.speechRate = Number(speechRate);
      setAppSetting("speech_rate", String(speechRate));
    }

    saveUserConfig(updates);

    return NextResponse.json({ success: true, message: "Đã lưu cài đặt thành công" });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi lưu cài đặt" }, { status: 500 });
  }
}
