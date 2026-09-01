import { NextRequest, NextResponse } from "next/server";
import { getDueWordsForStudy, updateSRSGrade } from "@/lib/db";
import { ReviewGrade, LearningMode } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId") || undefined;

    const dueItems = getDueWordsForStudy(topicId);
    return NextResponse.json({
      success: true,
      count: dueItems.length,
      items: dueItems,
    });
  } catch (error: any) {
    console.error("GET /api/review error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi lấy danh sách ôn tập" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wordId, grade, mode } = body as {
      wordId: string;
      grade: ReviewGrade;
      mode?: LearningMode;
    };

    if (!wordId || grade === undefined || grade < 0 || grade > 5) {
      return NextResponse.json({ error: "Tham số đánh giá không hợp lệ (0-5)" }, { status: 400 });
    }

    const updatedSrs = updateSRSGrade(wordId, grade, mode || "flashcard");

    return NextResponse.json({
      success: true,
      srs: updatedSrs,
    });
  } catch (error: any) {
    console.error("POST /api/review error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi cập nhật kết quả ôn tập" }, { status: 500 });
  }
}
