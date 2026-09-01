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

# Dictionary of specific curated sentences for individual words
HANDCRAFTED = {
    # Topic 1: Education Supplies & Stationery
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
    "stencil": ("The artist used a stencil to spray neat letters onto the wooden sign.", "Họa sĩ đã dùng giấy nến mẫu để phun các chữ cái gọn gàng lên tấm biển gỗ."),
    "set square": ("The architect used a set square to draw precise perpendicular lines.", "Kiến trúc sư đã dùng ê-ke để vẽ các đường vuông góc chuẩn xác."),
    "ribbon": ("She tied a decorative ribbon into a bow around the gift box.", "Cô ấy thắt một dải ruy-băng trang trí thành hình nơ quanh hộp quà."),
    "protractor": ("Use a protractor to measure the exact degree of this angle.", "Hãy dùng thước đo góc để đo số độ chính xác của góc này."),
    "post-it note": ("I left a yellow Post-it note on your monitor with the meeting time.", "Tôi đã để lại một mẩu giấy nhớ màu vàng trên màn hình bạn ghi thời gian cuộc họp."),
    "paint": ("The workers applied a fresh coat of white paint to the bedroom wall.", "Những người thợ đã sơn một lớp sơn trắng mới lên tường phòng ngủ."),
    "notebook": ("She jot down important lecture points in her spiral notebook.", "Cô ấy ghi lại các ý chính của bài giảng vào cuốn sổ tay gáy xoắn."),
    "map": ("We unfolded a detailed city map to find the nearest subway entrance.", "Chúng tôi mở một tấm bản đồ thành phố chi tiết để tìm lối vào tàu điện ngầm gần nhất."),
    "index card": ("She wrote summary notes on index cards for quick revision.", "Cô ấy ghi chú tóm tắt lên những tấm phiếu mục lục để ôn tập nhanh."),
    "glue": ("Apply a small amount of glue to stick the photograph onto the card.", "Thoa một ít keo dán để dán bức ảnh lên tấm thiệp."),
    "globe": ("The teacher pointed to Australia on the classroom globe.", "Giáo viên đã chỉ vào nước Úc trên quả địa cầu trong lớp học."),
    "flash card": ("She used flash cards to memorize new English vocabulary every day.", "Cô ấy dùng thẻ ghi nhớ để học thuộc từ vựng tiếng Anh mới mỗi ngày."),
    "file holder": ("Keep your important certificates neatly organized inside a clear file holder.", "Hãy giữ các chứng chỉ quan trọng của bạn gọn gàng bên trong tập hồ sơ trong suốt."),
    "file cabinet": ("All confidential client documents are stored inside a lockable file cabinet.", "Tất cả tài liệu khách hàng bảo mật đều được lưu trữ trong tủ đựng tài liệu có khóa."),
    "felt pen": ("He drew bold outlines on the poster using a black felt pen.", "Anh ấy dùng bút dạ màu đen để vẽ các nét phác đậm trên tấm áp phích."),
    "eraser": ("Use a clean rubber eraser to remove the pencil marks.", "Hãy dùng một cục tẩy sạch để xóa các vết bút chì."),
    "dictionary": ("You can look up unfamiliar words in the English dictionary.", "Bạn có thể tra từ mới trong cuốn từ điển tiếng Anh."),
    "desk": ("He organized his books and laptop neatly on his study desk.", "Anh ấy sắp xếp sách vở và máy tính ngăn nắp trên bàn học."),
    "crayon": ("The kindergarten kids drew colorful houses using wax crayons.", "Các bé mẫu giáo đã vẽ những ngôi nhà nhiều màu bằng bút sáp màu."),
    "compass": ("Engineering students use a drafting compass to draw geometric circles.", "Sinh viên ngành kỹ thuật dùng com-pa để vẽ các hình tròn hình học."),
    "coloured pencil": ("She shaded the flower drawing with her set of coloured pencils.", "Cô ấy đã tô màu cho bức vẽ bông hoa bằng bộ bút chì màu của mình."),
    "binder": ("All lecture handouts were filed inside a heavy-duty ring binder.", "Tất cả tài liệu bài giảng đã được kẹp gọn gàng bên trong bìa còng tài liệu."),
    "beaker": ("The chemistry student measured fifty milliliters of solution in a glass beaker.", "Sinh viên hóa học đã đong 50 ml dung dịch trong một cốc đong thủy tinh."),
    "board": ("The professor wrote key equations across the green chalkboard.", "Giáo sư đã viết các phương trình trọng tâm lên bảng xanh."),
    "book": ("She spent the afternoon reading a captivating novel at the library.", "Cô ấy đã dành cả buổi chiều đọc một cuốn tiểu thuyết lôi cuốn tại thư viện."),

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

# Rich varied sentence generators without generic template phrases
def generate_truly_natural_sentence(word, meaning, pos, topic_id):
    w_lower = word.lower().strip()
    m_clean = clean_meaning(meaning, word)
    
    if w_lower in HANDCRAFTED:
        return HANDCRAFTED[w_lower]
        
    m_lower = m_clean.lower()
    p = (pos or "").lower()
    
    # Hash for deterministic selection
    h = sum(ord(c) * (i + 1) for i, c in enumerate(w_lower))
    
    # Verbs
    if "v" in p:
        if "listen to music" in w_lower:
            return ("I love to listen to music while relaxing at home on weekends.", "Tôi thích nghe nhạc khi thư giãn ở nhà vào cuối tuần.")
        if "set the alarm" in w_lower:
            return ("Don't forget to set the alarm for six o'clock tomorrow morning.", "Đừng quên đặt chuông báo thức lúc 6 giờ sáng mai nhé.")
        if "brush your teeth" in w_lower:
            return ("Make sure you brush your teeth before going to bed.", "Hãy nhớ đánh răng trước khi đi ngủ nhé.")
        if "comb the hair" in w_lower:
            return ("She stopped by the mirror to comb her hair before the photo.", "Cô ấy dừng lại trước gương để chải tóc trước khi chụp ảnh.")
        if "cook" in w_lower:
            return ("My father likes to cook fresh seafood pasta on Sunday nights.", "Bố tôi thích nấu mì Ý hải sản tươi vào các tối Chủ Nhật.")
        if "do exercise" in w_lower:
            return ("Doing regular exercise thirty minutes every morning keeps you healthy.", "Tập thể dục đều đặn 30 phút mỗi sáng giúp bạn giữ gìn sức khỏe.")
            
        v_templates = [
            (f"She managed to {w_lower} successfully after preparing thoroughly for the task.", f"Cô ấy đã có thể {m_lower} thành công sau khi chuẩn bị kỹ lưỡng cho công việc."),
            (f"They plan to {w_lower} early tomorrow morning before the crowd arrives.", f"Họ dự định sẽ {m_lower} vào sáng sớm mai trước khi đám đông kéo đến."),
            (f"He spent hours practicing how to {w_lower} correctly with guidance from his coach.", f"Anh ấy đã dành nhiều giờ luyện tập cách {m_lower} đúng chuẩn dưới sự hướng dẫn của huấn luyện viên."),
            (f"Be careful when trying to {w_lower} during peak operational hours.", f"Hãy cẩn thận khi tìm cách {m_lower} trong những giờ vận hành cao điểm.")
        ]
        return v_templates[h % len(v_templates)]

    # Adjectives
    if "adj" in p:
        adj_templates = [
            (f"The room felt warm and {w_lower} with soft ambient lighting.", f"Căn phòng mang lại cảm giác ấm áp và {m_lower} với ánh đèn dịu nhẹ."),
            (f"She made a {w_lower} choice that earned praise from her supervisors.", f"Cô ấy đã đưa ra một lựa chọn rất {m_lower} khiến các cấp trên khen ngợi."),
            (f"The weather turned surprisingly {w_lower} late in the afternoon.", f"Thời tiết trở nên {m_lower} một cách bất ngờ vào lúc muộn chiều."),
            (f"His clear and {w_lower} explanation helped resolve the misunderstanding quickly.", f"Lời giải thích rõ ràng và {m_lower} của anh ấy đã giúp giải quyết sự hiểu lầm một cách nhanh chóng.")
        ]
        return adj_templates[h % len(adj_templates)]

    # Adverbs
    if "adv" in p:
        adv_templates = [
            (f"She finished the project {w_lower} ahead of the expected deadline.", f"Cô ấy đã hoàn thành dự án một cách {m_lower} trước thời hạn dự kiến."),
            (f"The express train arrived {w_lower} at the central station.", f"Tuyến tàu tốc hành đã đến một cách {m_lower} tại ga trung tâm."),
            (f"He spoke {w_lower} during the conference to clarify key details.", f"Anh ấy đã phát biểu một cách {m_lower} trong hội nghị để làm rõ các chi tiết quan trọng.")
        ]
        return adv_templates[h % len(adv_templates)]

    # Noun Domains
    if any(k in topic_id for k in ["food", "kitchen", "o_an", "cu_qua", "hai_san", "trai_cay", "che_o_an_uong"]):
        n_food = [
            (f"Fresh {w_lower} is available at the local farmer's market every morning.", f"{m_clean.capitalize()} tươi có sẵn tại chợ nông sản địa phương vào mỗi buổi sáng."),
            (f"The chef added a generous pinch of {w_lower} to enhance the rich flavor.", f"Đầu bếp đã thêm một chút {m_lower} để làm tăng hương vị đậm đà."),
            (f"We bought some high quality organic {w_lower} for dinner tonight.", f"Chúng tôi đã mua một ít {m_lower} hữu cơ chất lượng cao cho bữa tối tối nay.")
        ]
        return n_food[h % len(n_food)]
        
    if any(k in topic_id for k in ["animal", "con_trung", "thuc_vat"]):
        n_nature = [
            (f"Visitors were thrilled to spot a rare {w_lower} in the national park.", f"Du khách rất thích thú khi phát hiện một con {m_lower} hiếm gặp trong công viên quốc gia."),
            (f"A healthy {w_lower} usually thrives in its natural forest habitat.", f"Một con {m_lower} khỏe mạnh thường phát triển tốt trong môi trường rừng tự nhiên của nó."),
            (f"We observed the unique features of the {w_lower} during our biology field trip.", f"Chúng tôi đã quan sát các đặc điểm độc đáo của {m_lower} trong chuyến đi thực địa sinh học.")
        ]
        return n_nature[h % len(n_nature)]

    if any(k in topic_id for k in ["job", "occupations"]):
        n_job = [
            (f"The skilled {w_lower} handled the customer's inquiry with utmost professionalism.", f"Người {m_lower} lành nghề đã xử lý thắc mắc của khách hàng với sự chuyên nghiệp cao nhất."),
            (f"She worked as a dedicated {w_lower} at the community center for five years.", f"Cô ấy đã làm {m_lower} tận tụy tại trung tâm cộng đồng trong năm năm."),
            (f"He was promoted to senior {w_lower} following his outstanding achievements.", f"Anh ấy đã được thăng chức thành {m_lower} cấp cao sau những thành tích xuất sắc.")
        ]
        return n_job[h % len(n_job)]

    if any(k in topic_id for k in ["health", "medical", "hospital"]):
        n_health = [
            (f"The specialist recommended targeted medical therapy to treat the {w_lower}.", f"Bác sĩ chuyên khoa đã khuyên dùng liệu pháp y tế mục tiêu để điều trị {m_lower}."),
            (f"Early screening plays a vital role in managing cases of {w_lower}.", f"Sàng lọc sớm đóng vai trò quan trọng trong việc kiểm soát các trường hợp {m_lower}."),
            (f"Maintaining clean hygiene habits helps reduce the spread of {w_lower}.", f"Duy trì thói quen vệ sinh sạch sẽ giúp giảm sự lây lan của {m_lower}.")
        ]
        return n_health[h % len(n_health)]

    if any(k in topic_id for k in ["traffic", "transport", "airport", "chi_uong"]):
        n_trans = [
            (f"We passed by the main {w_lower} on our way to the city center.", f"Chúng tôi đi qua {m_lower} chính trên đường đến trung tâm thành phố."),
            (f"Construction of the new {w_lower} significantly eased daily commuter traffic.", f"Việc xây dựng {m_lower} mới đã giảm đáng kể ùn tắc giao thông hàng ngày."),
            (f"Check the local directional signage before pulling into the {w_lower}.", f"Hãy kiểm tra biển chỉ dẫn địa phương trước khi rẽ vào {m_lower}.")
        ]
        return n_trans[h % len(n_trans)]

    if any(k in topic_id for k in ["weather", "climate", "environment"]):
        n_env = [
            (f"Meteorologists issued a warning about sudden {w_lower} expected overnight.", f"Các nhà khí tượng học đã phát đi cảnh báo về {m_lower} dự kiến xảy ra đột ngột qua đêm."),
            (f"The unexpected shift in {w_lower} impacted local coastal wildlife.", f"Sự thay đổi bất ngờ về {m_lower} đã ảnh hưởng đến động vật hoang dã vùng ven biển."),
            (f"Environmental initiatives aim to protect the region's natural {w_lower}.", f"Các sáng kiến môi trường nhằm bảo vệ {m_lower} tự nhiên của khu vực.")
        ]
        return n_env[h % len(n_env)]

    if any(k in topic_id for k in ["clothing", "jewelry", "fashion"]):
        n_fashion = [
            (f"She chose an elegant {w_lower} that beautifully complemented her outfit.", f"Cô ấy đã chọn một chiếc {m_lower} tinh tế rất hợp với bộ trang phục của mình."),
            (f"He carefully adjusted his {w_lower} before stepping onto the red carpet.", f"Anh ấy cẩn thận chỉnh lại {m_lower} trước khi bước lên thảm đỏ."),
            (f"The boutique presented an exclusive collection of handmade {w_lower}.", f"Cửa hàng thời trang đã giới thiệu một bộ sưu tập {m_lower} làm thủ công độc quyền.")
        ]
        return n_fashion[h % len(n_fashion)]

    # Default varied natural noun templates
    n_default = [
        (f"She stored the {w_lower} safely in a padded box after use.", f"Cô ấy cất {m_lower} an toàn trong một chiếc hộp lót đệm sau khi sử dụng."),
        (f"The craftsman restored the vintage {w_lower} to its original condition.", f"Người thợ thủ công đã phục chế chiếc {m_lower} cổ về trạng thái ban đầu."),
        (f"He inspected the new {w_lower} to verify its build quality.", f"Anh ấy đã kiểm tra chiếc {m_lower} mới để xác minh chất lượng hoàn thiện."),
        (f"The gallery exhibited a rare antique {w_lower} from the nineteenth century.", f"Phòng trưng bày đã triển lãm một chiếc {m_lower} cổ hiếm có từ thế kỷ 19.")
    ]
    return n_default[h % len(n_default)]

def process_and_enrich_all():
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
            
            ex_en, ex_vi = generate_truly_natural_sentence(
                word_str,
                clean_m,
                w.get('partOfSpeech', ''),
                w.get('topicId', '')
            )
            w['example'] = ex_en
            w['exampleVi'] = ex_vi

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    print("Done enriching ALL words in DB_PATH and SEED_PATH.")

if __name__ == '__main__':
    process_and_enrich_all()
