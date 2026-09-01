import { Topic } from "@/types";

// Semantic keywords mapped to standard IELTS / Oxford Topic IDs
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  topic_11_environment_ecology: [
    "environment", "nature", "pollution", "ecology", "climate", "recycle", "carbon", "greenhouse",
    "forest", "wildlife", "ocean", "ecosystem", "sustainable", "renewable", "emission", "waste",
    "habitat", "conservation", "biodiversity", "atmosphere", "species", "solar", "ozone", "drought",
    "môi trường", "ô nhiễm", "khí hậu", "tái chế", "sinh thái", "rác thải", "bảo tồn"
  ],
  topic_14_computer_it: [
    "computer", "software", "hardware", "technology", "internet", "code", "programming", "data",
    "algorithm", "digital", "network", "cyber", "ai", "artificial intelligence", "database", "server",
    "cloud", "device", "application", "system", "processor", "screen", "keyboard", "robot",
    "máy tính", "công nghệ", "phần mềm", "lập trình", "dữ liệu", "mạng", "điện tử"
  ],
  topic_1_education_supplies: [
    "education", "school", "university", "student", "teacher", "learn", "study", "exam", "grade",
    "degree", "academic", "class", "lecture", "book", "pen", "notebook", "pencil", "scholarship",
    "curriculum", "campus", "course", "textbook", "professor", "knowledge", "research",
    "học tập", "trường học", "giáo dục", "học sinh", "sách", "bút", "vở", "thi cử", "đại học"
  ],
  topic_24_health_wellness: [
    "health", "hospital", "doctor", "nurse", "medicine", "disease", "illness", "sick", "pain",
    "fever", "virus", "infection", "symptom", "surgery", "treatment", "clinic", "cure", "drug",
    "patient", "diet", "nutrition", "mental", "wellness", "fitness", "therapy", "wound", "bleed",
    "sức khỏe", "bệnh viện", "bác sĩ", "thuốc", "bệnh", "đau", "sốt", "điều trị", "khám"
  ],
  topic_30_crime_law: [
    "crime", "criminal", "law", "police", "court", "judge", "illegal", "prison", "jail", "arrest",
    "theft", "murder", "robbery", "punishment", "justice", "victim", "guilty", "innocent", "verdict",
    "legal", "rule", "penalty", "evidence", "witness", "lawyer", "offence",
    "tội phạm", "pháp luật", "cảnh sát", "tòa án", "luật", "bắt giữ", "nhà tù", "hình phạt"
  ],
  topic_27_business_finance: [
    "business", "company", "work", "job", "career", "money", "finance", "market", "economy",
    "investment", "profit", "salary", "wage", "boss", "manager", "employee", "trade", "commercial",
    "stock", "bank", "credit", "tax", "industry", "enterprise", "consumer", "sales", "revenue",
    "kinh doanh", "công việc", "tiền tệ", "tài chính", "thị trường", "lợi nhuận", "lương", "công ty"
  ],
  topic_18_travel_tourism: [
    "travel", "trip", "tour", "tourism", "hotel", "resort", "flight", "plane", "ticket", "luggage",
    "passport", "journey", "destination", "explore", "vacation", "holiday", "guide", "sightseeing",
    "du lịch", "khách sạn", "chuyến đi", "vé máy bay", "hành lý", "hộ chiếu", "kỳ nghỉ"
  ],
  topic_20_sports_fitness: [
    "sport", "football", "soccer", "basketball", "tennis", "swim", "match", "game", "team", "player",
    "champion", "tournament", "fitness", "gym", "exercise", "workout", "stadium", "athlete", "medal",
    "thể thao", "bóng đá", "bơi lội", "trận đấu", "tập luyện", "vận động viên", "huy chương"
  ],
  topic_26_personality_traits: [
    "personality", "character", "kind", "friendly", "honest", "brave", "smart", "clever", "lazy",
    "hardworking", "polite", "rude", "generous", "selfish", "confident", "shy", "calm", "patient",
    "tính cách", "thân thiện", "tốt bụng", "trung thực", "chăm chỉ", "lười biếng", "tự tin"
  ],
  topic_27_emotions_feelings: [
    "emotion", "feeling", "happy", "sad", "angry", "excited", "nervous", "anxious", "scared", "fear",
    "joy", "love", "hate", "depressed", "satisfied", "disappointed", "surprised", "proud",
    "cảm xúc", "vui vẻ", "buồn bã", "tức giận", "hào hứng", "lo lắng", "sợ hãi", "hạnh phúc"
  ],
  topic_28_food_beverage: [
    "food", "drink", "eat", "cook", "meal", "restaurant", "recipe", "delicious", "tasty", "fruit",
    "vegetable", "meat", "fish", "bread", "coffee", "tea", "water", "breakfast", "lunch", "dinner",
    "ẩm thực", "đồ ăn", "thức uống", "nấu ăn", "món ăn", "nhà hàng", "trái cây", "rau củ"
  ],
  topic_29_traffic_transportation: [
    "traffic", "transport", "car", "bus", "train", "vehicle", "road", "street", "highway", "driver",
    "passenger", "station", "subway", "bicycle", "motorcycle", "congestion", "jam",
    "giao thông", "xe cộ", "ô tô", "xe buýt", "tàu hỏa", "đường phố", "tắc đường"
  ],
  topic_17_entertainment_arts: [
    "entertainment", "movie", "film", "cinema", "music", "song", "art", "theatre", "actor", "concert",
    "performance", "painting", "museum", "gallery", "dance", "instrument", "guitar", "piano",
    "giải trí", "phim ảnh", "âm nhạc", "nghệ thuật", "rạp hát", "hòa nhạc", "hội họa"
  ],
  topic_3_daily_activities: [
    "daily", "routine", "morning", "night", "wake up", "sleep", "brush", "wash", "dress", "clean",
    "habit", "everyday", "schedule", "shower", "relax", "chores",
    "hàng ngày", "thường ngày", "thói quen", "thức dậy", "đi ngủ", "rửa mặt", "đánh răng"
  ]
};

/**
 * Auto-suggest the most relevant topic ID for a word and its meaning/definition
 */
export function autoCategorizeWord(
  word: string,
  meaning?: string,
  allTopics: Topic[] = []
): { topicId: string; confidence: number; topicName?: string } {
  const query = `${word.toLowerCase()} ${meaning?.toLowerCase() || ""}`;
  
  let bestTopicId = "topic_1_education_supplies";
  let maxScore = 0;

  for (const [topicId, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (query.includes(kw)) {
        score += kw.length > 5 ? 3 : 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestTopicId = topicId;
    }
  }

  // If match found in allTopics
  const matchedTopic = allTopics.find(
    (t) => t.id === bestTopicId || t.id.includes(bestTopicId.replace(/^topic_\d+_/, ""))
  );

  return {
    topicId: matchedTopic?.id || (allTopics[0]?.id ?? bestTopicId),
    confidence: maxScore > 0 ? Math.min(0.95, 0.5 + maxScore * 0.1) : 0.4,
    topicName: matchedTopic?.name,
  };
}
