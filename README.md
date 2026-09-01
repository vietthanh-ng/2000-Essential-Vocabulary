# 🌟 VocabAI - Ứng Dụng Học Khoảng 2000 Từ Vựng Tiếng Anh Thông Dụng Theo Chủ Đề

<p align="center">
  <b>Giải pháp toàn diện giúp bạn tra cứu từ vựng đa ngữ cảnh, luyện phản xạ 3 bước và ghi nhớ vĩnh viễn .</b>
</p>

---

## 📖 Giới Thiệu

**VocabAI** là ứng dụng web cá nhân cao cấp hỗ trợ học từ vựng tiếng Anh (tích hợp sẵn kho gần **2,000 từ vựng cốt lõi Oxford & IELTS**). Ứng dụng kết hợp giữa sức mạnh của **Google Gemini AI** (để bóc tách ngữ nghĩa, collocations, câu ví dụ thực tế).

---

## ✨ Tính Năng Nổi Bật

### 1. 🧠 Tra Cứu Từ Vựng Chuyên Sâu Sử Dụng AI (Deep Vocabulary Analyzer)
- **Bóc tách đa ngữ cảnh**: Phân tích chính xác sắc thái từ trong các lĩnh vực (Kinh doanh, Học thuật, Đời sống, Công nghệ, Y tế, Pháp lý,...).
- **Tổng hợp Collocations thực tế**: Liệt kê các cụm từ kết hợp tự nhiên kèm dịch nghĩa và câu ví dụ.
- **Câu ví dụ chuẩn IELTS**: Tự động tạo 2-3 câu ví dụ học thuật kèm bản dịch tiếng Việt song ngữ.
- **Họ hàng từ & Đồng nghĩa/Trái nghĩa**: Tự động liệt kê Word Family, Synonyms & Antonyms chuẩn xác.

### 2. 🎧 Phòng Ôn Tập 3 Bước (3-Step Study Room)
- **Bước 1: Nghe chép chính tả (Dictation 2 hàng)**:
  - *Hàng 1*: Lắng nghe phát âm và gõ lại từ vựng.
  - *Hàng 2*: Lắng nghe và gõ lại toàn bộ câu ví dụ IELTS để luyện phản xạ nghe - viết.
- **Bước 2: Điền từ vào câu (Cloze Test)**: Điền từ bị ẩn `[ _______ ]` dựa vào ngữ cảnh câu và bản dịch.
- **Bước 3: Thẻ Flashcard 3D**: Lật thẻ xem phiên âm IPA, định nghĩa, sắc thái sử dụng và câu minh họa.

### 3. ⏰ Thuật Toán Lặp Lại Ngắt Quãng SM-2 (Spaced Repetition System)
- Đánh giá từ vựng theo **4 Mức độ thuộc từ**:
  - 🔴 **Mức 1 (Chưa nhớ)**: Lặp lại ngay trong phiên học.
  - 🟡 **Mức 2 (Hơi khó)**: Giảm khoảng cách ôn tập.
  - 🔵 **Mức 3 (Nhớ tốt)**: Tăng khoảng cách ôn tập theo SM-2 chuẩn.
  - 🟢 **Mức 4 (Thành thạo)**: Tự động tính thời điểm vàng cần ôn lại trước khi não bộ quên từ.

### 4. 🔊 Động Cơ Phát Âm US / UK Chất Lượng Cao (Audio Engine)
- Tự động lọc chọn giọng đọc bản xứ chuẩn Anh - Mỹ (en-US) và Anh - Anh (en-GB).
- Tùy chỉnh tốc độ đọc linh hoạt (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`).
- Fallback tự động sang HD Native Audio Stream nếu trình duyệt không có sẵn voice.

### 5. 💾 Dữ Liệu Cục Bộ & An Toàn (Local-First Architecture)
- Toàn bộ dữ liệu từ vựng và lịch sử học tập lưu giữ an toàn trên máy tính của bạn (hỗ trợ offline 100%).
- Tích hợp tính năng **Xuất (Export)** và **Khôi phục (Import)** file sao lưu JSON tiện lợi.

---

## 🚀 Hướng Dẫn Khởi Chạy Ứng Dụng

### Cách 1: Khởi chạy 1-Click (Khuyên dùng cho macOS)
1. Nhấp đúp chuột vào file **`start.command`** trong thư mục dự án.
2. Ứng dụng sẽ tự động cài đặt thư viện (lần đầu) và tự động mở trình duyệt tại địa chỉ **`http://localhost:3000`**.

### Cách 2: Khởi chạy thủ công qua Terminal (Windows / macOS / Linux)
```bash
# 1. Tải dependencies (chỉ cần chạy lần đầu)
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```

---

## ⚙️ Cấu Hình Google Gemini AI Key (Miễn Phí 100%)

Ứng dụng tích hợp sẵn bộ từ điển mẫu Offline. Để kích hoạt toàn bộ sức mạnh AI bóc tách từ vựng mới:

1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) và bấm **"Create API key"** (miễn phí 100%).
2. Trên ứng dụng VocabAI, truy cập trang **Cài đặt (Settings)**.
3. Dán mã Gemini API Key vào ô cấu hình và bấm **Lưu cài đặt**.
4. *(Hệ thống hỗ trợ Key Pool nạp nhiều Key cùng lúc để tự động luân chuyển Round-Robin chống quá tải).*

---

## 📂 Cấu Trúc Mã Nguồn

```
2000 Vocab/
├── src/
│   ├── app/                      # Next.js App Router (Dashboard, Learn, Add, Library, Settings)
│   ├── components/               # Các React Component UI (ActiveStudySession, AudioButton,...)
│   ├── lib/                      # Xử lý nghiệp vụ (AI Gemini, SM-2, IndexedDB, Audio Speech)
│   ├── data/                     # Oxford 3,000 Seed Data (1,693 từ vựng & 60 chủ đề)
│   └── types/                    # TypeScript Type Definitions
├── data/                         # Thư mục lưu dữ liệu cục bộ
├── scripts/                      # Script Python/NodeJS xử lý dữ liệu từ vựng
├── start.command                 # Script 1-click khởi chạy cho macOS
├── .gitignore                    # File cấu hình bỏ qua node_modules và build files
└── package.json                  # Quản lý dependencies dự án
```

---

## 📝 Giấy Phép & Đóng Góp

Dự án được phát triển nhằm mục đích phục vụ cộng đồng học tiếng Anh cá nhân. Mọi đóng góp (Pull Request / Issue) đều được hoan nghênh và nếu có bất cứ lỗi gì trong quá trình sử dụng, các bạn hãy vui lòng để lại đóng góp, mình sẽ tiếp thu và khắc phục!
