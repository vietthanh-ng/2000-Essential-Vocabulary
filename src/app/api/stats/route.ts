import { NextResponse } from "next/server";
import { getGlobalStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = getGlobalStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi lấy thống kê" }, { status: 500 });
  }
}
