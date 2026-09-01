import { NextResponse } from "next/server";
import { getAllTopicsWithStats } from "@/lib/db";

export async function GET() {
  try {
    const topics = getAllTopicsWithStats();
    return NextResponse.json({ success: true, topics });
  } catch (error: any) {
    console.error("GET /api/topics error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi lấy danh sách chủ đề" }, { status: 500 });
  }
}
