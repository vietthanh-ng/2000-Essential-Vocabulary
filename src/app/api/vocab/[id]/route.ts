import { NextRequest, NextResponse } from "next/server";
import { getWordById, deleteWord } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = getWordById(id);
    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy từ vựng" }, { status: 404 });
    }
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("GET /api/vocab/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = deleteWord(id);
    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy từ để xóa" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/vocab/[id] error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi xóa từ vựng" }, { status: 500 });
  }
}
