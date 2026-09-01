import json
import re
import os

DB_PATH = "./data/vocab-store.json"
SEED_PATH = "./src/data/oxford-3000-data.json"

def clean_meaning(meaning, word):
    if not meaning:
        return word
    # Remove IPA in slashes or brackets
    m = re.sub(r'\/[^\/]+\/', '', meaning).strip()
    m = re.sub(r'\[[^\]]+\]', '', m).strip()
    
    # Fix common truncated meanings
    replacements = {
        "Cho xem, cho thấy,": "Cho xem, thể hiện",
        "Học tập, nghiên": "Học tập, nghiên cứu",
        "Chuyên gia về dinh": "Chuyên gia dinh dưỡng",
        "Bìa rời (báo, tạp": "Bìa tài liệu",
        "Đồ gọt bút chì": "Gọt bút chì",
        "Băng dính trong": "Băng dính trong",
        "Đặt chuông báo": "Đặt chuông báo thức",
        "Nghe nhạc": "Nghe nhạc",
    }
    for k, v in replacements.items():
        if k in m:
            m = v
            break
            
    m = re.sub(r'[,\s]+$', '', m).strip()
    return m if m else meaning

# High quality specific curated sentences for common problem words
HANDCRAFTED_SENTENCES = {
    "paper clip": ("Could you pass me a paper clip to hold these documents together?", "Bạn cho tôi mượn cái kẹp giấy để kẹp mấy tờ tài liệu này lại được không?"),
    "paper": ("She wrote down her phone number on a clean piece of paper.", "Cô ấy ghi số điện thoại của mình vào một mảnh giấy sạch."),
    "palette": ("The artist mixed shades of blue and green on her wooden palette.", "Họa sĩ pha các tông màu xanh dương và xanh lá trên bảng màu gỗ."),
    "paintbrush": ("Rinse your paintbrush thoroughly after you finish painting.", "Hãy rửa sạch cọ vẽ sau khi bạn vẽ xong nhé."),
    "watercolour": ("She painted a breathtaking sunset view using vibrant watercolour.", "Cô ấy đã vẽ cảnh hoàng hôn tuyệt đẹp bằng màu nước rực rỡ."),
    "thumbtack": ("He used a thumbtack to pin the notice onto the cork board.", "Anh ấy dùng đinh ghim để gắn thông báo lên bảng bần."),
    "textbook": ("Open your textbook to page forty-two and read the main passage.", "Hãy mở sách giáo khoa ra trang bốn mươi hai và đọc đoạn văn chính."),
    "test tube": ("The scientist carefully held the test tube over the small flame.", "Nhà khoa học cẩn thận giữ ống nghiệm phía trên ngọn lửa nhỏ."),
    "tape measure": ("The carpenter pulled out a tape measure to check the table length.", "Người thợ mộc kéo thước dây ra để kiểm tra chiều dài chiếc bàn."),
    "stapler": ("I need to load more staples into the stapler before binding the report.", "Tôi cần nắp thêm ghim vào máy dập ghim trước khi đóng quyển báo cáo."),
    "scissors": ("Be careful when using those sharp scissors to cut the ribbon.", "Hãy cẩn thận khi dùng chiếc kéo sắc đó để cắt dây ruy-băng."),
    "ruler": ("Draw a straight line across the page using a plastic ruler.", "Hãy dùng thước nhựa để vẽ một đường thẳng ngang trang giấy."),
    "calculator": ("You can use a calculator to double-check your math answers.", "Bạn có thể dùng máy tính bỏ túi để kiểm tra lại đáp án môn toán."),
    "backpack": ("He packed his laptop and notebook into his backpack before leaving.", "Anh ấy xếp máy tính và sổ tay vào ba lô trước khi lên đường."),
    "denmark": ("Denmark is famous for its beautiful colorful harbor houses and cycling culture.", "Đan Mạch nổi tiếng với những ngôi nhà ven cảng rực rỡ và văn hóa đi xe đạp."),
    "england": ("They visited London during their summer vacation in England.", "Họ đã tới thăm Luân Đôn trong kỳ nghỉ hè tại Anh."),
    "sweden": ("Sweden is well known for its clean environment and high quality of life.", "Thụy Điển rất nổi tiếng với môi trường sạch đẹp và chất lượng cuộc sống cao."),
    "herring": ("Fresh pickled herring is a traditional delicacy in Nordic cuisine.", "Cá trích ngâm chua tươi là món ăn ngon truyền thống trong ẩm thực Bắc Âu."),
    "salmon": ("Pan-seared salmon served with grilled vegetables makes a healthy dinner.", "Món cá hồi áp chảo dùng kèm rau củ nướng tạo nên một bữa tối lành mạnh."),
    "charcoal": ("They lit up the charcoal to grill fresh seafood at the beach BBQ.", "Họ đã đốt than củi để nướng hải sản tươi tại buổi tiệc nướng ngoài bờ biển."),
    "battery": ("My wireless mouse stopped working because the battery died.", "Con chuột không dây của tôi ngừng hoạt động vì hết pin."),
    "gasoline": ("The car's tank was almost empty, so we stopped to fill up gasoline.", "Bình xăng ô tô gần như đã cạn nên chúng tôi ghé vào đổ xăng."),
    "dancer": ("The talented dancer performed an incredible solo on stage.", "Vũ công tài năng đã biểu diễn một tiết mục đơn ca xuất sắc trên sân khấu."),
    "designer": ("The graphic designer created a stylish new logo for the company.", "Nhà thiết kế đồ họa đã tạo ra một logo mới rất phong cách cho công ty."),
    "magician": ("The magician amazed the children by pulling a white rabbit out of a hat.", "Nhà ảo thuật khiến các bé kinh ngạc khi rút một chú thỏ trắng từ chiếc mũ ra."),
    "earthquake": ("The rescue team moved quickly after the earthquake hit the coastal town.", "Đội cứu hộ đã di chuyển nhanh chóng sau khi trận động đất tràn qua thị trấn ven biển."),
    "aftershock": ("A minor aftershock was felt several hours after the main earthquake.", "Một trận dư chấn nhỏ đã được cảm nhận vài giờ sau trận động đất chính."),
    "flood": ("Heavy rains caused severe flooding in low-lying residential areas.", "Mưa lớn đã gây ra lũ lụt nghiêm trọng tại các khu dân cư vùng thấp."),
    "avenue": ("We enjoyed a pleasant evening walk along the leafy avenue.", "Chúng tôi có một buổi tối đi dạo dễ chịu dọc theo đại lộ ngợp bóng cây."),
    "diabetes": ("Maintaining a low-sugar diet helps manage symptoms of diabetes.", "Duy trì chế độ ăn ít đường giúp kiểm soát các triệu chứng của bệnh tiểu đường."),
    "dietitian": ("The dietitian designed a personalized meal plan to improve his health.", "Chuyên gia dinh dưỡng đã xây dựng một chế độ ăn riêng để cải thiện sức khỏe cho anh ấy."),
}

def generate_natural_sentence(word, meaning, pos, topic_id, topic_name):
    w_lower = word.lower().strip()
    m_clean = clean_meaning(meaning, word)
    
    # Check handcrafted dictionary first
    if w_lower in HANDCRAFTED_SENTENCES:
        return HANDCRAFTED_SENTENCES[w_lower]
        
    m_lower = m_clean.lower()
    
    # Clean part of speech
    p = (pos or "").lower()
    
    # Generate based on POS & Context
    
    # 1. VERBS / PHRASAL VERBS
    if "v" in p:
        if "listen to music" in w_lower:
            return ("I love to listen to music while relaxing at home on weekends.", "Tôi thích nghe nhạc khi thư giãn ở nhà vào cuối tuần.")
        if "set the alarm" in w_lower:
            return ("Don't forget to set the alarm for six o'clock tomorrow morning.", "Đừng quên đặt chuông báo thức lúc 6 giờ sáng mai nhé.")
            
        templates = [
            (f"She decided to {w_lower} to achieve better results in her daily work.", f"Cô ấy đã quyết định {m_lower} để đạt kết quả tốt hơn trong công việc hàng ngày."),
            (f"It takes patience and focus to {w_lower} properly.", f"Cần có sự kiên nhẫn và tập trung để {m_lower} một cách đúng đắn."),
            (f"They gathered together to {w_lower} before making the final choice.", f"Họ đã cùng nhau bàn bạc để {m_lower} trước khi đưa ra lựa chọn cuối cùng."),
            (f"Learning how to {w_lower} effectively will boost your confidence.", f"Học cách {m_lower} hiệu quả sẽ giúp bạn tăng thêm sự tự tin.")
        ]
        idx = sum(ord(c) for c in w_lower) % len(templates)
        return templates[idx]
        
    # 2. ADJECTIVES
    if "adj" in p:
        templates = [
            (f"The atmosphere during the meeting was remarkably {w_lower}.", f"Bầu không khí trong buổi họp vô cùng {m_lower}."),
            (f"He is known for having a very {w_lower} personality when dealing with others.", f"Anh ấy nổi tiếng là người có tính cách rất {m_lower} khi làm việc với mọi người."),
            (f"This new approach makes the entire process much more {w_lower}.", f"Phương pháp mới này giúp toàn bộ quy trình trở nên {m_lower} hơn nhiều."),
            (f"She gave a {w_lower} presentation that impressed everyone in the audience.", f"Cô ấy đã có một bài thuyết trình rất {m_lower} khiến tất cả khán giả ấn tượng.")
        ]
        idx = sum(ord(c) for c in w_lower) % len(templates)
        return templates[idx]
        
    # 3. ADVERBS
    if "adv" in p:
        templates = [
            (f"The team completed the task {w_lower} before the deadline arrived.", f"Cả đội đã hoàn thành công việc một cách {m_lower} trước khi đến hạn."),
            (f"She spoke {w_lower} so that everyone in the room could understand.", f"Cô ấy nói một cách {m_lower} để mọi người trong phòng đều có thể hiểu."),
            (f"The system operates {w_lower} even under high workload conditions.", f"Hệ thống vận hành một cách {m_lower} ngay cả trong điều kiện tải cao.")
        ]
        idx = sum(ord(c) for c in w_lower) % len(templates)
        return templates[idx]
        
    # 4. NOUNS & PHRASES (Default)
    if "supplies" in topic_id or "hoc_tap" in topic_id:
        templates = [
            (f"I left my {w_lower} on the desk after finishing the assignment.", f"Tôi đã để quên {m_lower} trên bàn làm việc sau khi làm xong bài tập."),
            (f"She always keeps a spare {w_lower} in her bag just in case.", f"Cô ấy luôn mang theo một {m_lower} dự phòng trong túi phòng khi cần."),
            (f"Could you lend me your {w_lower} for a few minutes?", f"Bạn cho tôi mượn {m_lower} của bạn vài phút được không?")
        ]
    elif "food" in topic_id or "kitchen" in topic_id or "o_an" in topic_id or "cu_qua" in topic_id or "hai_san" in topic_id:
        templates = [
            (f"Fresh {w_lower} is essential for preparing this delicious recipe.", f"{m_clean.capitalize()} tươi là nguyên liệu thiết yếu để nấu món ăn ngon này."),
            (f"We ordered grilled {w_lower} at the local restaurant last night.", f"Tối qua chúng tôi đã gọi món {m_lower} nướng tại nhà hàng địa phương."),
            (f"Adding some {w_lower} gives the dish a wonderful flavor.", f"Thêm một chút {m_lower} sẽ mang lại hương vị tuyệt vời cho món ăn.")
        ]
    elif "animal" in topic_id or "con_trung" in topic_id:
        templates = [
            (f"The children were delighted to see a {w_lower} in the national park.", f"Các bé rất thích thú khi nhìn thấy một con {m_lower} ở công viên quốc gia."),
            (f"A {w_lower} can adapt quickly to its natural habitat in the wild.", f"Con {m_lower} có thể thích nghi nhanh chóng với môi trường sống tự nhiên của nó."),
            (f"We observed the behavior of the {w_lower} during our field trip.", f"Chúng tôi đã quan sát hành vi của con {m_lower} trong chuyến đi thực địa.")
        ]
    elif "job" in topic_id or "occupations" in topic_id:
        templates = [
            (f"As an experienced {w_lower}, she handles daily challenges with great skill.", f"Là một {m_lower} có kinh nghiệm, cô ấy xử lý các thử thách hàng ngày rất khéo léo."),
            (f"My uncle worked as a {w_lower} for over twenty years.", f"Chú tôi đã làm {m_lower} trong hơn hai mươi năm."),
            (f"He aspires to become a successful {w_lower} in the near future.", f"Anh ấy khao khát trở thành một {m_lower} thành công trong tương lai gần.")
        ]
    elif "health" in topic_id or "medical" in topic_id or "hospital" in topic_id:
        templates = [
            (f"The doctor recommended proper care to treat the {w_lower} effectively.", f"Bác sĩ đã khuyên nên chăm sóc đúng cách để điều trị {m_lower} hiệu quả."),
            (f"Early detection of {w_lower} helps prevent serious medical complications.", f"Phát hiện sớm {m_lower} giúp ngăn ngừa các biến chứng y tế nghiêm trọng."),
            (f"Maintaining good habits reduces the risk of developing {w_lower}.", f"Duy trì thói quen tốt giúp giảm nguy cơ mắc {m_lower}.")
        ]
    elif "city" in topic_id or "transport" in topic_id or "traffic" in topic_id or "chi_uong" in topic_id:
        templates = [
            (f"We stopped near the {w_lower} to check the map for directions.", f"Chúng tôi dừng lại gần {m_lower} để xem bản đồ chỉ đường."),
            (f"The new {w_lower} helped improve traffic flow across the district.", f"{m_clean.capitalize()} mới đã giúp cải thiện lưu lượng giao thông trong quận."),
            (f"You can easily spot the {w_lower} right next to the main station.", f"Bạn có thể dễ dàng nhận ra {m_lower} ngay bên cạnh ga chính.")
        ]
    else:
        templates = [
            (f"We discussed the role of {w_lower} during our weekly team meeting.", f"Chúng tôi đã thảo luận về vai trò của {m_lower} trong cuộc họp đội hàng tuần."),
            (f"Having a good understanding of {w_lower} is very helpful in practical situations.", f"Hiểu rõ về {m_lower} sẽ rất hữu ích trong các tình huống thực tế."),
            (f"She shared an interesting insight regarding {w_lower} with her colleagues.", f"Cô ấy đã chia sẻ một góc nhìn thú vị liên quan đến {m_lower} với đồng nghiệp."),
            (f"The latest report highlights the growing importance of {w_lower}.", f"Báo cáo mới nhất nhấn mạnh tầm quan trọng ngày càng tăng của {m_lower}.")
        ]
        
    idx = sum(ord(c) for c in w_lower) % len(templates)
    return templates[idx]

def process_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    topics_map = {t['id']: t.get('name', '') for t in data.get('topics', [])}
    words = data.get('words', [])
    
    updated_count = 0
    for w in words:
        orig_meaning = w.get('meaning', '')
        cleaned_m = clean_meaning(orig_meaning, w.get('word', ''))
        w['meaning'] = cleaned_m
        
        topic_name = topics_map.get(w.get('topicId'), '')
        ex_en, ex_vi = generate_natural_sentence(
            w.get('word', ''),
            cleaned_m,
            w.get('partOfSpeech', ''),
            w.get('topicId', ''),
            topic_name
        )
        
        w['example'] = ex_en
        w['exampleVi'] = ex_vi
        updated_count += 1
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed {updated_count} words in {file_path}")

if __name__ == '__main__':
    process_file(DB_PATH)
    process_file(SEED_PATH)
