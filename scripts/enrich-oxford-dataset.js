const fs = require('fs');
const path = require('path');

// Topic-aware sentence templates and context mappings to make every word's sentence realistic and natural
const TOPIC_PATTERNS = {
  education_supplies: [
    (w, m) => ({
      en: `Could you lend me your ${w.toLowerCase()} for a few minutes?`,
      vi: `Bạn cho tôi mượn ${m.toLowerCase()} của bạn vài phút được không?`
    }),
    (w, m) => ({
      en: `She always keeps a spare ${w.toLowerCase()} in her bag just in case.`,
      vi: `Cô ấy luôn mang theo một ${m.toLowerCase()} dự phòng trong túi phòng khi cần.`
    }),
    (w, m) => ({
      en: `I left my ${w.toLowerCase()} on the desk after finishing the assignment.`,
      vi: `Tôi đã để quên ${m.toLowerCase()} trên bàn làm việc sau khi làm xong bài tập.`
    })
  ],
  general_actions: [
    (w, m) => ({
      en: `It takes consistent daily practice to ${w.toLowerCase()} effectively.`,
      vi: `Cần phải luyện tập đều đặn hàng ngày để có thể ${m.toLowerCase()} một cách hiệu quả.`
    }),
    (w, m) => ({
      en: `He decided to ${w.toLowerCase()} carefully before making the final decision.`,
      vi: `Anh ấy đã quyết định ${m.toLowerCase()} thật cẩn thận trước khi đưa ra quyết định cuối cùng.`
    }),
    (w, m) => ({
      en: `They learned how to ${w.toLowerCase()} properly during the training session.`,
      vi: `Họ đã học cách ${m.toLowerCase()} bài bản trong buổi huấn luyện.`
    })
  ],
  daily_activities: [
    (w, m) => ({
      en: `She makes it a habit to ${w.toLowerCase()} every single morning.`,
      vi: `Cô ấy tạo thói quen ${m.toLowerCase()} vào mỗi buổi sáng.`
    }),
    (w, m) => ({
      en: `Maintaining a healthy routine to ${w.toLowerCase()} boosts your energy throughout the day.`,
      vi: `Duy trì thói quen ${m.toLowerCase()} giúp bạn tràn đầy năng lượng suốt cả ngày.`
    })
  ],
  environment_ecology: [
    (w, m) => ({
      en: `Protecting the natural balance of ${w.toLowerCase()} is vital for our planet's future.`,
      vi: `Bảo vệ sự cân bằng tự nhiên của ${m.toLowerCase()} là điều sống còn cho tương lai hành tinh chúng ta.`
    }),
    (w, m) => ({
      en: `Human activities have caused severe damage to ${w.toLowerCase()} in recent decades.`,
      vi: `Các hoạt động của con người đã gây ra tổn hại nghiêm trọng đến ${m.toLowerCase()} trong những thập kỷ gần đây.`
    })
  ],
  health_wellness: [
    (w, m) => ({
      en: `The doctor advised the patient to treat the ${w.toLowerCase()} immediately.`,
      vi: `Bác sĩ đã khuyên bệnh nhân nên điều trị chứng ${m.toLowerCase()} ngay lập tức.`
    }),
    (w, m) => ({
      en: `Regular exercise and a balanced diet can prevent many symptoms of ${w.toLowerCase()}.`,
      vi: `Tập thể dục đều đặn và chế độ ăn cân bằng có thể phòng ngừa nhiều triệu chứng của ${m.toLowerCase()}.`
    })
  ],
  computer_it: [
    (w, m) => ({
      en: `Modern software systems rely heavily on advanced ${w.toLowerCase()} technology.`,
      vi: `Các hệ thống phần mềm hiện đại phụ thuộc rất nhiều vào công nghệ ${m.toLowerCase()} tiên tiến.`
    }),
    (w, m) => ({
      en: `The engineer configured the ${w.toLowerCase()} to optimize system performance.`,
      vi: `Kỹ sư đã cấu hình ${m.toLowerCase()} để tối ưu hóa hiệu năng hệ thống.`
    })
  ],
  shopping_commerce: [
    (w, m) => ({
      en: `Customers can easily purchase ${w.toLowerCase()} at discounted prices during sales season.`,
      vi: `Khách hàng có thể dễ dàng mua ${m.toLowerCase()} với mức giá ưu đãi trong mùa khuyến mãi.`
    }),
    (w, m) => ({
      en: `The shop offers a wide variety of ${w.toLowerCase()} to meet consumer demands.`,
      vi: `Cửa hàng cung cấp đa dạng các loại ${m.toLowerCase()} nhằm đáp ứng nhu cầu của người tiêu dùng.`
    })
  ],
  travel_tourism: [
    (w, m) => ({
      en: `Travelers should prepare their ${w.toLowerCase()} carefully before boarding the plane.`,
      vi: `Du khách nên chuẩn bị ${m.toLowerCase()} cẩn thận trước khi lên máy bay.`
    }),
    (w, m) => ({
      en: `Exploring new destinations allows you to experience unique ${w.toLowerCase()} firsthand.`,
      vi: `Khám phá các điểm đến mới giúp bạn trải nghiệm tận mắt ${m.toLowerCase()} vô cùng độc đáo.`
    })
  ],
  sports_fitness: [
    (w, m) => ({
      en: `Professional athletes train intensively to master ${w.toLowerCase()} in competitions.`,
      vi: `Các vận động viên chuyên nghiệp tập luyện cường độ cao để thành thạo ${m.toLowerCase()} trong các giải đấu.`
    })
  ],
  personality_traits: [
    (w, m) => ({
      en: `Being genuinely ${w.toLowerCase()} helps build long-lasting trust in relationships.`,
      vi: `Sự ${m.toLowerCase()} chân thành giúp xây dựng lòng tin bền vững trong các mối quan hệ.`
    })
  ]
};

function getSmartExample(word, meaning, topicId, index) {
  // Check specific matching key
  for (const [key, templates] of Object.entries(TOPIC_PATTERNS)) {
    if (topicId.includes(key)) {
      const template = templates[index % templates.length];
      return template(word, meaning);
    }
  }

  // General natural pattern
  const generalPatterns = [
    (w, m) => ({
      en: `Learning how to apply "${w}" in real communication makes your English natural and fluent.`,
      vi: `Học cách áp dụng "${w}" (${m}) trong giao tiếp thực tế giúp tiếng Anh của bạn tự nhiên và trôi chảy hơn.`
    }),
    (w, m) => ({
      en: `In daily conversation, native speakers frequently use the term "${w}".`,
      vi: `Trong giao tiếp hàng ngày, người bản xứ thường xuyên sử dụng từ "${w}" (${m}).`
    }),
    (w, m) => ({
      en: `Understanding the exact context of "${w}" is essential for academic and professional success.`,
      vi: `Hiểu rõ ngữ cảnh chính xác của "${w}" (${m}) là điều thiết yếu để thành công trong học thuật và công việc.`
    })
  ];

  const fn = generalPatterns[index % generalPatterns.length];
  return fn(word, meaning);
}

function getUsageAndNuance(word, pos, meaning, topicName) {
  return {
    usageWhen: `Thường dùng trong chủ đề ${topicName || "giao tiếp hàng ngày"}, bài thi IELTS Speaking/Writing và văn cảnh thực tế.`,
    nuances: [
      `Mang nghĩa chính: ${meaning}.`,
      `Sắc thái từ: ${pos === 'adj' ? 'Tính từ miêu tả đặc điểm' : pos === 'v' ? 'Động từ chỉ hành động' : 'Danh từ chỉ khái niệm/sự vật'} được dùng phổ biến trong văn phong chuẩn mực.`
    ],
    synonyms: generateSimpleSynonyms(word, pos)
  };
}

function generateSimpleSynonyms(word, pos) {
  // Simple heuristic or common synonyms
  const w = word.toLowerCase();
  const map = {
    "important": ["crucial", "essential", "vital", "significant"],
    "book": ["volume", "publication", "tome"],
    "teacher": ["instructor", "educator", "tutor", "mentor"],
    "student": ["learner", "pupil", "scholar"],
    "study": ["learn", "examine", "research"],
    "happy": ["cheerful", "delighted", "joyful"],
    "beautiful": ["gorgeous", "attractive", "stunning"],
    "big": ["huge", "massive", "enormous", "gigantic"],
    "small": ["tiny", "little", "compact"],
    "help": ["assist", "support", "aid"],
    "start": ["begin", "commence", "initiate"],
    "stop": ["halt", "cease", "terminate"],
    "difficult": ["challenging", "tough", "demanding"],
    "easy": ["simple", "straightforward", "effortless"],
  };

  if (map[w]) return map[w];
  return [`related words to ${word}`];
}

async function enrichDataset() {
  const filePath = './src/data/oxford-3000-data.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const topicMap = new Map(data.topics.map(t => [t.id, t.name]));

  const enrichedWords = data.words.map((item, idx) => {
    const topicName = topicMap.get(item.topicId) || "Chủ đề chung";
    const smartEx = getSmartExample(item.word, item.meaning, item.topicId, idx);
    const extra = getUsageAndNuance(item.word, item.pos, item.meaning, topicName);

    return {
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      partOfSpeech: item.pos || "n",
      meaning: item.meaning,
      example: smartEx.en,
      exampleVi: smartEx.vi,
      topicId: item.topicId,
      createdAt: item.createdAt || new Date().toISOString(),
      usageWhen: extra.usageWhen,
      nuances: extra.nuances,
      synonyms: extra.synonyms,
    };
  });

  const output = {
    totalTopics: data.topics.length,
    totalWords: enrichedWords.length,
    topics: data.topics,
    words: enrichedWords,
  };

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Enriched ${enrichedWords.length} words with natural sentences and nuances!`);
}

enrichDataset().catch(console.error);
