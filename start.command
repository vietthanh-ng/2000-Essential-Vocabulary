#!/bin/bash
# Script khởi chạy ứng dụng VocabAI trên macOS bằng 1 click chuột

cd "$(dirname "$0")"

echo "================================================"
echo "    🚀 Đang khởi động VocabAI Learning App...   "
echo "================================================"
echo ""

# Giải phóng port 3000 nếu đang bị chiếm dụng
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Kiểm tra node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Đang cài đặt thư viện lần đầu..."
    npm install
fi

# Chờ server Next.js khởi động xong hoàn toàn rồi mới mở trình duyệt (tránh lỗi 404)
(
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
            open "http://localhost:3000"
            break
        fi
        sleep 1
    done
) &

# Khởi chạy máy chủ Next.js
echo "✨ Máy chủ đang khởi động tại: http://localhost:3000"
echo "👉 Bấm Ctrl + C trong cửa sổ này khi muốn dừng ứng dụng."
echo ""
npm run dev
