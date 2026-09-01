# 🌟 VocabAI - Ứng dụng Học Từ Vựng Tiếng Anh Thông Minh (AI & SRS)

Ứng dụng cá nhân giúp bạn tra cứu từ vựng, tự động phân tích đa sắc thái nghĩa theo từng ngữ cảnh, tổng hợp collocations tự nhiên, câu ví dụ thực tế và tự động quản lý lịch ôn tập ngắt quãng (Spaced Repetition System - SM-2) để ghi nhớ vĩnh viễn vào não bộ.

---

## ✨ Tính năng nổi bật

1. **🧠 AI Deep Vocabulary Analyzer**:
   - Tự động nhận diện và bóc tách mọi sắc thái nghĩa của từ trong các ngữ cảnh khác nhau (Kinh doanh, Đời sống, Công nghệ, Y tế, Pháp lý,...).
   - Tự động tổng hợp các **Collocations** phổ biến kèm nghĩa tiếng Việt và câu minh họa.
   - Đặt 2-3 **câu ví dụ thực tế** chuẩn bản xứ cho từng nét nghĩa kèm dịch song ngữ.
   - Phiên âm chuẩn quốc tế IPA (Anh - Mỹ / Anh - Anh).
   - Họ hàng từ vựng (**Word Family**), Từ đồng nghĩa (**Synonyms**) & Từ trái nghĩa (**Antonyms**).

2. **🔊 Nghe Phát Âm Trực Tiếp**:
   - Tích hợp phát âm chuẩn (Web Speech Synthesis) giọng Anh - Mỹ (US) và Anh - Anh (UK) cho từ vựng, collocations và từng câu ví dụ.

3. **⏰ Hệ Thống Spaced Repetition (Lặp lại ngắt quãng SM-2)**:
   - Thuật toán SuperMemo SM-2 chuẩn mực (tương tự Anki) tính toán thời điểm vàng cần ôn lại trước khi não bộ quên từ.
   - Thẻ ghi nhớ Flashcard 3D lật thẻ mượt mà (Hỗ trợ phím tắt `Space` để lật, phím `1`, `2`, `3`, `4` để đánh giá kết quả ôn tập).

4. **💾 Lưu Trữ Cục Bộ Vĩnh Viễn (Local-First SQLite)**:
   - Toàn bộ dữ liệu được lưu tự động và an toàn trong file `data/vocab.db` ngay trên máy tính của bạn.
   - Không lo mất dữ liệu khi tắt máy hay mở lại.
   - Hỗ trợ Xuất (Export) và Nhập (Import) file sao lưu JSON bất cứ lúc nào.

---

## 🚀 Cách khởi chạy ứng dụng trên máy tính

### Cách 1: Khởi chạy 1-Click (Khuyên dùng trên macOS)
- Nhấp đúp chuột vào file **`start.command`** trong thư mục dự án.
- Ứng dụng sẽ tự động khởi động và mở trình duyệt tại địa chỉ `http://localhost:3000`.

### Cách 2: Khởi chạy bằng dòng lệnh Terminal
```bash
# Cài đặt thư viện (chỉ cần chạy lần đầu)
npm install

# Khởi động máy chủ ứng dụng
npm run dev
```
Sau đó mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Cấu hình Google Gemini AI Key
1. Vào mục **Cài đặt (Settings)** trên thanh menu của ứng dụng.
2. Dán mã **Gemini API Key** của bạn (Tạo miễn phí 100% tại [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Bấm **Lưu cài đặt**.
*(Ứng dụng cũng có sẵn từ điển mẫu Offline để bạn trải nghiệm ngay cả khi chưa nhập key).*
