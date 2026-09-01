import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VocabAI - Học Từ Vựng Tiếng Anh Thông Minh & Spaced Repetition",
  description: "Ứng dụng tra cứu và học từ vựng tiếng Anh cá nhân hóa với trí tuệ nhân tạo AI và thuật toán Spaced Repetition SM-2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-blue-500 selection:text-white"
      >
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <p>VocabAI © 2026 • Local-First English Learning App • Dữ liệu lưu vĩnh viễn trên máy tính</p>
        </footer>
      </body>
    </html>
  );
}
