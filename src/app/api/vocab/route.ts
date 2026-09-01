import { NextRequest, NextResponse } from "next/server";
import { getWords, addOrUpdateWord } from "@/lib/db";
import { AIAnalysisResult } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId") || undefined;
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const result = getWords({ topicId, search, status, limit, offset });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("GET /api/vocab error:", error);
    return NextResponse.json({ error: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both direct fields and data wrapper
    let word = body.word;
    let ipa = body.ipa;
    let pos = body.pos;
    let meaning = body.meaning;
    let example = body.example;
    let exampleVi = body.exampleVi;
    let topicId = body.topicId;
    let difficulty = body.difficulty;
    let tags = body.tags;
    let senses = body.senses;
    let collocations = body.collocations;
    let notes = body.notes;

    if (body.data) {
      const d: AIAnalysisResult = body.data;
      word = d.word;
      ipa = d.phoneticUs || d.phoneticUk;
      pos = d.pos || d.senses?.[0]?.partOfSpeech;
      meaning = d.meaningVi || d.senses?.[0]?.definitionVi;
      example = d.exampleEn || d.senses?.[0]?.examples?.[0]?.sentenceEn;
      exampleVi = d.exampleVi || d.senses?.[0]?.examples?.[0]?.sentenceVi;
      topicId = body.topicId || d.suggestedTopicId;
      difficulty = d.difficulty;
      tags = d.tags;
      senses = d.senses;
      collocations = d.senses?.[0]?.collocations;
      notes = body.notes;
    }

    if (!word || !meaning) {
      return NextResponse.json({ error: "Từ vựng và định nghĩa không được để trống" }, { status: 400 });
    }

    const saved = addOrUpdateWord({
      word,
      ipa,
      pos,
      meaning,
      example,
      exampleVi,
      topicId,
      difficulty,
      tags,
      senses,
      collocations,
      notes,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (error: any) {
    console.error("POST /api/vocab error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi lưu từ vựng" }, { status: 500 });
  }
}
