import { NextRequest, NextResponse } from "next/server";
import { analyzeVocabularyWithAI } from "@/lib/ai";
import { getWordByText } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, apiKey } = body;

    if (!word || typeof word !== "string" || !word.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập từ vựng hợp lệ" }, { status: 400 });
    }

    const cleanWord = word.trim();
    const existing = getWordByText(cleanWord);
    const analysis = await analyzeVocabularyWithAI(cleanWord, apiKey);

    return NextResponse.json({
      success: true,
      data: analysis,
      alreadyInLibrary: !!existing,
      existingItem: existing,
    });
  } catch (error: any) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi phân tích từ" }, { status: 500 });
  }
}
