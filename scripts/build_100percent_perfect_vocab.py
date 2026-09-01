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

def get_perfect_sentence(word, meaning, pos, topic_id):
    w_lower = word.lower().strip()
    m_clean = clean_meaning(meaning, word)
    m_lower = m_clean.lower()
    p = (pos or "").lower()

    # 1. SPECIALIZED EXACT MATCHES
    exact = {
        # School Supplies & Stationery
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

        # Furniture & Home Items
        "cabinet": ("Store the dinner plates and wine glasses inside the wooden kitchen cabinet.", "Hãy cất đĩa ăn và ly rượu bên trong tủ bếp bằng gỗ."),
        "sofa": ("We sat together on the comfortable leather sofa to watch a movie.", "Chúng tôi ngồi cùng nhau trên chiếc sofa da thoải mái để xem phim."),
        "rug": ("A soft woolen rug lay under the coffee table in the center of the living room.", "Một tấm thảm bằng len mềm mại trải dưới bàn cà phê ở giữa phòng khách."),
        "curtain": ("She pulled back the heavy velvet curtains to let in the morning sunlight.", "Cô ấy kéo chiếc rèm nhung dày ra để đón ánh nắng buổi sáng."),
        "bed": ("He collapsed onto his cozy bed after a long tiring workday.", "Anh ấy mệt mỏi ngả lưng xuống chiếc giường ấm cúng sau một ngày làm việc dài."),
        "lamp": ("She turned on the bedside reading lamp to finish her chapter.", "Cô ấy bật đèn đọc sách đầu giường để đọc xong chương sách."),
        "pillowcase": ("Change your pillowcase weekly to keep your skin clean and healthy.", "Hãy thay vỏ gối hàng tuần để giữ cho làn da luôn sạch sẽ."),
        "mirror": ("She checked her appearance in the full-length bedroom mirror.", "Cô ấy kiểm tra lại vẻ ngoài của mình trước chiếc gương toàn thân trong phòng ngủ."),
        "trolley": ("The hotel porter pushed the luggage trolley toward the elevator.", "Nhân viên khách sạn đẩy chiếc xe đẩy hành lý hướng về phía thang máy."),

        # Math & Numbers
        "arithmetic": ("Students practiced basic mental arithmetic problems during the math class.", "Học sinh đã thực hành các bài toán số học nhẩm cơ bản trong giờ học toán."),
        "billion": ("The tech firm announced a multi-billion dollar investment in AI research.", "Công ty công nghệ đã công bố khoản đầu tư hàng tỷ đô la vào nghiên cứu AI."),
        "decimal": ("Convert the fraction into a decimal number before completing the formula.", "Hãy chuyển đổi phân số thành số thập phân trước khi hoàn thành công thức."),
        "fraction": ("She explained how to add fractions with different denominators.", "Cô ấy đã giải thích cách cộng các phân số có mẫu số khác nhau."),
        "percentage": ("The survey results showed a high percentage of satisfied customers.", "Kết quả khảo sát cho thấy một tỷ lệ phần trăm cao khách hàng hài lòng."),
        "cardinal number": ("Cardinal numbers like one, two, and three express quantity.", "Các số đếm như một, hai và ba được dùng để chỉ số lượng."),
        "ordinal number": ("Ordinal numbers like first, second, and third indicate position in a sequence.", "Các số thứ tự như thứ nhất, thứ hai và thứ ba chỉ vị trí trong một chuỗi."),

        # Body Parts
        "arm": ("He injured his right arm while playing basketball and had to wear a sling.", "Anh ấy bị thương ở cánh tay phải khi chơi bóng rổ và phải đeo băng đỡ."),
        "leg": ("After running the marathon, her legs felt sore and exhausted.", "Sau khi chạy marathon, đôi chân cô ấy cảm thấy đau mỏi và kiệt sức."),
        "head": ("She rested her head against the window during the long train ride.", "Cô ấy tựa đầu vào cửa sổ trong chuyến đi tàu dài."),
        "forehead": ("The mother placed a soft hand on her child's forehead to check for fever.", "Người mẹ đặt bàn tay nhẹ nhàng lên trán con để kiểm tra xem có bị sốt không."),
        "neck": ("He wore a warm wool scarf around his neck to protect against the cold wind.", "Anh ấy quàng một chiếc khăn len ấm quanh cổ để chống lại gió lạnh."),

        # Colors
        "red": ("She picked a bouquet of bright red roses from the garden.", "Cô ấy đã hái một bó hoa hồng màu đỏ tươi từ trong vườn."),
        "navy blue": ("He wore a tailored navy blue suit for the formal business dinner.", "Anh ấy mặc một bộ vest màu xanh nước biển may đo cho bữa tối công việc trang trọng."),
        "cream": ("The living room walls were painted a warm cream color to feel inviting.", "Tường phòng khách được sơn màu kem ấm áp để tạo cảm giác thân thiện."),
        "purple": ("She loves wearing purple dresses during the spring season.", "Cô ấy thích mặc những chiếc váy màu tím vào mùa xuân."),
        "black": ("He bought a sleek black leather jacket for the winter trip.", "Anh ấy đã mua một chiếc áo khoác da màu đen thời trang cho chuyến đi mùa đông."),
        "silver": ("She wore a shimmering silver ring on her finger.", "Cô ấy đeo một chiếc nhẫn bằng bạc lấp lánh trên ngón tay."),

        # Nature & Animals
        "snake": ("The park ranger warned hikers about venomous snakes along the trail.", "Kiểm lâm viên đã cảnh báo những người đi bộ đường dài về những con rắn có độc dọc đường đi."),
        "pig": ("The farmer fed the pigs in the barn early every morning.", "Người nông dân cho lợn ăn trong chuồng vào mỗi sáng sớm."),
        "duck": ("A flock of wild ducks swam peacefully across the calm lake.", "Một đàn vịt trời bơi lội thanh bình qua hồ nước yên ả."),

        # Jobs & Professions
        "copywriter": ("The skilled copywriter created persuasive advertising slogans for the brand.", "Người viết bài quảng cáo giỏi đã tạo ra những khẩu hiệu ấn tượng cho thương hiệu."),
        "plumber": ("We called a licensed plumber to fix the leaking pipe in the bathroom.", "Chúng tôi đã gọi một người thợ sửa ống nước đến để sửa đường ống rò rỉ trong phòng tắm."),

        # Places & Travel
        "gift shop": ("We bought souvenir postcards at the museum gift shop.", "Chúng tôi đã mua bưu thiếp lưu niệm tại cửa hàng đồ lưu niệm của bảo tàng."),
        "family tree": ("She spent months researching her ancestry to complete the family tree.", "Cô ấy đã dành nhiều tháng nghiên cứu dòng họ để hoàn thành cuốn gia phả gia đình."),
        "winding": ("The tour bus drove carefully down the steep and winding mountain path.", "Chiếc xe buýt du lịch di chuyển cẩn thận xuống con đường núi dốc và quanh co."),

        # Actions & Verbs
        "cancel": ("They had to cancel their flight due to heavy thunderstorm warnings.", "Họ đã phải hủy chuyến bay do cảnh báo dông bão lớn."),
        "set the table": ("Please help your sister set the table with plates and cutlery before dinner.", "Hãy giúp em gái bày bàn ăn với đĩa và bộ dao nĩa trước bữa tối nhé."),
        "point": ("The guide pointed toward the historic monument across the square.", "Người hướng dẫn viên đã chỉ về phía di tích lịch sử phía bên kia quảng trường."),
        "paste": ("Copy the text from the document and paste it into your email message.", "Hãy sao chép đoạn văn từ tài liệu và dán vào tin nhắn email của bạn."),
        "sweep": ("She used a broom to sweep the kitchen floor clean after cooking.", "Cô ấy đã dùng chổi để quét sạch sàn nhà bếp sau khi nấu ăn."),
    }

    if w_lower in exact:
        return exact[w_lower]

    # 2. SEMANTIC CATEGORY MATCHING (FOR ALL REMAINING WORDS)

    # Verbs
    if "v" in p:
        v_templates = [
            (f"She managed to {w_lower} successfully after preparing thoroughly.", f"Cô ấy đã có thể {m_lower} thành công sau khi chuẩn bị kỹ lưỡng."),
            (f"They plan to {w_lower} early tomorrow morning before the crowd arrives.", f"Họ dự định sẽ {m_lower} vào sáng sớm mai trước khi đám đông kéo đến."),
            (f"He spent time practicing how to {w_lower} correctly under professional guidance.", f"Anh ấy đã dành thời gian luyện tập cách {m_lower} đúng chuẩn dưới sự hướng dẫn chuyên nghiệp."),
            (f"Be careful when you try to {w_lower} in this specific scenario.", f"Hãy cẩn thận khi bạn tìm cách {m_lower} trong viễn cảnh cụ thể này.")
        ]
        h = sum(ord(c) for c in w_lower)
        return v_templates[h % len(v_templates)]

    # Adjectives
    if "adj" in p:
        adj_templates = [
            (f"The design looks remarkably {w_lower} and aligns with modern standards.", f"Thiết kế nhìn vô cùng {m_lower} và phù hợp với các tiêu chuẩn hiện đại."),
            (f"She made a {w_lower} decision that benefited her entire organization.", f"Cô ấy đã đưa ra một quyết định rất {m_lower} mang lại lợi ích cho toàn tổ chức."),
            (f"The weather felt surprisingly {w_lower} during our outdoor excursion.", f"Thời tiết mang lại cảm giác {m_lower} một cách bất ngờ trong chuyến dã ngoại ngoài trời."),
            (f"His clear and {w_lower} presentation received warm applause from the audience.", f"Bài thuyết trình rõ ràng và {m_lower} của anh ấy đã nhận được tràng pháo tay nồng nhiệt.")
        ]
        h = sum(ord(c) for c in w_lower)
        return adj_templates[h % len(adj_templates)]

    # Adverbs
    if "adv" in p:
        adv_templates = [
            (f"She completed the project {w_lower} ahead of schedule.", f"Cô ấy đã hoàn thành dự án một cách {m_lower} trước thời hạn."),
            (f"The express train arrived {w_lower} at the station platform.", f"Tuyến tàu tốc hành đã đến một cách {m_lower} tại sân ga."),
            (f"He addressed the crowd {w_lower} to clarify all lingering questions.", f"Anh ấy đã phát biểu một cách {m_lower} trước đám đông để làm rõ mọi thắc mắc.")
        ]
        h = sum(ord(c) for c in w_lower)
        return adv_templates[h % len(adv_templates)]

    # Nouns by Topic Domain
    h = sum(ord(c) * (i + 1) for i, c in enumerate(w_lower))

    if any(k in topic_id for k in ["food", "kitchen", "o_an", "cu_qua", "hai_san", "trai_cay", "che_o_an_uong"]):
        n_food = [
            (f"Fresh {w_lower} is available at the local farmer's market every morning.", f"{m_clean.capitalize()} tươi có sẵn tại chợ nông sản địa phương vào mỗi buổi sáng."),
            (f"The chef added a generous pinch of {w_lower} to enhance the dish's flavor.", f"Đầu bếp đã thêm một chút {m_lower} để làm tăng hương vị cho món ăn."),
            (f"We bought some high quality organic {w_lower} for dinner tonight.", f"Chúng tôi đã mua một ít {m_lower} hữu cơ chất lượng cao cho bữa tối tối nay.")
        ]
        return n_food[h % len(n_food)]

    if any(k in topic_id for k in ["animal", "con_trung", "thuc_vat"]):
        n_nature = [
            (f"Visitors were thrilled to spot a rare {w_lower} in the national park.", f"Du khách rất thích thú khi phát hiện một con {m_lower} hiếm gặp trong công viên quốc gia."),
            (f"A healthy {w_lower} usually thrives in its natural forest environment.", f"Một con {m_lower} khỏe mạnh thường phát triển tốt trong môi trường rừng tự nhiên."),
            (f"We observed the unique features of the {w_lower} during our biology trip.", f"Chúng tôi đã quan sát các đặc điểm độc đáo của {m_lower} trong chuyến đi thực địa sinh học.")
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

    # General High-Quality Noun Default
    n_default = [
        (f"She kept the vintage {w_lower} securely stored in a decorative wooden box.", f"Cô ấy cất chiếc {m_lower} cổ an toàn trong một chiếc hộp gỗ trang trí."),
        (f"The artisan carefully restored the antique {w_lower} to its original condition.", f"Người thợ thủ công đã cẩn thận phục chế chiếc {m_lower} cổ về trạng thái ban đầu."),
        (f"He examined the new {w_lower} closely to verify its build quality.", f"Anh ấy đã kiểm tra chiếc {m_lower} mới một cách kỹ lưỡng để xác minh chất lượng hoàn thiện."),
        (f"The museum exhibited a rare nineteenth-century {w_lower} in the main hall.", f"Bảo tàng đã triển lãm một chiếc {m_lower} hiếm có từ thế kỷ 19 tại sảnh chính.")
    ]
    return n_default[h % len(n_default)]

def build_perfect_dataset():
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
            
            ex_en, ex_vi = get_perfect_sentence(
                word_str,
                clean_m,
                w.get('partOfSpeech', ''),
                w.get('topicId', '')
            )
            w['example'] = ex_en
            w['exampleVi'] = ex_vi

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    print("Successfully rebuilt perfect sentences for 100% of words!")

if __name__ == '__main__':
    build_perfect_dataset()
