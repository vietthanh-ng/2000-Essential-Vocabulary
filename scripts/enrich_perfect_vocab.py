import json
import re
import os

DB_PATH = "./data/vocab-store.json"
SEED_PATH = "./src/data/oxford-3000-data.json"

def clean_meaning(meaning, word):
    if not meaning:
        return word
    m = re.sub(r'\/[^\/]+\/', '', meaning).strip()
    m = re.sub(r'\[[^\]]+\]', '', m).strip()
    
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

# Dictionary of high precision custom sentences for specific words
HANDCRAFTED = {
    # Topic 1: Education Supplies
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
    "scotch tape": ("Use some scotch tape to seal the envelope securely.", "Hãy dùng một ít băng dính trong để dán chặt phong bì lại."),
    "pencil sharpener": ("He sharpened his dull pencil using a small plastic sharpener.", "Anh ấy gọt chiếc bút chì cùn bằng một chiếc gọt bút chì nhựa nhỏ."),

    # Topic 10: Jewelry & Fashion
    "earring": ("She wore a stunning silver earring that matched her evening dress.", "Cô ấy đeo một chiếc bông tai bằng bạc lấp lánh rất hợp với chiếc váy dạ hội."),
    "necklace": ("He gave her a delicate gold necklace as a birthday present.", "Anh ấy đã tặng cô một chiếc dây chuyền vàng tinh tế làm quà sinh nhật."),
    "bracelet": ("She adjusted the pearl bracelet on her left wrist.", "Cô ấy chỉnh lại chiếc vòng tay ngọc trai trên cổ tay trái."),
    "brooch": ("The vintage brooch pinned to her jacket added an elegant touch.", "Chiếc trâm cài cổ điển ghim trên áo khoác tạo thêm vẻ sang trọng."),
    "hair clip": ("She used a sparkly hair clip to keep her hair out of her face.", "Cô ấy dùng một chiếc kẹp tóc lấp lánh để giữ cho tóc không rủ xuống mặt."),
    "wedding ring": ("They exchanged wedding rings during the ceremony in front of their families.", "Họ đã trao nhau nhẫn cưới trong buổi lễ trước sự chứng kiến của gia đình."),
    "jeweler": ("The skilled jeweler carefully inspected the diamond under a magnifying lens.", "Người thợ kim hoàn lành nghề cẩn thận kiểm tra viên kim cương dưới kính lúp."),
    "jewelry store": ("We stopped by the downtown jewelry store to look for an anniversary gift.", "Chúng tôi đã ghé qua cửa hàng trang sức ở trung tâm thành phố để tìm quà kỷ niệm."),
    "anklet": ("She wore a dainty silver anklet while walking along the sandy beach.", "Cô ấy đeo một chiếc vòng chân bằng bạc xinh xắn khi đi dạo trên bãi biển."),
    "noble": ("She was praised for her noble character and selfless actions.", "Cô ấy được khen ngợi vì phẩm chất cao quý và những hành động vị tha."),
    "luxurious": ("They stayed in a luxurious hotel suite overlooking the ocean.", "Họ đã ở trong một phòng khách sạn sang trọng có tầm nhìn hướng ra đại dương."),
    "modern": ("The apartment features modern furniture and state-of-the-art appliances.", "Căn hộ có nội thất hiện đại và các thiết bị tân tiến."),
    "suitable": ("Please choose a dress that is suitable for a formal dinner party.", "Vui lòng chọn một chiếc váy phù hợp cho bữa tối trang trọng."),
    "twinkle": ("Stars began to twinkle brightly in the clear night sky.", "Những ngôi sao bắt đầu lấp lánh rực rỡ trên bầu trời đêm trong trẻo."),
    "bead": ("She strung colorful glass beads together to make a handcrafted necklace.", "Cô ấy xâu những hạt thủy tinh nhiều màu lại với nhau để làm một chiếc dây chuyền thủ công."),
    "hair tie": ("She pulled her long hair back into a ponytail with an elastic hair tie.", "Cô ấy buộc mái tóc dài thành hình đuôi ngựa bằng một chiếc dây buộc tóc co giãn."),
    "pocket watch": ("My grandfather carries an antique gold pocket watch in his vest.", "Ông tôi mang theo một chiếc đồng hồ bỏ túi bằng vàng cổ điển trong túi áo gi lê."),
    "tiepin": ("He fastened his silk tie with a polished silver tiepin.", "Anh ấy cố định chiếc cà vạt lụa bằng một chiếc ghim cà vạt bằng bạc sáng bóng."),
    "precious stone": ("The museum exhibited a rare collection of cut precious stones.", "Bảo tàng đã triển lãm một bộ sưu tập đá quý mài cắt quý hiếm."),

    # Topic 51: Countries
    "denmark": ("Denmark is famous for its beautiful colorful harbor houses and cycling culture.", "Đan Mạch nổi tiếng với những ngôi nhà ven cảng rực rỡ và văn hóa đi xe đạp."),
    "england": ("They visited London during their summer vacation in England.", "Họ đã tới thăm Luân Đôn trong kỳ nghỉ hè tại Anh."),
    "sweden": ("Sweden is well known for its clean environment and high quality of life.", "Thụy Điển rất nổi tiếng với môi trường sạch đẹp và chất lượng cuộc sống cao."),
    "austria": ("Vienna, the capital of Austria, is renowned for classical music and historic architecture.", "Viên, thủ đô của Áo, nổi tiếng với âm nhạc cổ điển và kiến trúc lịch sử."),
    "australia": ("Australia is home to unique wildlife like kangaroos and koalas.", "Úc là nơi sinh sống của các loài động vật hoang dã độc đáo như chuột túi và gấu koala."),
    "france": ("France attracts millions of tourists every year to see the Eiffel Tower in Paris.", "Pháp thu hút hàng triệu du khách mỗi năm đến xem Tháp Eiffel ở Paris."),

    # Topic 52: Seafood
    "herring": ("Fresh pickled herring is a traditional delicacy in Nordic cuisine.", "Cá trích ngâm chua tươi là món ăn ngon truyền thống trong ẩm thực Bắc Âu."),
    "skate": ("Skate wing cooked with brown butter and capers is a classic seafood dish.", "Vây cá đuối nấu với bơ nâu và quả bạch hoa là món hải sản cổ điển."),
    "salmon": ("Pan-seared salmon served with grilled vegetables makes a healthy dinner.", "Món cá hồi áp chảo dùng kèm rau củ nướng tạo nên một bữa tối lành mạnh."),
    "prawn": ("We ordered garlic butter prawns at the seaside restaurant.", "Chúng tôi đã gọi món tôm tít sốt bơ tỏi tại nhà hàng ven biển."),
    "lobster": ("Steamed lobster served with melted butter is popular for special celebrations.", "Tôm hùm hấp dùng kèm bơ tan chảy rất phổ biến trong các dịp lễ đặc biệt."),
    "squid": ("Crispy fried squid rings were served with fresh lemon slices.", "Mực rán giòn vòng được phục vụ cùng các lát chanh tươi."),

    # Topic 53: Energy
    "charcoal": ("They lit up the charcoal to grill fresh seafood at the beach BBQ.", "Họ đã đốt than củi để nướng hải sản tươi tại buổi tiệc nướng ngoài bờ biển."),
    "battery": ("My wireless mouse stopped working because the battery died.", "Con chuột không dây của tôi ngừng hoạt động vì hết pin."),
    "gasoline": ("The car's tank was almost empty, so we stopped to fill up gasoline.", "Bình xăng ô tô gần như đã cạn nên chúng tôi ghé vào đổ xăng."),

    # Topic 54: Occupations
    "dancer": ("The talented dancer performed an incredible solo on stage.", "Vũ công tài năng đã biểu diễn một tiết mục đơn ca xuất sắc trên sân khấu."),
    "designer": ("The graphic designer created a stylish new logo for the company.", "Nhà thiết kế đồ họa đã tạo ra một logo mới rất phong cách cho công ty."),
    "magician": ("The magician amazed the children by pulling a white rabbit out of a hat.", "Nhà ảo thuật khiến các bé kinh ngạc khi rút một chú thỏ trắng từ chiếc mũ ra."),
    "tour guide": ("The friendly tour guide showed us around the ancient temple.", "Hướng dẫn viên du lịch thân thiện đã đưa chúng tôi đi tham quan ngôi đền cổ."),
    "sailor": ("The experienced sailor navigated the ship safely through the storm.", "Người thủy thủ giàu kinh nghiệm đã điều khiển con tàu vượt qua cơn bão một cách an toàn."),
    "commentator": ("The sports commentator praised the goalkeeper's quick reflex.", "Bình luận viên thể thao đã khen ngợi phản xạ nhanh nhạy của thủ môn."),

    # Topic 55: Health & Diet
    "diabetes": ("Maintaining a low-sugar diet helps manage symptoms of diabetes.", "Duy trì chế độ ăn ít đường giúp kiểm soát các triệu chứng của bệnh tiểu đường."),
    "dietitian": ("The dietitian designed a personalized meal plan to improve his health.", "Chuyên gia dinh dưỡng đã xây dựng một chế độ ăn riêng để cải thiện sức khỏe cho anh ấy."),

    # Topic 56: Disasters
    "earthquake": ("The rescue team moved quickly after the earthquake hit the coastal town.", "Đội cứu hộ đã di chuyển nhanh chóng sau khi trận động đất tràn qua thị trấn ven biển."),
    "aftershock": ("A minor aftershock was felt several hours after the main earthquake.", "Một trận dư chấn nhỏ đã được cảm nhận vài giờ sau trận động đất chính."),
    "flood": ("Heavy rains caused severe flooding in low-lying residential areas.", "Mưa lớn đã gây ra lũ lụt nghiêm trọng tại các khu dân cư vùng thấp."),

    # Topic 57: Directions
    "avenue": ("We enjoyed a pleasant evening walk along the leafy avenue.", "Chúng tôi có một buổi tối đi dạo dễ chịu dọc theo đại lộ ngợp bóng cây."),
}

def generate_contextual_sentence(word, meaning, pos, topic_id):
    w_lower = word.lower().strip()
    m_clean = clean_meaning(meaning, word)
    
    if w_lower in HANDCRAFTED:
        return HANDCRAFTED[w_lower]
        
    m_lower = m_clean.lower()
    p = (pos or "").lower()
    
    # Hash for variation seed
    h = sum(ord(c) for c in w_lower)
    
    # Check POS
    if "v" in p:
        if "listen to music" in w_lower:
            return ("I love to listen to music while relaxing at home on weekends.", "Tôi thích nghe nhạc khi thư giãn ở nhà vào cuối tuần.")
        if "set the alarm" in w_lower:
            return ("Don't forget to set the alarm for six o'clock tomorrow morning.", "Đừng quên đặt chuông báo thức lúc 6 giờ sáng mai nhé.")
            
        v_templates = [
            (f"She managed to {w_lower} successfully after preparing thoroughly.", f"Cô ấy đã có thể {m_lower} thành công sau khi chuẩn bị kỹ lưỡng."),
            (f"They plan to {w_lower} early in the morning before traffic gets heavy.", f"Họ dự định sẽ {m_lower} từ sớm trước khi giao thông đông đúc."),
            (f"He learned how to {w_lower} step by step during his training course.", f"Anh ấy đã học cách {m_lower} từng bước một trong khóa huấn luyện."),
            (f"Be careful when you try to {w_lower} in this situation.", f"Hãy cẩn thận khi bạn tìm cách {m_lower} trong tình huống này.")
        ]
        return v_templates[h % len(v_templates)]

    if "adj" in p:
        adj_templates = [
            (f"The design looks remarkably {w_lower} and fits modern tastes.", f"Thiết kế nhìn vô cùng {m_lower} và hợp với thị hiếu hiện đại."),
            (f"She made a {w_lower} decision that benefited her whole team.", f"Cô ấy đã đưa ra một quyết định rất {m_lower} mang lại lợi ích cho cả đội."),
            (f"The weather today is unusually {w_lower} for this time of year.", f"Thời tiết hôm nay {m_lower} một cách bất thường so với thời điểm này trong năm."),
            (f"His explanation was very clear and {w_lower} for everyone.", f"Lời giải thích của anh ấy rất rõ ràng và {m_lower} đối với mọi người.")
        ]
        return adj_templates[h % len(adj_templates)]

    if "adv" in p:
        adv_templates = [
            (f"She solved the puzzle {w_lower} without needing any extra help.", f"Cô ấy đã giải bài toán một cách {m_lower} mà không cần sự trợ giúp thêm."),
            (f"The train arrived {w_lower} on schedule at the central station.", f"Tuyến tàu đã đến một cách {m_lower} đúng giờ tại ga trung tâm."),
            (f"He spoke {w_lower} during his public address to reassure the crowd.", f"Anh ấy nói một cách {m_lower} trong bài phát biểu để làm an lòng đám đông.")
        ]
        return adv_templates[h % len(adv_templates)]

    # Noun Topic-Based Context Builders
    if "food" in topic_id or "kitchen" in topic_id or "o_an" in topic_id or "cu_qua" in topic_id or "hai_san" in topic_id or "trai_cay" in topic_id:
        n_food = [
            (f"Fresh {w_lower} is available at the local market every morning.", f"{m_clean.capitalize()} tươi có bán ở chợ địa phương vào mỗi buổi sáng."),
            (f"We added a generous portion of {w_lower} to enhance the flavor of the dish.", f"Chúng tôi đã thêm một phần {m_lower} để làm tăng hương vị cho món ăn."),
            (f"She bought some organic {w_lower} for dinner tonight.", f"Cô ấy đã mua một ít {m_lower} hữu cơ cho bữa tối tối nay.")
        ]
        return n_food[h % len(n_food)]
        
    if "animal" in topic_id or "con_trung" in topic_id:
        n_anim = [
            (f"The children were excited to see a {w_lower} at the wildlife sanctuary.", f"Các bé rất hào hứng khi nhìn thấy một con {m_lower} tại khu bảo tồn thiên nhiên."),
            (f"A {w_lower} usually thrives in its natural forest habitat.", f"Con {m_lower} thường phát triển tốt trong môi trường rừng tự nhiên của nó."),
            (f"We spotted a rare {w_lower} resting under the shade of a tree.", f"Chúng tôi đã phát hiện một con {m_lower} hiếm gặp đang nghỉ ngơi dưới bóng cây.")
        ]
        return n_anim[h % len(n_anim)]

    if "job" in topic_id or "occupations" in topic_id:
        n_job = [
            (f"The experienced {w_lower} handled the client's request with great care.", f"Người {m_lower} giàu kinh nghiệm đã xử lý yêu cầu của khách hàng rất cẩn thận."),
            (f"She hired a professional {w_lower} to assist with the new project.", f"Cô ấy đã thuê một {m_lower} chuyên nghiệp để hỗ trợ dự án mới."),
            (f"He works diligently as a {w_lower} in a reputable firm.", f"Anh ấy làm việc chăm chỉ với tư cách là một {m_lower} tại một công ty uy tín.")
        ]
        return n_job[h % len(n_job)]

    if "health" in topic_id or "medical" in topic_id or "hospital" in topic_id:
        n_health = [
            (f"The doctor recommended proper rest and treatment for the {w_lower}.", f"Bác sĩ đã khuyên nên nghỉ ngơi và điều trị đúng cách cho {m_lower}."),
            (f"Regular check-ups can help detect symptoms of {w_lower} early.", f"Khám sức khỏe định kỳ có thể giúp phát hiện sớm các triệu chứng của {m_lower}."),
            (f"Proper hygiene is essential to prevent the spread of {w_lower}.", f"Vệ sinh đúng cách là điều cần thiết để ngăn ngừa sự lây lan của {m_lower}.")
        ]
        return n_health[h % len(n_health)]

    if "traffic" in topic_id or "transport" in topic_id or "airport" in topic_id or "chi_uong" in topic_id:
        n_travel = [
            (f"We stopped near the {w_lower} to look at the navigation map.", f"Chúng tôi dừng lại gần {m_lower} để xem bản đồ dẫn đường."),
            (f"The new {w_lower} reduced travel time significantly during rush hour.", f"{m_clean.capitalize()} mới đã giúp giảm đáng kể thời gian di chuyển trong giờ cao điểm."),
            (f"Make sure to check the safety guidelines before entering the {w_lower}.", f"Hãy chắc chắn kiểm tra các hướng dẫn an toàn trước khi vào {m_lower}.")
        ]
        return n_travel[h % len(n_travel)]

    if "weather" in topic_id or "climate" in topic_id or "environment" in topic_id:
        n_env = [
            (f"Local authorities issued a warning about severe {w_lower} this week.", f"Chính quyền địa phương đã phát đi cảnh báo về {m_lower} nghiêm trọng trong tuần này."),
            (f"The sudden change in {w_lower} affected agricultural yields across the region.", f"Sự thay đổi đột ngột về {m_lower} đã ảnh hưởng đến sản lượng nông nghiệp toàn vùng."),
            (f"Protecting the surrounding environment helps preserve natural {w_lower}.", f"Bảo vệ môi trường xung quanh giúp gìn giữ {m_lower} tự nhiên.")
        ]
        return n_env[h % len(n_env)]

    # Default Noun fallback (highly natural & specific)
    n_default = [
        (f"She placed the {w_lower} carefully on the side table.", f"Cô ấy cẩn thận đặt {m_lower} lên chiếc bàn bên cạnh."),
        (f"They decided to replace the old {w_lower} with a brand new model.", f"Họ quyết định thay thế {m_lower} cũ bằng một mẫu hoàn toàn mới."),
        (f"He carried the {w_lower} with him throughout the journey.", f"Anh ấy mang theo {m_lower} bên mình suốt cả hành trình."),
        (f"The display features an elegant {w_lower} made from high quality material.", f"Khu trưng bày nổi bật với một {m_lower} tinh tế làm từ chất liệu cao cấp.")
    ]
    return n_default[h % len(n_default)]

def process_and_enrich():
    for file_path in [DB_PATH, SEED_PATH]:
        if not os.path.exists(file_path):
            continue
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        words = data.get('words', [])
        for w in words:
            word_str = w.get('word', '')
            orig_m = w.get('meaning', '')
            clean_m = clean_meaning(orig_m, word_str)
            w['meaning'] = clean_m
            
            ex_en, ex_vi = generate_contextual_sentence(
                word_str,
                clean_m,
                w.get('partOfSpeech', ''),
                w.get('topicId', '')
            )
            w['example'] = ex_en
            w['exampleVi'] = ex_vi

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    print("Done enriching DB_PATH and SEED_PATH with natural sentences.")

if __name__ == '__main__':
    process_and_enrich()
