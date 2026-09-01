const LANGUAGE_STORAGE_KEY = "pokemon-information-language";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hash) return;
    if (link.origin !== window.location.origin) return;
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
});

window.addEventListener("pageshow", event => {
    if (event.persisted) window.scrollTo(0, 0);
});

const LANGUAGE_TEXT = {
    "Pokédex": "Pokédex",
    "PokemonDatabase": "Pokémon Database",
    "Types": "Types",
    "Meta": "Meta",
    "Chatbot": "Chatbot",
    "Team Builder": "Team Builder",
    "Damage Calc": "Calculate",
    "Damage Calculator": "Calculate",
    "Calculate": "Calculate",
    "📚 Pokédex": "📚 Pokédex",
    "About": "About",
    "Tìm": "Search",
    "Donate": "Donate",
    "⚡ Bắt đầu tính dame": "⚡ Start damage calculation",
    "Vui lòng chọn đủ Pokémon để tính dame.": "Please select both Pokémon to calculate damage.",
    "Support the Project": "Support the Project",
    "Ủng hộ dự án": "Support the project",
    "THE ULTIMATE POKÉMON DATABASE": "THE ULTIMATE POKÉMON DATABASE",
    "Khám phá thông tin, chỉ số, hệ và tiến hóa của hàng trăm Pokémon.": "Explore stats, types, evolutions and details for hundreds of Pokémon.",
    "BẢNG TƯƠNG KHẮC HỆ": "TYPE EFFECTIVENESS CHART",
    "BẢNG": "TYPE",
    "TƯƠNG KHẮC": "EFFECTIVENESS",
    "HỎI CHATBOT POKÉMON": "ASK THE POKÉMON CHATBOT",
    "XÂY DỰNG ĐỘI HÌNH": "BUILD YOUR TEAM",
    "TÍNH SÁT THƯƠNG": "DAMAGE CALCULATOR",
    "Chọn hệ": "Choose a type",
    "18 hệ Pokémon": "18 Pokémon types",
    "CHỌN HỆ": "CHOOSE TYPE",
    "TẤN CÔNG": "OFFENSE",
    "PHÒNG THỦ": "DEFENSE",
    "ƯU & NHƯỢC ĐIỂM": "STRENGTHS & WEAKNESSES",
    "ĐỘI HÌNH CỦA BẠN": "YOUR TEAM",
    "Xoá đội": "Clear team",
    "Thường": "Normal",
    "Lửa": "Fire",
    "Nước": "Water",
    "Điện": "Electric",
    "Cỏ": "Grass",
    "Băng": "Ice",
    "Đấu": "Fighting",
    "Độc": "Poison",
    "Đất": "Ground",
    "Bay": "Flying",
    "Siêu Năng": "Psychic",
    "Bọ": "Bug",
    "Đá": "Rock",
    "Bóng Ma": "Ghost",
    "Rồng": "Dragon",
    "Bóng Tối": "Dark",
    "Thép": "Steel",
    "Tiên": "Fairy",
    "Không có": "None",
    "Không có item": "No item",
    "Không bị status": "No status",
    "Tất cả": "All",
    "Xoá": "Remove",
    "Tìm": "Search",
    "Tìm Pokémon...": "Search Pokémon...",
    "Trên": "Above",
    "Khám phá thế giới": "Explore the world of",
    "Pokémon": "Pokémon",
    "Thông tin , Dữ liệu , Cập nhật meta chuẩn xác": "Info, data, and accurate meta updates",
    "Khám phá Pokédex": "Explore Pokédex",
    "Pokémon minh họa 1": "Illustrated Pokémon 1",
    "Hiển thị ảnh 1": "Show image 1",
    "Tìm Pokémon...": "Search Pokémon...",
    "Tìm tên chiêu thức...": "Search moves...",
    "Gõ 2-3 chữ (vd: bas, char, gar...) để xem gợi ý": "Type 2-3 letters (e.g. bas, char, gar...) to see suggestions",
    "Tra cứu": "Search",
    "Top Pokémon được dùng nhiều nhất": "Most used Pokémon",
    "Pokémon được dùng nhiều nhất": "Most used Pokémon",
    "Top Pokémon được dùng nhiều nhất, cùng chiêu thức, vật phẩm, đồng đội và bản chất phổ biến nhất — cập nhật trực tiếp từ dữ liệu trận đấu thật.": "The most used Pokémon, with the most common moves, items, teammates, and abilities — updated directly from real battle data.",
    "👆 Chọn một Pokémon ở trên, hoặc tra cứu tên bất kỳ ở ô tìm kiếm, để xem chiêu thức / vật phẩm / đồng đội được dùng nhiều nhất — dữ liệu lấy trực tiếp, thời gian thực.": "👆 Choose a Pokémon above, or search any name in the search box, to view the most used moves / items / teammates — live data pulled directly in real time.",
    "📡 Chiêu thức, vật phẩm, đồng đội, kỹ năng và bản chất/EV bên dưới được lấy từ": "📡 The moves, items, teammates, abilities, and common nature/EV data below are pulled from",
    "Nguồn tổng hợp dữ liệu Ranked Battle của Pokémon Champions, gồm usage, chiêu thức, vật phẩm, kỹ năng và đồng đội cho từng Pokémon. Đây là API cộng đồng, không phải API chính thức của Nintendo / The Pokémon Company.": "Source compiled from Ranked Battle data for Pokémon Champions, including usage, moves, items, abilities, and teammates for each Pokémon. This is a community API, not an official Nintendo / The Pokémon Company API.",
    "Chọn một hệ ở trên để xem.": "Select a type above to view.",
    "Biểu đồ này cho biết sức mạnh của hệ": "This chart shows the power of the",
    "Số thể hiện lượng sát thương gây ra - ví dụ ½ nghĩa là 50% sát thương (không hiệu quả), 2 nghĩa là 200% (hiệu quả cao).": "The numbers represent the damage dealt — for example, ½ means 50% damage (not very effective), while 2 means 200% damage (super effective).",
    "Đang phân tích coverage, moveset và synergy...": "Analyzing coverage, movesets, and synergy...",
    "Chưa có lợi thế phòng thủ rõ ràng.": "No clear defensive advantage yet.",
    "Đội hình chưa có điểm yếu rõ ràng.": "The team does not have a clear weakness yet.",
    "Thiếu đòn siêu hiệu quả lên": "Missing super-effective moves against",
    "Đủ ít nhất một đòn siêu hiệu quả lên cả 18 hệ.": "Has at least one super-effective move against all 18 types.",
    "Thiên Physical:": "Physical-heavy:",
    "Thiên Special:": "Special-heavy:",
    "Chưa phát hiện archetype nổi bật.": "No standout archetype detected yet.",
    "Có thể xây Trick Room": "Possible Trick Room build",
    "Có thể xây Sun": "Possible Sun team",
    "Có thể xây Rain": "Possible Rain team",
    "Có thể xây Snow": "Possible Snow team",
    "Có core Fire / Water / Grass": "Fire / Water / Grass core detected",
    "Có core Dragon / Fairy / Steel": "Dragon / Fairy / Steel core detected",
    "Nếu dùng Sun, damage Water của đồng đội giảm 50%": "If Sun is used, the team's Water-type damage is reduced by 50%",
    "Nếu dùng Earthquake, có thể đánh trúng đồng đội không miễn Ground": "If Earthquake is used, it may hit teammates that are not immune to Ground",
    "Chưa phát hiện xung đột rõ ràng.": "No clear conflict detected yet.",
    "Thêm ít nhất 1 Pokémon để bắt đầu phân tích đội hình.": "Add at least 1 Pokémon to start analyzing the team.",
    "Đội hình chưa có lợi thế phòng thủ rõ ràng.": "No clear defensive advantage yet.",
    "Đội hình chưa có điểm yếu rõ ràng.": "The team does not have a clear weakness yet.",
    "Đội hình chưa có điểm yếu diện rộng rõ ràng.": "The team does not have a clear broad weakness yet.",
    "Team dễ bị áp lực bởi hệ": "The team is pressured by",
    "và": "and",
    "kháng": "resists",
    "yếu": "weak",
    "thiếu": "missing",
    "nổi bật": "notable",
    "kiểu": "type",
    "Hệ nào khắc chế hệ nào": "Type matchup question",
    "Xem chi tiết bảng hệ →": "View detailed type chart →",
    "đối chiếu": "compare",
    "No clear defensive advantage yet.": "No clear defensive advantage yet.",
    "No clear conflict detected yet.": "No clear conflict detected yet.",
    "Đội hình chưa có lợi thế phòng thủ rõ ràng.": "No clear defensive advantage yet.",
    "Đội hình chưa có điểm yếu rõ ràng.": "The team does not have a clear weakness yet.",
    "Đội hình chưa có điểm yếu diện rộng rõ ràng.": "The team does not have a clear broad weakness yet.",
    "Team dễ bị áp lực bởi hệ": "The team is pressured by",
    "⚠ Cảnh báo: ": "⚠ Warning: ",
    "Có thể counter hệ": "Can counter the",
    "có thể counter hệ": "can counter the",
    "Đủ ít nhất một đòn siêu hiệu quả lên cả 18 hệ.": "Has at least one super-effective move against all 18 types.",
    "Không có lợi thế phòng thủ rõ ràng.": "No clear defensive advantage yet.",
    "Chưa phát hiện xung đột rõ ràng.": "No clear conflict detected yet.",
    "Đội hình chưa có điểm yếu diện rộng rõ ràng.": "The team does not have a clear broad weakness yet.",
    "Tóm tắt đội hình": "Team summary",
    "TEAM CHECK": "TEAM CHECK",
    "✓ Kháng / yếu hệ": "✓ Type coverage",
    "! Điểm yếu": "! Weaknesses",
    "⚔ Độ phủ tấn công": "⚔ Offensive coverage",
    "▣ Phân bổ damage": "▣ Damage distribution",
    "◇ Synergy / Archetype": "◇ Synergy / Archetype",
    "⚠ Anti-synergy": "⚠ Anti-synergy",
    "TEAM CHECK": "TEAM CHECK",
    "Có thể xây Sun": "Possible Sun team",
    "Có thể xây Rain": "Possible Rain team",
    "Có thể xây Snow": "Possible Snow team",
    "Có core Fire / Water / Grass": "Fire / Water / Grass core detected",
    "Có core Dragon / Fairy / Steel": "Dragon / Fairy / Steel core detected",
    "Nếu dùng Sun, damage Water của đồng đội giảm 50%": "If Sun is used, the team's Water-type damage is reduced by 50%",
    "Nếu dùng Earthquake, có thể đánh trúng đồng đội không miễn Ground": "If Earthquake is used, it may hit teammates that are not immune to Ground",
    "Chưa phát hiện xung đột rõ ràng.": "No clear conflict detected yet.",
    "Chưa có Pokémon nào trong đội": "No Pokémon in the team yet",
    "Thêm tối đa 6 Pokémon vào đội, hệ thống sẽ tự phân tích điểm yếu, khả năng phòng thủ và gợi ý hệ còn thiếu.": "Add up to 6 Pokémon to your team; the system will automatically analyze weaknesses, defensive potential, and suggest any missing type coverage.",
    "Gõ tên Pokémon để thêm vào đội (vd: gar, char...)": "Type a Pokémon name to add to the team (e.g. gar, char...)",
    "👆 Thêm ít nhất 1 Pokémon để bắt đầu phân tích đội hình.": "👆 Add at least 1 Pokémon to start analyzing the team.",
    "ĐỘI HÌNH CỦA BẠN": "YOUR TEAM",
    "ĐIỀU KIỆN TRẬN ĐẤU": "BATTLE CONDITIONS",
    "BÊN TẤN CÔNG": "ATTACKER",
    "BÊN PHÒNG THỦ": "DEFENDER",
    "Bản chất (Nature)": "Nature",
    "Chiêu thức": "Move",
    "Buff/Debuff sức tấn công": "Attack stage",
    "Buff/Debuff phòng thủ": "Defense stage",
    "Item bên tấn công": "Attacker item",
    "Item bên phòng thủ": "Defender item",
    "Item bên Attacker": "Attacker item",
    "Item bên Defender": "Defender item",
    "Thời tiết": "Weather",
    "Không có": "None",
    "Không có item": "No item",
    "Terrain": "Terrain",
    "Critical hit": "Critical hit",
    "Đòn đánh thường": "Normal hit",
    "Luôn chí mạng": "Always critical",
    "Được Helping Hand": "Helping Hand active",
    "Đòn đánh chí mạng": "Critical hit",
    "Attacker còn ≤ 1/3 HP": "Attacker HP ≤ 1/3",
    "Defender còn đầy HP": "Defender at full HP",
    "Disguise của Defender chưa vỡ": "Defender's Disguise intact",
    "Ice Face của Defender chưa vỡ": "Defender's Ice Face intact",
    "Status của Attacker": "Attacker status",
    "Status của Defender": "Defender status",
    "Không bị status": "No status",
    "Flash Fire đã kích hoạt": "Flash Fire activated",
    "Defender vừa switch in": "Defender just switched in",
    "Attacker đi sau": "Attacker moves second",
    "Giới tính": "Gender",
    "Không xác định": "Unknown",
    "Cùng giới": "Same gender",
    "Khác giới": "Different gender",
    "Số đồng đội Attacker đã bị hạ": "Fainted Attacker teammates",
    "Ủng hộ người nghèo": "Support people in need",
    "Mong mọi người ủng hộ mình cốc nước mía": "Please support me with a sugarcane drink",
    "Mình cảm ơn mọi người đã ủng hộ và sử dụng web": "Thank you for your support and using the website",
    "Quét mã để ủng hộ": "Scan to support",
    "Tên TK:": "Account name:",
    "Tìm Pokémon...": "Search Pokémon...",
    "Chọn Pokémon tấn công...": "Choose attacking Pokémon...",
    "Chọn Pokémon phòng thủ...": "Choose defending Pokémon...",
    "Tìm tên chiêu thức...": "Search moves...",
    "Gõ tên Pokémon để thêm vào đội (vd: gar, char...)": "Search a Pokémon to add (e.g. gar, char...)",
    "Tóm tắt đội hình": "Team summary",
    "Ưu điểm": "Strengths",
    "Nhược điểm": "Weaknesses",
    "Độ phủ tấn công": "Offensive coverage",
    "Phân bổ damage": "Damage distribution",
    "Synergy / Archetype": "Synergy / Archetype",
    "Anti-synergy": "Anti-synergy",
    "TEAM CHECK": "TEAM CHECK",
    "✓ Kháng / yếu hệ": "✓ Type coverage",
    "! Điểm yếu": "! Weaknesses",
    "⚔ Độ phủ tấn công": "⚔ Offensive coverage",
    "▣ Phân bổ damage": "▣ Damage distribution",
    "Có thể xây Trick Room": "Possible Trick Room core",
    "Có thể xây Sun": "Possible Sun team",
    "Có thể xây Rain": "Possible Rain team",
    "Có thể xây Snow": "Possible Snow team",
    "Có core Fire / Water / Grass": "Fire / Water / Grass core detected",
    "Có core Dragon / Fairy / Steel": "Dragon / Fairy / Steel core detected",
    "⚠ Anti-synergy": "⚠ Anti-synergy",
    "HỒ SƠ HUẤN LUYỆN VIÊN": "TRAINER PROFILE",
    "TẠO ": "CREATE ",
    "TRAINER PROFILE": "TRAINER PROFILE",
    "TẠO TRAINER CARD": "CREATE TRAINER CARD",
    "TRAINER CARD": "TRAINER CARD",
    "Thẻ hồ sơ kiểu game — avatar khung trang trí, danh hiệu riêng, và 1 Pokémon đồng hành làm ảnh nền lớn. Tải về đăng thẳng lên Story Facebook / Instagram (1080×1920).": "Game-style profile card — custom avatar frame, title, and one partner Pokémon as the large background. Download and share directly to Facebook / Instagram Story (1080×1920).",
    "Định dạng ảnh": "Image format",
    "Story dọc (9:16)": "Vertical Story (9:16)",
    "Trainer Card ngang (16:9)": "Landscape Trainer Card (16:9)",
    "Bản ngang: Pokémon chính chiếm 70% bên phải, thông tin Trainer + 5 Pokémon phụ nằm bên trái — kiểu profile Liên Quân.": "Landscape layout: the hero Pokémon occupies the right 70%, while trainer info and 5 teammates sit on the left — a League-style profile.",
    "Ảnh đại diện": "Avatar",
    "Ảnh thật": "Photo",
    "Sprite Pokémon": "Pokémon Sprite",
    "Ngại dùng ảnh thật? Chọn \"Sprite Pokémon\" để dùng icon 1 Pokémon bất kỳ làm avatar thay mặt bạn.": "Prefer not to use a real photo? Choose Pokémon Sprite to use any Pokémon icon as your avatar.",
    "Chọn ảnh chân dung": "Choose portrait photo",
    "Kéo ảnh để canh vị trí, kéo thanh trượt để phóng to/thu nhỏ.": "Drag the image to position it and use the slider to zoom in or out.",
    "Xoá ảnh": "Remove photo",
    "Gõ tên Pokémon làm avatar...": "Enter a Pokémon name for the avatar...",
    "Pokémon đồng hành (ảnh nền)": "Hero Pokémon (background)",
    "Gõ tên Pokémon (vd: garchomp)...": "Enter a Pokémon name (e.g. garchomp)...",
    "Ngẫu nhiên 1 Pokémon": "Random Pokémon",
    "Bật/tắt Shiny": "Toggle Shiny",
    "Đội hình phụ (tối đa 5)": "Team members (max 5)",
    "Hiện thành 2 hàng icon dọc, 3 Pokémon mỗi hàng, với Pokémon chính nổi bật ở vị trí lớn nhất.": "Display as two rows of 3 Pokémon each, with the main Pokémon highlighted in the largest slot.",
    "Khung Avatar": "Avatar frame",
    "Kim loại Vàng": "Gold Metal",
    "Kim loại Bạc": "Silver Metal",
    "Lửa/Băng": "Fire/Ice",
    "Carbon Đen": "Black Carbon",
    "Điện Vàng": "Electric Yellow",
    "Thiên Nhiên": "Nature",
    "Đại Dương": "Ocean",
    "Siêu Năng": "Psychic",
    "Rồng": "Dragon",
    "Ngân Hà": "Galaxy",
    "Hoàng Gia": "Royal",
    "Bậc Rank (Pokémon Champions)": "Rank (Pokémon Champions)",
    "— Không hiển thị rank —": "— No rank displayed —",
    "Tên & Danh hiệu": "Name & title",
    "Tên Trainer (vd: Phúc)": "Trainer name (e.g. Phúc)",
    "Danh hiệu (vd: VGC Player)": "Title (e.g. VGC Player)",
    "Tông màu điểm nhấn": "Accent color",
    "Theo hệ Pokémon": "Follow Pokémon type",
    "Đỏ cổ điển": "Classic Red",
    "🎨 Tạo ảnh": "🎨 Generate card",
    "⬇️ Tải ảnh (1080×1920)": "⬇️ Download (1080×1920)",
    "Vùng mờ trên/dưới là nơi giao diện Story hay che mất — ảnh tải về vẫn đầy đủ, không bị mờ.": "Grayed areas show Story safe zone — downloaded image remains full, no blur.",
    "Image format": "Image format",
    "Vertical Story (9:16)": "Vertical Story (9:16)",
    "Landscape Trainer Card (16:9)": "Landscape Trainer Card (16:9)",
    "Avatar": "Avatar",
    "Photo": "Photo",
    "Pokémon Sprite": "Pokémon Sprite",
    "Hero Pokémon (background)": "Hero Pokémon (background)",
    "Team members (max 5)": "Team members (max 5)",
    "Avatar frame": "Avatar frame",
    "Name & title": "Name & title",
    "Accent color": "Accent color",
    "Follow Pokémon type": "Follow Pokémon type",
    "Classic Red": "Classic Red",
    "Generate card": "Generate card",
    "Download (1080×1920)": "Download (1080×1920)"
};

function translateText(value, language) {
    if (language === "vi") return value;
    const trimmed = value.trim();
    const translated = LANGUAGE_TEXT[trimmed];
    return translated ? value.replace(trimmed, translated) : value;
}

function translateNode(root, language) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
        if (!node.parentElement?.closest("script, style, [data-language-toggle]")) {
            if (node.__originalLanguageText === undefined) node.__originalLanguageText = node.nodeValue;
            const original = node.__originalLanguageText;
            node.nodeValue = translateText(original, language);
        }
    });

    root.querySelectorAll("[placeholder], [title], [aria-label]").forEach(element => {
        ["placeholder", "title", "aria-label"].forEach(attribute => {
            if (!element.hasAttribute(attribute)) return;
            const key = `data-language-original-${attribute}`;
            if (!element.hasAttribute(key)) element.setAttribute(key, element.getAttribute(attribute));
            element.setAttribute(attribute, translateText(element.getAttribute(key), language));
        });
    });
}

function applyLanguage(language) {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-language-toggle]").forEach(button => {
        button.textContent = language === "vi" ? "EN" : "VI";
        button.setAttribute("aria-label", language === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt");
    });
    translateNode(document.body, language);
    window.dispatchEvent(new CustomEvent("languagechanged", { detail: language }));
}

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "vi";
applyLanguage(savedLanguage);

document.querySelectorAll("[data-language-toggle]").forEach(button => {
    button.addEventListener("click", () => {
        const nextLanguage = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || "vi") === "vi" ? "en" : "vi";
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        applyLanguage(nextLanguage);
    });
});

const languageObserver = new MutationObserver(mutations => {
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "vi";
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) translateNode(node, language);
    }));
});
languageObserver.observe(document.body, { childList: true, subtree: true });
