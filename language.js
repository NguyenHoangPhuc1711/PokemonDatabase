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
    "Damage Calc": "Damage Calculator",
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
    "TẤN CÔNG": "OFFENSE",
    "PHÒNG THỦ": "DEFENSE",
    "ƯU & NHƯỢC ĐIỂM": "STRENGTHS & WEAKNESSES",
    "ĐỘI HÌNH CỦA BẠN": "YOUR TEAM",
    "Xoá đội": "Clear team",
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
    "Phúc xin cảm ơn mọi người đã dùng Web.": "Thank you for using the website.",
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
    "Anti-synergy": "Anti-synergy"
    ,"TEAM CHECK": "TEAM CHECK"
    ,"✓ Kháng / yếu hệ": "✓ Type coverage"
    ,"! Điểm yếu": "! Weaknesses"
    ,"⚔ Độ phủ tấn công": "⚔ Offensive coverage"
    ,"▣ Phân bổ damage": "▣ Damage distribution"
    ,"Có thể xây Trick Room": "Possible Trick Room core"
    ,"Có thể xây Sun": "Possible Sun team"
    ,"Có thể xây Rain": "Possible Rain team"
    ,"Có thể xây Snow": "Possible Snow team"
    ,"Có core Fire / Water / Grass": "Fire / Water / Grass core detected"
    ,"Có core Dragon / Fairy / Steel": "Dragon / Fairy / Steel core detected"
    ,"⚠ Anti-synergy": "⚠ Anti-synergy"
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
