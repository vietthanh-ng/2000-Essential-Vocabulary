const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Topic icon and category mappings
const TOPIC_METADATA = {
  "học tập": { id: "education", name: "Đồ dùng & Học tập", icon: "GraduationCap", category: "Education & Academic" },
  "trường học": { id: "education", name: "Trường học & Giáo dục", icon: "GraduationCap", category: "Education & Academic" },
  "giáo dục": { id: "education", name: "Giáo dục", icon: "GraduationCap", category: "Education & Academic" },
  "hành động": { id: "actions", name: "Hành động & Động từ", icon: "Activity", category: "General Actions" },
  "hoạt động thường ngày": { id: "daily_life", name: "Hoạt động thường ngày", icon: "Sun", category: "Daily Life" },
  "biển": { id: "nature", name: "Biển & Đại dương", icon: "Waves", category: "Nature & Environment" },
  "số": { id: "numbers", name: "Số đếm & Toán học", icon: "Binary", category: "Numbers & Math" },
  "mua sắm": { id: "shopping", name: "Mua sắm & Tiêu dùng", icon: "ShoppingBag", category: "Shopping & Commerce" },
  "phòng ngủ": { id: "home", name: "Phòng ngủ & Nhà cửa", icon: "Bed", category: "Home & Living" },
  "nhà bếp": { id: "kitchen", name: "Nhà bếp & Nấu nướng", icon: "Utensils", category: "Home & Living" },
  "phòng khách": { id: "living_room", name: "Phòng khách", icon: "Tv", category: "Home & Living" },
  "tình bạn": { id: "relationships", name: "Tình bạn & Mối quan hệ", icon: "Users", category: "Society & Relationships" },
  "đồ trang sức": { id: "fashion", name: "Đồ trang sức & Thời trang", icon: "Sparkles", category: "Fashion & Lifestyle" },
  "môi trường": { id: "environment", name: "Môi trường & Sinh thái", icon: "Leaf", category: "Environment" },
  "bệnh viện": { id: "health", name: "Bệnh viện & Y tế", icon: "HeartPulse", category: "Health & Medicine" },
  "sức khỏe": { id: "health", name: "Sức khỏe", icon: "HeartPulse", category: "Health & Medicine" },
  "máy tính": { id: "technology", name: "Máy tính & Công nghệ", icon: "Laptop", category: "Technology & IT" },
  "công nghệ": { id: "technology", name: "Công nghệ thông tin", icon: "Cpu", category: "Technology & IT" },
  "công việc nhà": { id: "housework", name: "Công việc nhà", icon: "Home", category: "Daily Life" },
  "công việc": { id: "business", name: "Công việc & Sự nghiệp", icon: "Briefcase", category: "Work & Business" },
  "kinh doanh": { id: "business", name: "Kinh doanh & Thương mại", icon: "TrendingUp", category: "Work & Business" },
  "cửa hàng": { id: "shopping", name: "Cửa hàng & Dịch vụ", icon: "Store", category: "Shopping & Commerce" },
  "giải trí": { id: "entertainment", name: "Giải trí & Nghệ thuật", icon: "Film", category: "Entertainment & Arts" },
  "du lịch": { id: "travel", name: "Du lịch & Khám phá", icon: "Plane", category: "Travel & Transport" },
  "thể thao": { id: "sports", name: "Thể thao & Rèn luyện", icon: "Trophy", category: "Sports & Fitness" },
  "quê hương": { id: "places", name: "Quê hương & Nơi chốn", icon: "MapPin", category: "Geography & Places" },
  "đám cưới": { id: "celebrations", name: "Đám cưới & Lễ hội", icon: "Heart", category: "Culture & Celebrations" },
  "sân bay": { id: "travel", name: "Sân bay & Giao thông", icon: "PlaneTakeoff", category: "Travel & Transport" },
  "thời tiết": { id: "weather", name: "Thời tiết & Khí hậu", icon: "CloudSun", category: "Nature & Environment" },
  "tính cách": { id: "personality", name: "Tính cách & Cảm xúc", icon: "Smile", category: "Feelings & Personality" },
  "cảm xúc": { id: "feelings", name: "Cảm xúc", icon: "Heart", category: "Feelings & Personality" },
  "giao thông": { id: "transport", name: "Giao thông & Phương tiện", icon: "Car", category: "Travel & Transport" },
  "ẩm thực": { id: "food", name: "Ẩm thực & Đồ ăn", icon: "UtensilsCrossed", category: "Food & Drinks" },
  "đồ ăn": { id: "food", name: "Đồ ăn & Thức uống", icon: "Coffee", category: "Food & Drinks" },
  "luật": { id: "crime", name: "Pháp luật & Tội phạm", icon: "Scale", category: "Law & Crime" },
  "tội phạm": { id: "crime", name: "Tội phạm", icon: "ShieldAlert", category: "Law & Crime" },
  "khoa học": { id: "science", name: "Khoa học & Đời sống", icon: "FlaskConical", category: "Science" },
};

function getTopicMetadata(topicName) {
  const cleanName = topicName.toLowerCase();
  for (const [key, meta] of Object.entries(TOPIC_METADATA)) {
    if (cleanName.includes(key)) {
      return meta;
    }
  }
  
  // Default slugify
  const slug = topicName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    id: slug || "general",
    name: topicName,
    icon: "BookOpen",
    category: "General IELTS Topics",
  };
}

async function parseOxfordPDF() {
  console.log("Reading PDF file...");
  const dataBuffer = fs.readFileSync('./3000-tu-vung-tieng-anh-thong-dung-oxford-theo-chu-de.pdf');
  const parser = new pdf.PDFParse({ data: dataBuffer });
  const res = await parser.getText();
  const text = res.text || "";

  const lines = text.split(/\r?\n/);
  console.log("Total raw text lines:", lines.length);

  const topicsMap = new Map();
  const wordsList = [];

  let currentTopic = null;
  let currentTopicId = "general";
  let inVocabularySection = false;

  const topicHeaderRegex = /^\s*(\d+)\.\s*Từ vựng\s*(?:về|chủ đề)\s*(.+?)(?:\.{3,}.*)?$/i;

  let bufferLine = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Check page footer/header like "-- 3 of 107 --" or numbers
    if (/^--\s*\d+\s*of\s*\d+\s*--$/.test(line) || /^\d+$/.test(line)) {
      continue;
    }

    // Check if line is Table of Contents or Topic Title
    const match = line.match(topicHeaderRegex);
    if (match) {
      const topicIndex = parseInt(match[1], 10);
      const rawTopicName = match[2].trim().replace(/\.+$/, "").trim();
      
      // Determine if this is the actual content page header
      // If there's no dots trailing or if we are beyond page 2
      const meta = getTopicMetadata(rawTopicName);
      currentTopicId = `topic_${topicIndex}_${meta.id}`;
      
      currentTopic = {
        id: currentTopicId,
        index: topicIndex,
        rawName: rawTopicName,
        name: `Từ vựng về ${rawTopicName}`,
        icon: meta.icon,
        category: meta.category,
      };

      if (!topicsMap.has(currentTopicId)) {
        topicsMap.set(currentTopicId, currentTopic);
      }
      continue;
    }

    // Skip table column headers
    if (line.includes("Từ vựng") && line.includes("Từ loại") && line.includes("Phiên âm")) {
      inVocabularySection = true;
      continue;
    }

    // Try parsing tab/whitespace-separated vocabulary rows
    // e.g. "Watercolour \t n \t /ˈwɔː.təˌkʌl.ər/ \t Màu nước"
    // Or parts split across tabs
    const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 4) {
      const word = parts[0];
      const pos = parts[1];
      const ipa = parts[2];
      const meaning = parts.slice(3).join(" ");

      if (isValidWord(word) && currentTopic) {
        addWord(word, pos, ipa, meaning, currentTopicId, wordsList);
      }
    } else if (parts.length === 3) {
      // Sometimes POS is missing or joined
      const word = parts[0];
      let pos = "n";
      let ipa = parts[1];
      let meaning = parts[2];

      if (ipa.startsWith("/") || ipa.includes("/")) {
        if (isValidWord(word) && currentTopic) {
          addWord(word, pos, ipa, meaning, currentTopicId, wordsList);
        }
      }
    } else {
      // Try regex match for "Word [pos] /ipa/ Meaning"
      const rowRegex = /^([a-zA-Z\s\-'\(\)]+?)\s+(n|v|adj|adv|prep|conj|n\.\s*phr|v\.\s*phr|adj\.\s*phr|phr\s*v|idiom)\s+(\/[^\/]+\/|[\wˈˌːɪeæɑɒɔʊuʌəɜθðʃʒtʃdʒŋɡ\-]+)\s+(.+)$/i;
      const rMatch = line.match(rowRegex);
      if (rMatch && isValidWord(rMatch[1]) && currentTopic) {
        addWord(rMatch[1].trim(), rMatch[2].trim(), rMatch[3].trim(), rMatch[4].trim(), currentTopicId, wordsList);
      }
    }
  }

  console.log(`Extracted ${topicsMap.size} topics and ${wordsList.length} vocabulary words!`);
  
  // Output JSON files
  const output = {
    totalTopics: topicsMap.size,
    totalWords: wordsList.length,
    topics: Array.from(topicsMap.values()),
    words: wordsList,
  };

  fs.writeFileSync('./src/data/oxford-3000-data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log("Saved to src/data/oxford-3000-data.json successfully!");
}

function isValidWord(str) {
  if (!str || str.length > 50) return false;
  if (/^\d+$/.test(str)) return false;
  if (str.includes("Mục lục") || str.includes("Trang") || str.includes("Từ vựng")) return false;
  return /^[a-zA-Z\s\-'\(\)]+$/.test(str);
}

function addWord(word, pos, ipa, meaning, topicId, wordsList) {
  const cleanWord = word.trim();
  if (wordsList.some(w => w.word.toLowerCase() === cleanWord.toLowerCase() && w.topicId === topicId)) {
    return;
  }

  wordsList.push({
    id: `word_${wordsList.length + 1}`,
    word: cleanWord,
    pos: pos || "n",
    ipa: ipa.startsWith("/") ? ipa : `/${ipa}/`,
    meaning: meaning.replace(/\s+/g, " ").trim(),
    topicId: topicId,
    example: `The word "${cleanWord}" is commonly used in IELTS academic and general contexts.`,
    createdAt: new Date().toISOString(),
  });
}

parseOxfordPDF().catch(console.error);
