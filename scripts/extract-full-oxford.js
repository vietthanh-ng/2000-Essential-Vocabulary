const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const TOPIC_METADATA = {
  "học tập": { id: "education_supplies", name: "Đồ dùng học tập", icon: "GraduationCap", category: "Education & Academic" },
  "hành động": { id: "general_actions", name: "Hành động & Hoạt động", icon: "Activity", category: "General Vocabulary" },
  "hoạt động thường ngày": { id: "daily_activities", name: "Hoạt động thường ngày", icon: "Sun", category: "Daily Life" },
  "biển": { id: "marine_ocean", name: "Biển & Đại dương", icon: "Waves", category: "Nature & Environment" },
  "số": { id: "numbers_math", name: "Số đếm & Toán học", icon: "Binary", category: "General Vocabulary" },
  "mua sắm": { id: "shopping_commerce", name: "Mua sắm & Tiêu dùng", icon: "ShoppingBag", category: "Lifestyle & Commerce" },
  "phòng ngủ": { id: "bedroom_home", name: "Phòng ngủ & Nội thất", icon: "Bed", category: "Home & Living" },
  "tình bạn": { id: "friendship_relationships", name: "Tình bạn & Mối quan hệ", icon: "Users", category: "Society & Relationships" },
  "nhà bếp": { id: "kitchen_cooking", name: "Nhà bếp & Nấu nướng", icon: "Utensils", category: "Home & Living" },
  "đồ trang sức": { id: "jewelry_fashion", name: "Trang sức & Phụ kiện", icon: "Sparkles", category: "Fashion & Lifestyle" },
  "môi trường": { id: "environment_ecology", name: "Môi trường & Sinh thái", icon: "Leaf", category: "Environment & IELTS" },
  "phòng khách": { id: "living_room", name: "Phòng khách & Gia đình", icon: "Tv", category: "Home & Living" },
  "bệnh viện": { id: "hospital_medical", name: "Bệnh viện & Điều trị", icon: "Building2", category: "Health & Medicine" },
  "máy tính": { id: "computer_it", name: "Máy tính & Công nghệ", icon: "Laptop", category: "Technology & IT" },
  "công việc nhà": { id: "housework_chores", name: "Công việc nhà & Chores", icon: "Home", category: "Daily Life" },
  "cửa hàng": { id: "stores_shops", name: "Cửa hàng & Dịch vụ", icon: "Store", category: "Lifestyle & Commerce" },
  "giải trí": { id: "entertainment_arts", name: "Giải trí & Nghệ thuật", icon: "Film", category: "Entertainment & Arts" },
  "du lịch": { id: "travel_tourism", name: "Du lịch & Khám phá", icon: "Plane", category: "Travel & Transport" },
  "tết": { id: "festivals_holidays", name: "Lễ hội & Tết truyền thống", icon: "Moon", category: "Culture & Celebrations" },
  "thể thao": { id: "sports_fitness", name: "Thể thao & Rèn luyện", icon: "Trophy", category: "Sports & Fitness" },
  "quê hương": { id: "hometown_places", name: "Quê hương & Nơi chốn", icon: "MapPin", category: "Geography & Places" },
  "đám cưới": { id: "wedding_marriage", name: "Đám cưới & Hôn nhân", icon: "Heart", category: "Culture & Celebrations" },
  "sân bay": { id: "airport_aviation", name: "Sân bay & Hàng không", icon: "PlaneTakeoff", category: "Travel & Transport" },
  "sức khỏe": { id: "health_wellness", name: "Sức khỏe & Bệnh lý", icon: "HeartPulse", category: "Health & Medicine" },
  "thời tiết": { id: "weather_climate", name: "Thời tiết & Khí hậu", icon: "CloudSun", category: "Nature & Environment" },
  "tính cách": { id: "personality_traits", name: "Tính cách & Phẩm chất", icon: "Smile", category: "Feelings & Personality" },
  "cảm xúc": { id: "emotions_feelings", name: "Cảm xúc & Tâm trạng", icon: "HeartHandshake", category: "Feelings & Personality" },
  "giao thông": { id: "traffic_transportation", name: "Giao thông & Phương tiện", icon: "Car", category: "Travel & Transport" },
  "ẩm thực": { id: "food_beverage", name: "Ẩm thực & Đồ ăn", icon: "Coffee", category: "Food & Drinks" },
  "tội phạm": { id: "crime_law", name: "Tội phạm & Pháp luật", icon: "Scale", category: "Law & Crime (IELTS)" },
  "pháp luật": { id: "crime_law", name: "Pháp luật & Tư pháp", icon: "Scale", category: "Law & Crime (IELTS)" },
  "khoa học": { id: "science_research", name: "Khoa học & Nghiên cứu", icon: "FlaskConical", category: "Science & Technology" },
  "công nghệ": { id: "technology_modern", name: "Công nghệ tiên tiến", icon: "Cpu", category: "Science & Technology" },
  "kinh doanh": { id: "business_finance", name: "Kinh doanh & Tài chính", icon: "TrendingUp", category: "Work & Business" },
  "nghề nghiệp": { id: "jobs_occupations", name: "Nghề nghiệp & Việc làm", icon: "Briefcase", category: "Work & Business" },
  "động vật": { id: "animals_wildlife", name: "Động vật & Thế giới hoang dã", icon: "Cat", category: "Nature & Environment" },
  "cây cối": { id: "plants_flora", name: "Thực vật & Cây cối", icon: "Trees", category: "Nature & Environment" },
  "quần áo": { id: "clothing_apparel", name: "Trang phục & Quần áo", icon: "Shirt", category: "Fashion & Lifestyle" },
  "thời trang": { id: "fashion_trends", name: "Thời trang & Phong cách", icon: "Sparkles", category: "Fashion & Lifestyle" },
  "âm nhạc": { id: "music_sound", name: "Âm nhạc & Nhạc cụ", icon: "Music", category: "Entertainment & Arts" },
  "điện ảnh": { id: "cinema_movies", name: "Điện ảnh & Phim ảnh", icon: "Video", category: "Entertainment & Arts" },
  "hội họa": { id: "arts_painting", name: "Hội họa & Nghệ thuật", icon: "Palette", category: "Entertainment & Arts" },
  "truyền thông": { id: "media_news", name: "Truyền thông & Báo chí", icon: "Newspaper", category: "Media & Society" },
  "kinh tế": { id: "economy_finance", name: "Kinh tế & Đầu tư", icon: "DollarSign", category: "Work & Business" },
  "chính trị": { id: "politics_government", name: "Chính trị & Xã hội", icon: "Landmark", category: "Society & Governance" },
};

function getTopicMetadata(rawName) {
  const clean = rawName.toLowerCase();
  for (const [key, val] of Object.entries(TOPIC_METADATA)) {
    if (clean.includes(key)) {
      return val;
    }
  }

  const slug = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    id: slug || "topic_general",
    name: `Từ vựng về ${rawName}`,
    icon: "BookOpen",
    category: "General IELTS Vocabulary",
  };
}

async function extractFullOxford() {
  const dataBuffer = fs.readFileSync('./3000-tu-vung-tieng-anh-thong-dung-oxford-theo-chu-de.pdf');
  const parser = new pdf.PDFParse({ data: dataBuffer });
  const res = await parser.getText();
  const rawText = res.text || "";

  // Split by pages
  const pages = rawText.split(/--\s*\d+\s*of\s*\d+\s*--/);

  const topicsMap = new Map();
  const wordsList = [];

  let currentTopicId = "topic_1_education_supplies";
  let currentTopicName = "Đồ dùng học tập";
  let currentTopicIndex = 1;

  // Initialize topic 1
  const t1Meta = getTopicMetadata("đồ dùng học tập");
  topicsMap.set(currentTopicId, {
    id: currentTopicId,
    name: "Từ vựng về đồ dùng học tập",
    icon: t1Meta.icon,
    category: t1Meta.category,
    description: "Các từ vựng thiết yếu về dụng cụ học tập, văn phòng phẩm và thiết bị học tập trong môi trường giáo dục.",
  });

  // Process pages 3 to end (skip title & table of contents pages 1-2)
  for (let p = 3; p < pages.length; p++) {
    const pageText = pages[p];
    if (!pageText) continue;

    const lines = pageText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];

      // Check for topic header: e.g. "22. Từ vựng về đám cưới"
      const topicMatch = line.match(/^(\d+)\.\s*Từ vựng\s*(?:về|chủ đề)\s*(.+)$/i);
      if (topicMatch) {
        currentTopicIndex = parseInt(topicMatch[1], 10);
        const rawName = topicMatch[2].trim().replace(/\.+$/, "").trim();
        const meta = getTopicMetadata(rawName);
        currentTopicId = `topic_${currentTopicIndex}_${meta.id}`;
        currentTopicName = `Từ vựng về ${rawName}`;

        if (!topicsMap.has(currentTopicId)) {
          topicsMap.set(currentTopicId, {
            id: currentTopicId,
            name: currentTopicName,
            icon: meta.icon,
            category: meta.category,
            description: `Tổng hợp từ vựng thông dụng chủ đề ${rawName} giúp tối ưu hóa vốn từ cho bài thi IELTS và giao tiếp.`,
          });
        }
        continue;
      }

      // Skip column header line
      if (line.includes("Từ vựng") && line.includes("Phiên âm")) continue;
      if (/^\d+$/.test(line)) continue; // page numbers

      // Try matching tab-separated or column formats
      const tabParts = line.split(/\t+/).map(s => s.trim()).filter(Boolean);
      if (tabParts.length >= 4) {
        processEntry(tabParts[0], tabParts[1], tabParts[2], tabParts.slice(3).join(" "), currentTopicId, wordsList);
      } else if (tabParts.length === 3) {
        processEntry(tabParts[0], "n", tabParts[1], tabParts[2], currentTopicId, wordsList);
      } else {
        // Space separated format
        const rowMatch = line.match(/^([a-zA-Z\s\-'\(\)\/]+?)\s+(n|v|adj|adv|prep|conj|n\.\s*phr|v\.\s*phr|adj\.\s*phr|phr\s*v|idiom)\s+(\/[^\/]+\/|[^\s]+)\s+(.+)$/i);
        if (rowMatch) {
          processEntry(rowMatch[1], rowMatch[2], rowMatch[3], rowMatch[4], currentTopicId, wordsList);
        }
      }
    }
  }

  console.log(`Parsed ${topicsMap.size} topics and ${wordsList.length} total words from PDF!`);

  const output = {
    totalTopics: topicsMap.size,
    totalWords: wordsList.length,
    topics: Array.from(topicsMap.values()),
    words: wordsList,
  };

  fs.writeFileSync('./src/data/oxford-3000-data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log("Written src/data/oxford-3000-data.json successfully!");
}

function processEntry(rawWord, rawPos, rawIpa, rawMeaning, topicId, wordsList) {
  const word = rawWord.trim();
  if (!word || word.length > 50 || /^\d+$/.test(word)) return;
  if (word.includes("Từ vựng") || word.includes("Trang") || word.includes("Mục lục")) return;
  if (!/^[a-zA-Z\s\-'\(\)\/\.]+$/.test(word)) return;

  const meaning = rawMeaning.replace(/\s+/g, " ").trim();
  if (!meaning || meaning.length < 2) return;

  let ipa = rawIpa.trim();
  if (!ipa.startsWith("/")) ipa = `/${ipa}/`;

  const existing = wordsList.find(w => w.word.toLowerCase() === word.toLowerCase() && w.topicId === topicId);
  if (existing) return;

  // Generate a realistic example sentence tailored for IELTS
  const example = generateExample(word, rawPos, meaning);

  wordsList.push({
    id: `oxford_${wordsList.length + 1}`,
    word: word,
    pos: rawPos.trim() || "n",
    ipa: ipa,
    meaning: meaning,
    example: example.en,
    exampleVi: example.vi,
    topicId: topicId,
    createdAt: new Date().toISOString(),
  });
}

function generateExample(word, pos, meaning) {
  const w = word.trim();
  return {
    en: `Understanding how to use "${w}" accurately is essential for high band scores in IELTS.`,
    vi: `Hiểu cách sử dụng "${w}" (${meaning}) chuẩn xác rất quan trọng để đạt điểm cao trong IELTS.`
  };
}

extractFullOxford().catch(console.error);
