import { NextRequest, NextResponse } from "next/server";
import { getWords, addOrUpdateWord } from "@/lib/db";

// Export all vocabulary data as JSON
export async function GET() {
  try {
    const { items, total } = getWords();
    return NextResponse.json({
      exportDate: new Date().toISOString(),
      version: "2.0",
      total,
      data: items,
    });
  } catch (error: any) {
    console.error("GET /api/backup error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi xuất dữ liệu" }, { status: 500 });
  }
}

// Import vocabulary data from JSON
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body.data;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Định dạng file sao lưu không hợp lệ" }, { status: 400 });
    }

    let importedCount = 0;
    for (const item of items) {
      if (item.word && item.meaning) {
        addOrUpdateWord({
          word: item.word,
          ipa: item.ipa,
          pos: item.pos,
          meaning: item.meaning,
          example: item.example,
          exampleVi: item.exampleVi,
          topicId: item.topicId,
          difficulty: item.difficulty,
          tags: item.tags,
          senses: item.senses,
          collocations: item.collocations,
          notes: item.notes,
        });
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${importedCount} từ vựng vào kho dữ liệu.`,
      importedCount,
    });
  } catch (error: any) {
    console.error("POST /api/backup error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi nhập dữ liệu" }, { status: 500 });
  }
}
