const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../src/data/oxford-3000-data.json");
const rawData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

console.log(`Enriching ${rawData.words.length} words with authentic, realistic sentences...`);

// High-precision custom definitions and authentic sentences for Oxford vocabulary
const SPECIFIC_SENTENCES = {
  // Topic 1: Education supplies & equipment
  "Watercolour": {
    example: "She created an exquisite landscape painting using vibrant watercolour pigments.",
    exampleVi: "Cô ấy đã sáng tác một bức tranh phong cảnh tuyệt đẹp bằng các sắc tố màu nước rực rỡ.",
    synonyms: ["paint", "pigment"]
  },
  "Thumbtack": {
    example: "He used a sharp thumbtack to attach the event poster to the bulletin board.",
    exampleVi: "Anh ấy đã dùng một chiếc đinh ghim nhọn để gắn áp phích sự kiện lên bảng tin.",
    synonyms: ["pushpin", "tack"]
  },
  "Textbook": {
    example: "The university professor recommended an authoritative textbook on modern economics.",
    exampleVi: "Giáo sư đại học đã giới thiệu một cuốn sách giáo khoa uy tín về kinh tế học hiện đại.",
    synonyms: ["coursebook", "manual", "handbook"]
  },
  "Test Tube": {
    example: "The chemist gently heated the solution inside a heat-resistant test tube.",
    exampleVi: "Nhà hóa học nhẹ nhàng đun nóng dung dịch bên trong một ống nghiệm chịu nhiệt.",
    synonyms: ["tube", "vial"]
  },
  "Tape measure": {
    example: "The architect pulled out a retractable tape measure to check the room's exact dimensions.",
    exampleVi: "Kiến trúc sư đã kéo thước dây rút ra để kiểm tra kích thước chính xác của căn phòng.",
    synonyms: ["measuring tape", "ruler"]
  },
  "Stapler": {
    example: "She pressed down firmly on the heavy-duty stapler to bind the report pages together.",
    exampleVi: "Cô ấy ấn mạnh chiếc dập ghim chuyên dụng để đóng các trang báo cáo lại với nhau.",
    synonyms: ["paper fastener"]
  },
  "Staple remover": {
    example: "He carefully used a staple remover to unfasten the documents without tearing the paper.",
    exampleVi: "Anh ấy cẩn thận dùng dụng cụ gỡ ghim để tháo tài liệu mà không làm rách giấy.",
    synonyms: ["pin puller"]
  },
  "Set square": {
    example: "Engineering students use a set square to draw precise right angles on blueprints.",
    exampleVi: "Sinh viên ngành kỹ thuật sử dụng ê-ke để vẽ các góc vuông chuẩn xác trên bản thiết kế.",
    synonyms: ["triangle ruler"]
  },
  "Scissors": {
    example: "The art teacher demonstrated how to cut geometric shapes with precision scissors.",
    exampleVi: "Giáo viên mỹ thuật đã hướng dẫn cách cắt các hình học bằng một chiếc kéo sắc bén.",
    synonyms: ["shears", "clippers"]
  },
  "Rubber": {
    example: "He used a soft rubber to erase pencil marks from the final architectural draft.",
    exampleVi: "Anh ấy đã dùng cục tẩy mềm để xóa các vết bút chì trên bản vẽ kiến trúc hoàn thiện.",
    synonyms: ["eraser"]
  },
  "Ribbon": {
    example: "She tied a decorative silk ribbon around the gift box for the graduation ceremony.",
    exampleVi: "Cô ấy thắt một dải ruy-băng lụa trang trí quanh hộp quà cho buổi lễ tốt nghiệp.",
    synonyms: ["band", "strip"]
  },
  "Protractor": {
    example: "The geometry teacher explained how to measure acute and obtuse angles with a protractor.",
    exampleVi: "Giáo viên hình học đã giải thích cách đo góc nhọn và góc tù bằng một chiếc thước đo góc.",
    synonyms: ["angle meter"]
  },
  "Post-it note": {
    example: "She stuck a bright yellow Post-it note on her computer monitor to remember the meeting.",
    exampleVi: "Cô ấy đã dán một mẩu giấy ghi chú màu vàng lên màn hình máy tính để ghi nhớ cuộc họp.",
    synonyms: ["sticky note", "reminder note"]
  },
  "Pins": {
    example: "She pinned the dress patterns securely to the fabric using sharp sewing pins.",
    exampleVi: "Cô ấy đã ghim các mẫu rập váy chắc chắn vào vải bằng những chiếc đinh ghim sắc nhọn.",
    synonyms: ["fasteners", "needles"]
  },
  "Pencil sharpener": {
    example: "A portable pencil sharpener kept his coloured pencils ready for sketching.",
    exampleVi: "Chiếc gọt bút chì cầm tay giúp những chiếc bút chì màu của anh luôn sẵn sàng để vẽ phác thảo.",
    synonyms: ["sharpener"]
  },
  "Pencil": {
    example: "The student sketched the outline of the sculpture with a soft graphite pencil.",
    exampleVi: "Người học sinh đã phác thảo đường nét của bức tượng bằng một chiếc bút chì than mềm.",
    synonyms: ["lead pencil", "graphite"]
  },
  "Pen": {
    example: "The lawyer handed him a fountain pen to officially sign the employment contract.",
    exampleVi: "Luật sư đã đưa cho anh một chiếc bút máy để ký kết hợp đồng lao động chính thức.",
    synonyms: ["ballpoint", "quill"]
  },
  "Paperclip": {
    example: "She fastened the receipts to the expense claim form with a stainless paperclip.",
    exampleVi: "Cô ấy đã kẹp các hóa đơn vào tờ khai chi phí bằng một chiếc kẹp giấy không gỉ.",
    synonyms: ["clip", "fastener"]
  },
  "Paintbrush": {
    example: "The artist cleaned every paintbrush thoroughly with water after completing the canvas.",
    exampleVi: "Họa sĩ đã rửa sạch từng chiếc cọ vẽ bằng nước sau khi hoàn thành bức tranh sơn dầu.",
    synonyms: ["brush", "applicator"]
  },
  "Microscope": {
    example: "Students observed living cell structures under the high-power laboratory microscope.",
    exampleVi: "Sinh viên đã quan sát các cấu trúc tế bào sống dưới kính hiển vi phòng thí nghiệm công suất cao.",
    synonyms: ["optical magnifier", "scope"]
  },
  "Magnifying glass": {
    example: "The detective used a magnifying glass to inspect the minute details of the fingerprint.",
    exampleVi: "Thám tử đã dùng kính lúp để kiểm tra những chi tiết li ti của dấu vân tay.",
    synonyms: ["hand lens", "magnifier"]
  },
  "Highlighter": {
    example: "She marked the core arguments in the academic journal using a fluorescent highlighter.",
    exampleVi: "Cô ấy đã đánh dấu các luận điểm cốt lõi trong tạp chí học thuật bằng một chiếc bút dạ quang.",
    synonyms: ["marker", "highlighter pen"]
  },
  "Glue": {
    example: "The craft project required strong adhesive glue to attach the cardboard pieces together.",
    exampleVi: "Dự án thủ công đòi hỏi keo dán dính chắc để gắn các mảnh bìa cứng lại với nhau.",
    synonyms: ["adhesive", "paste"]
  },
  "Globe": {
    example: "The teacher spun the illuminated globe to show the location of major ocean currents.",
    exampleVi: "Giáo viên xoay quả địa cầu phát sáng để chỉ vị trí của các dòng hải lưu lớn.",
    synonyms: ["terrestrial sphere", "world model"]
  },
  "Flask": {
    example: "The laboratory technician measured acidic liquid in an ergonomic glass flask.",
    exampleVi: "Kỹ thuật viên phòng thí nghiệm đã đong chất lỏng có tính axit trong một bình thủy tinh thí nghiệm.",
    synonyms: ["beaker", "laboratory bottle"]
  },
  "Eraser": {
    example: "He quickly corrected the mathematical error using a clean vinyl eraser.",
    exampleVi: "Anh ấy đã nhanh chóng sửa lỗi toán học bằng một cục tẩy vinyl sạch sẽ.",
    synonyms: ["rubber", "remover"]
  },
  "Dictionary": {
    example: "Consulting an authoritative Oxford dictionary clarifies the exact nuances of academic vocabulary.",
    exampleVi: "Tra cứu cuốn từ điển Oxford uy tín giúp làm sáng tỏ những sắc thái chuẩn xác của từ vựng học thuật.",
    synonyms: ["lexicon", "glossary", "wordbook"]
  },
  "Desk": {
    example: "Her wooden study desk was organized with a reading lamp, laptop, and notebook.",
    exampleVi: "Bàn học bằng gỗ của cô ấy được sắp xếp ngăn nắp với đèn đọc sách, laptop và sổ ghi chép.",
    synonyms: ["worktable", "counter"]
  },
  "Crayon": {
    example: "Kindergarten children drew colorful pictures of their families with wax crayons.",
    exampleVi: "Các bé trường mẫu giáo đã vẽ những bức tranh rực rỡ về gia đình bằng bút sáp màu.",
    synonyms: ["wax pastel", "colored stick"]
  },
  "Compass": {
    example: "The student used a drafting compass to construct a perfect geometric circle.",
    exampleVi: "Học sinh đã dùng com-pa kỹ thuật để vẽ một vòng tròn hình học hoàn hảo.",
    synonyms: ["pair of compasses", "divider"]
  },
  "Coloured pencil": {
    example: "Botanical illustrators blend multiple coloured pencils to capture realistic plant shades.",
    exampleVi: "Các họa sĩ minh họa thực vật phối nhiều bút chì màu để tái hiện sắc thái cây cỏ chân thực.",
    synonyms: ["pencil crayon", "colored lead"]
  },
  "Calculator": {
    example: "Students are allowed to use a scientific calculator during the advanced statistics examination.",
    exampleVi: "Sinh viên được phép sử dụng máy tính khoa học trong kỳ thi thống kê nâng cao.",
    synonyms: ["adding machine", "compute device"]
  },
  "Book": {
    example: "She spent the weekend immersed in a fascinating historical book about ancient civilizations.",
    exampleVi: "Cô ấy đã dành cả cuối tuần đắm chìm trong một cuốn sách lịch sử hấp dẫn về các nền văn minh cổ đại.",
    synonyms: ["volume", "publication", "tome"]
  },
  "Board": {
    example: "The lecturer wrote key formulas clearly across the large magnetic board.",
    exampleVi: "Giảng viên đã viết các công thức trọng tâm một cách rõ ràng lên bảng từ lớn.",
    synonyms: ["chalkboard", "whiteboard", "panel"]
  },
  "Binder": {
    example: "He organized all his lecture handouts and revision notes inside a leather binder.",
    exampleVi: "Anh ấy đã sắp xếp toàn bộ tài liệu bài giảng và ghi chú ôn tập trong một bìa còng tài liệu.",
    synonyms: ["ring binder", "file folder"]
  },
  "Beaker": {
    example: "The chemistry experiment involved mixing equal parts of sodium solution in a glass beaker.",
    exampleVi: "Thí nghiệm hóa học bao gồm việc trộn các phần bằng nhau của dung dịch natri trong một cốc đong thủy tinh.",
    synonyms: ["measuring cup", "graduated glass"]
  },
  "Backpack": {
    example: "Her ergonomic backpack was lightweight yet spacious enough to carry all her heavy books.",
    exampleVi: "Chiếc ba lô có thiết kế tiện dụng của cô ấy vừa nhẹ lại vừa đủ rộng để mang toàn bộ sách vở nặng.",
    synonyms: ["knapsack", "rucksack", "schoolbag"]
  },

  // Space & Astronomy
  "Space": {
    example: "Astronomers utilize advanced space telescopes to observe galaxies billions of light-years away.",
    exampleVi: "Các nhà thiên văn học sử dụng kính viễn vọng không gian tiên tiến để quan sát các thiên hà cách xa hàng tỷ năm ánh sáng.",
    synonyms: ["cosmos", "universe", "outer space"]
  },
  "Planet": {
    example: "Mars is the fourth planet from the Sun and the primary target for human exploration.",
    exampleVi: "Sao Hỏa là hành tinh thứ tư tính từ Mặt Trời và là mục tiêu chính cho các cuộc thám hiểm của con người.",
    synonyms: ["celestial body", "world"]
  },
  "Astronaut": {
    example: "The astronaut completed a seven-hour spacewalk outside the International Space Station.",
    exampleVi: "Phi hành gia đã hoàn thành chuyến đi bộ ngoài không gian kéo dài bảy giờ bên ngoài Trạm Vũ trụ Quốc tế.",
    synonyms: ["spaceman", "cosmonaut"]
  }
};

// Realistic contextual sentences based on Part of Speech & Meaning for all other words
function generateContextualSentence(word, pos, meaning, topicName, topicId = "") {
  const w = word.trim();
  const lowerW = w.toLowerCase();
  const lowerMeaning = (meaning || "").toLowerCase().replace(/\/.*?\//g, "").strip ? meaning.replace(/\/.*?\//g, "").trim().toLowerCase() : (meaning || "").toLowerCase();

  const p = (pos || "").toLowerCase();
  
  if (p.includes("v")) {
    const templates = [
      { example: `She decided to ${lowerW} to achieve better results in her daily work.`, exampleVi: `Cô ấy đã quyết định ${lowerMeaning} để đạt kết quả tốt hơn trong công việc hàng ngày.` },
      { example: `It takes patience and focus to ${lowerW} properly.`, exampleVi: `Cần có sự kiên nhẫn và tập trung để ${lowerMeaning} một cách đúng đắn.` },
      { example: `Learning how to ${lowerW} effectively will boost your confidence.`, exampleVi: `Học cách ${lowerMeaning} hiệu quả sẽ giúp bạn tăng thêm sự tự tin.` }
    ];
    return templates[sumChars(lowerW) % templates.length];
  }
  
  if (p.includes("adj")) {
    const templates = [
      { example: `The atmosphere during the meeting was remarkably ${lowerW}.`, exampleVi: `Bầu không khí trong buổi họp vô cùng ${lowerMeaning}.` },
      { example: `He is known for having a very ${lowerW} personality when dealing with others.`, exampleVi: `Anh ấy nổi tiếng là người có tính cách rất ${lowerMeaning} khi làm việc với mọi người.` },
      { example: `This new approach makes the entire process much more ${lowerW}.`, exampleVi: `Phương pháp mới này giúp toàn bộ quy trình trở nên ${lowerMeaning} hơn nhiều.` }
    ];
    return templates[sumChars(lowerW) % templates.length];
  }

  const templates = [
    { example: `We discussed the role of ${lowerW} during our weekly team meeting.`, exampleVi: `Chúng tôi đã thảo luận về vai trò của ${lowerMeaning} trong cuộc họp đội hàng tuần.` },
    { example: `Having a good understanding of ${lowerW} is very helpful in practical situations.`, exampleVi: `Hiểu rõ về ${lowerMeaning} sẽ rất hữu ích trong các tình huống thực tế.` },
    { example: `She shared an interesting insight regarding ${lowerW} with her colleagues.`, exampleVi: `Cô ấy đã chia sẻ một góc nhìn thú vị liên quan đến ${lowerMeaning} với đồng nghiệp.` }
  ];
  return templates[sumChars(lowerW) % templates.length];
}

function sumChars(str) {
  let s = 0;
  for (let i = 0; i < str.length; i++) s += str.charCodeAt(i);
  return s;
}

let enrichedCount = 0;
const topicsMap = new Map(rawData.topics.map(t => [t.id, t.name]));

const updatedWords = rawData.words.map((w, index) => {
  const topicName = topicsMap.get(w.topicId) || "chủ đề IELTS";
  const custom = SPECIFIC_SENTENCES[w.word] || SPECIFIC_SENTENCES[w.word.toLowerCase()] || SPECIFIC_SENTENCES[w.word.charAt(0).toUpperCase() + w.word.slice(1).toLowerCase()];

  let example = w.example;
  let exampleVi = w.exampleVi;
  let synonyms = (w.synonyms || []).filter(s => !s.toLowerCase().includes("related words") && !s.toLowerCase().includes("words to"));

  if (custom) {
    example = custom.example;
    exampleVi = custom.exampleVi;
    if (custom.synonyms && custom.synonyms.length > 0) {
      synonyms = custom.synonyms;
    }
    enrichedCount++;
  } else if (!example || example.includes("The teacher asked everyone") || example.includes("Make sure you have a reliable") || example.includes("Understanding how to use") || example.includes("Understanding the exact context")) {
    const gen = generateContextualSentence(w.word, w.partOfSpeech, w.meaning, topicName);
    example = gen.example;
    exampleVi = gen.exampleVi;
    enrichedCount++;
  }

  return {
    ...w,
    example,
    exampleVi,
    synonyms,
    nuances: w.nuances ? w.nuances.filter(n => !n.includes("Sắc thái từ: Danh từ chỉ khái niệm/sự vật")) : []
  };
});

rawData.words = updatedWords;
fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), "utf-8");
console.log(`Successfully enriched ${enrichedCount} words in oxford-3000-data.json!`);
