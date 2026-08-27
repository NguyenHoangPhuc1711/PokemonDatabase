// ========================================
// POKÉMON CHATBOT
// Chỉ trả lời về Pokémon. Dữ liệu: PokeAPI + championsbattledata.com
// (dùng chung dữ liệu hệ từ typechart-data.js)
// ========================================

const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
const BATTLE_API_BASE = "https://championsbattledata.com/api";

const chatMessages = document.getElementById("chat-messages");
const chatSuggestions = document.getElementById("chat-suggestions");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");
const chatAutocomplete = document.getElementById("chat-autocomplete");

const pokeApiCache = new Map();

let pokemonNameList = null;
let pokemonNameListPromise = null;

function loadPokemonNameList() {
    if (pokemonNameListPromise) return pokemonNameListPromise;

    pokemonNameListPromise = fetch(`${POKE_API_BASE}?limit=2000`)
        .then(res => res.json())
        .then(data => {
            pokemonNameList = data.results.map(p => ({
                name: p.name,
                id: p.url.split("/").filter(Boolean).pop()
            }));
            return pokemonNameList;
        })
        .catch(() => {
            pokemonNameList = [];
            return pokemonNameList;
        });

    return pokemonNameListPromise;
}

function searchPokemonNames(prefixRaw, limit = 6) {
    if (!pokemonNameList) return [];

    const prefix = prefixRaw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "");

    if (prefix.length < 2) return [];

    return pokemonNameList
        .filter(p => p.name.startsWith(prefix))
        .slice(0, limit);
}

loadPokemonNameList();


// ========================================
// TIỆN ÍCH VĂN BẢN
// ========================================

function removeDiacritics(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

function normalizeMsg(str) {
    return removeDiacritics(str.toLowerCase()).trim();
}

function capitalizeWords(str) {
    if (!str) return "—";
    return str
        .toLowerCase()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

const STOPWORDS = new Set([
    "la", "gi", "nao", "cho", "minh", "toi", "ban", "hay", "xin", "vui", "long",
    "giup", "goi", "y", "loi", "build", "item", "items", "team", "doi", "hinh",
    "ve", "cua", "va", "voi", "de", "len", "do", "khac", "che", "nen", "dung",
    "choi", "sao", "the", "nhu", "pokemon", "pokémon", "champions", "chi", "tiet",
    "xem", "thong", "tin", "stats", "stat", "so", "co", "duoc", "mot", "vai", "it",
    "nhieu", "tot", "nhat", "hoi", "dap", "chatbot", "bot", "ai", "oi", "a", "nhe",
    "nhi", "di", "thu", "chao", "hello", "hi", "hey", "ok", "please", "suggest",
    "cach", "nen", "dung", "danh", "gia", "tell", "me", "about", "what", "is",
    "should", "use", "on", "for", "và", "hoac", "or", "con", "gi", "sao"
]);

const MATCHUP_KEYWORDS = ["khac", "yeu", "manh", "khang", "chong", "tuong khac"];

function hasStandaloneWord(norm, word) {
    return new RegExp(`\\b${word}\\b`).test(norm);
}


// ========================================
// GIAO DIỆN CHAT
// ========================================

function addMessage(html, sender = "bot") {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = sender === "bot"
        ? `<span class="chat-avatar"><img src="chatbot.png" alt="Chatbot"></span><div class="chat-bubble-content">${html}</div>`
        : html;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
}

function addTypingIndicator() {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble bot typing";
    bubble.innerHTML = `<span class="chat-avatar"><img src="chatbot.png" alt="Chatbot"></span><div class="chat-bubble-content"><span></span><span></span><span></span></div>`;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
}

function renderSuggestions(list) {
    chatSuggestions.innerHTML = list
        .map(text => `<button class="chat-chip" type="button">${text}</button>`)
        .join("");
}

chatSuggestions.addEventListener("click", event => {
    const chip = event.target.closest(".chat-chip");
    if (!chip) return;
    chatInput.value = chip.textContent;
    sendMessage();
});

chatSendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", event => {
    if (event.key === "Enter") sendMessage();
    if (event.key === "Escape") closeChatAutocomplete();
});

chatInput.addEventListener("input", () => {
    const tokens = chatInput.value.split(" ");
    const lastToken = tokens[tokens.length - 1];
    const matches = searchPokemonNames(lastToken);

    if (matches.length === 0) {
        closeChatAutocomplete();
        return;
    }

    chatAutocomplete.innerHTML = matches.map(p => {
        const number = String(p.id).padStart(3, "0");
        const displayName = capitalizeWords(p.name.replace(/-/g, " "));
        const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;

        return `
            <div class="search-suggestion" data-id="${p.name}">
                <img class="suggestion-image" src="${image}" alt="${displayName}">
                <div class="suggestion-info">
                    <div class="suggestion-name">${displayName}</div>
                    <div class="suggestion-number">#${number}</div>
                </div>
            </div>
        `;
    }).join("");
    chatAutocomplete.classList.add("active");
});

chatAutocomplete.addEventListener("click", event => {
    const item = event.target.closest(".search-suggestion");
    if (!item) return;

    const tokens = chatInput.value.split(" ");
    tokens[tokens.length - 1] = capitalizeWords(item.dataset.id.replace(/-/g, " "));
    chatInput.value = tokens.join(" ");

    closeChatAutocomplete();
    sendMessage();
});

document.addEventListener("click", event => {
    if (!event.target.closest(".chat-input-wrap")) {
        closeChatAutocomplete();
    }
});

function closeChatAutocomplete() {
    chatAutocomplete.classList.remove("active");
    chatAutocomplete.innerHTML = "";
}


// ========================================
// GỬI TIN & XỬ LÝ Ý ĐỊNH
// ========================================

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(escapeHtml(text), "user");
    chatInput.value = "";
    chatSuggestions.innerHTML = "";
    closeChatAutocomplete();

    const typingBubble = addTypingIndicator();

    try {
        await handleUserMessage(text);
    } catch (error) {
        console.error(error);
        addMessage("😵 Có lỗi xảy ra khi xử lý câu hỏi này. Bạn thử lại nhé!", "bot");
    } finally {
        typingBubble.remove();
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

async function handleUserMessage(rawText) {
    const norm = normalizeMsg(rawText);

    // 1. Chào hỏi
    if (/^(chao|hi|hello|xin chao|alo|hey)\b/.test(norm)) {
        addMessage(
            `Chào bạn! 👋 Mình là trợ lý Pokémon. Bạn có thể hỏi mình:
            <ul class="chat-list">
                <li>Gợi ý build/item/đồng đội cho 1 Pokémon (vd: "basculegion")</li>
                <li>Hệ nào khắc chế hệ nào (vd: "hệ rồng khắc gì")</li>
            </ul>`
        );
        renderSuggestions(["Basculegion build?", "Hệ rồng khắc gì?", "Garchomp"]);
        return;
    }

    // 2. Hỏi về tương khắc hệ
    const typeIntent = detectTypeIntent(norm);
    if (typeIntent) {
        respondTypeMatchup(typeIntent);
        return;
    }

    // 3. Cố nhận diện tên Pokémon
    const pokemonMatch = await detectPokemon(norm);
    if (pokemonMatch) {
        await respondPokemonBuild(pokemonMatch);
        return;
    }

    // 4. Có nhắc "pokemon" chung chung nhưng không rõ tên
    if (norm.includes("pokemon") || norm.includes("pokémon")) {
        addMessage(
            `Bạn muốn hỏi về Pokémon nào vậy? Nhập tên (tiếng Anh) của nó nhé,
            ví dụ: <em>garchomp</em>, <em>sylveon</em>, <em>charizard</em>...`
        );
        return;
    }

    // 5. Ngoài chủ đề
    addMessage(
        `Xin lỗi, mình chỉ có thể trò chuyện về <strong>Pokémon</strong> thôi 🙏
        (build, item, đồng đội, tương khắc hệ...). Bạn thử hỏi lại theo hướng đó nhé!`
    );
    renderSuggestions(["Basculegion build?", "Hệ bọ khắc gì?", "Charizard"]);
}


// ========================================
// Ý ĐỊNH: TƯƠNG KHẮC HỆ
// ========================================

const TYPE_VI_LOOKUP = {};
Object.entries(TYPE_LABEL_VI).forEach(([key, vi]) => {
    TYPE_VI_LOOKUP[removeDiacritics(vi).toLowerCase()] = key;
});

function detectTypeIntent(norm) {
    const hasMatchupKeyword = MATCHUP_KEYWORDS.some(k => norm.includes(k)) || hasStandaloneWord(norm, "he");
    if (!hasMatchupKeyword) return null;

    const found = [];

    TYPE_ORDER.forEach(typeKey => {
        const regex = new RegExp(`\\b${typeKey}\\b`);
        if (regex.test(norm) && !found.includes(typeKey)) found.push(typeKey);
    });

    Object.entries(TYPE_VI_LOOKUP).forEach(([viNorm, typeKey]) => {
        const regex = new RegExp(`\\b${viNorm}\\b`);
        if (regex.test(norm) && !found.includes(typeKey)) found.push(typeKey);
    });

    return found.length > 0 ? found.slice(0, 2) : null;
}

function respondTypeMatchup(types) {
    if (types.length === 1) {
        const type = types[0];
        const weakTo = [];
        const resists = [];
        const immune = [];

        TYPE_ORDER.forEach(attacker => {
            if (attacker === type) return;
            const mult = getAttackMultiplier(attacker, type);
            if (mult > 1) weakTo.push(attacker);
            else if (mult === 0) immune.push(attacker);
            else if (mult < 1) resists.push(attacker);
        });

        const superAgainst = TYPE_ORDER.filter(d => d !== type && getAttackMultiplier(type, d) > 1);

        addMessage(`
            <p>🔎 Hệ <strong>${TYPE_LABEL_VI[type]} (${type.toUpperCase()})</strong>:</p>
            <p>⚔️ Tấn công hiệu quả cao (2x) vào: ${chipList(superAgainst)}</p>
            <p>🛡️ Bị khắc chế (nhận 2x) bởi: ${chipList(weakTo) || "<em>không có</em>"}</p>
            <p>✅ Kháng lại (nhận ≤0.5x) từ: ${chipList(resists) || "<em>không có</em>"}</p>
            ${immune.length ? `<p>🚫 Miễn nhiễm với: ${chipList(immune)}</p>` : ""}
            <p><a class="chat-link" href="Types.html?type=${type}" target="_blank">Xem chi tiết bảng hệ →</a></p>
        `);
    } else {
        const [a, b] = types;
        const aVsB = getAttackMultiplier(a, b);
        const bVsA = getAttackMultiplier(b, a);

        addMessage(`
            <p>🔎 So sánh hệ <strong>${TYPE_LABEL_VI[a]}</strong> và <strong>${TYPE_LABEL_VI[b]}</strong>:</p>
            <p>${TYPE_LABEL_VI[a]} tấn công ${TYPE_LABEL_VI[b]}: <strong>${aVsB}x</strong></p>
            <p>${TYPE_LABEL_VI[b]} tấn công ${TYPE_LABEL_VI[a]}: <strong>${bVsA}x</strong></p>
            <p><a class="chat-link" href="Types.html?type=${a}" target="_blank">Xem chi tiết bảng hệ →</a></p>
        `);
    }

    renderSuggestions(["Basculegion build?", "Garchomp", "Hệ thép khắc gì?"]);
}

function chipList(typeArr) {
    return typeArr.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join(" ");
}


// ========================================
// Ý ĐỊNH: NHẬN DIỆN TÊN POKÉMON (qua PokeAPI)
// ========================================

async function tryFetchPokemon(candidate) {
    if (pokeApiCache.has(candidate)) return pokeApiCache.get(candidate);

    try {
        const res = await fetch(`${POKE_API_BASE}/${candidate}`);
        if (!res.ok) {
            pokeApiCache.set(candidate, null);
            return null;
        }
        const data = await res.json();
        pokeApiCache.set(candidate, data);
        return data;
    } catch {
        pokeApiCache.set(candidate, null);
        return null;
    }
}

// Một số loài chỉ tồn tại dưới dạng form theo giới tính trên PokeAPI
// (vd: không có "basculegion" trơn, chỉ có "basculegion-male"/"basculegion-female")
async function tryFetchPokemonSmart(candidate) {
    const data = await tryFetchPokemon(candidate);
    if (data) return data;
    return await tryFetchPokemon(`${candidate}-male`);
}

// Chuyển tên dạng PokeAPI sang Showdown ID chuẩn mà championsbattledata.com dùng
// (vd: "basculegion-male" -> "basculegion", "raichu-alola" -> "raichualola")
function toShowdownId(pokeApiName) {
    let id = pokeApiName.toLowerCase();
    if (id.endsWith("-male")) id = id.replace(/-male$/, "");
    else if (id.endsWith("-female")) id = id.replace(/-female$/, "f");
    return id.replace(/-/g, "");
}

async function detectPokemon(norm) {
    const tokens = norm
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter(t => t.length >= 3 && !STOPWORDS.has(t));

    if (tokens.length === 0) return null;

    // Thử ghép 2 từ liên tiếp trước (vd: "mr mime" -> "mr-mime")
    for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]}-${tokens[i + 1]}`;
        const data = await tryFetchPokemon(bigram);
        if (data) return data;
    }

    // Sau đó thử từng từ đơn (tối đa 6 từ để tránh gọi quá nhiều API)
    for (const token of tokens.slice(0, 6)) {
        const data = await tryFetchPokemonSmart(token);
        if (data) return data;
    }

    return null;
}


// ========================================
// Ý ĐỊNH: GỢI Ý BUILD / ITEM / TEAM
// ========================================

// ========================================
// NGUỒN ĐỐI CHIẾU: PIKALYTICS.COM
// Dùng khi championsbattledata.com trông thiếu tin cậy (top move quá thấp %)
// ========================================

const PIKALYTICS_FORMAT = "battledataregmbs3";

function extractPikaPairs(text) {
    const pairs = [];
    const re = /([A-Z][A-Za-z0-9'\.\- ]{1,28}?)\s*\((\d+(?:\.\d+)?)%\)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        pairs.push({ name: m[1].trim(), pct: parseFloat(m[2]) });
    }
    return pairs;
}

function extractPikaSection(text, anchorRegex, windowSize = 400) {
    const idx = text.search(anchorRegex);
    if (idx === -1) return [];
    return extractPikaPairs(text.slice(idx, idx + windowSize));
}

async function fetchPikalyticsData(displayName) {
    const primary = await fetchPikalyticsRaw(displayName);
    if (primary) return primary;

    for (const suffix of ["-Mega-Y", "-Mega-X", "-Mega"]) {
        const alt = await fetchPikalyticsRaw(displayName + suffix);
        if (alt) return alt;
    }

    return null;
}

async function fetchPikalyticsRaw(displayName) {
    try {
        const slug = displayName.trim().replace(/\s+/g, "-");
        const res = await fetch(`https://www.pikalytics.com/ai/pokedex/${PIKALYTICS_FORMAT}/${encodeURIComponent(slug)}`);
        if (!res.ok) return null;

        const text = await res.text();
        if (!text || text.length < 20) return null;

        const moves = extractPikaSection(text, /top moves?/i);
        const items = extractPikaSection(text, /popular items?/i);
        const abilities = extractPikaSection(text, /common abilit/i);
        const teammates = extractPikaSection(text, /synergizes well with|team partner/i);

        if (moves.length === 0 && items.length === 0) return null;

        return { moves, items, abilities, teammates };
    } catch {
        return null;
    }
}

async function respondPokemonBuild(pokeData) {
    const showdownId = toShowdownId(pokeData.name);
    const displayName = capitalizeWords(pokeData.name.replace(/-/g, " "));
    const types = pokeData.types.map(t => t.type.name);
    const spriteUrl =
        pokeData.sprites?.other?.["official-artwork"]?.front_default ||
        pokeData.sprites?.front_default || "";

    const topStats = [...pokeData.stats]
        .sort((a, b) => b.base_stat - a.base_stat)
        .slice(0, 2)
        .map(s => `${statLabelVi(s.stat.name)} ${s.base_stat}`)
        .join(", ");

    let battleData = null;
    let usedFormat = "Doubles";
    let usedShowdownId = showdownId;

    for (const format of ["Doubles", "Singles"]) {
        const primary = await fetchBattleJson(showdownId, format);
        if (!primary) continue;

        let best = primary;
        let bestId = showdownId;
        let bestTop = topMovePercent(primary);

        // Nếu dữ liệu gốc trông thiếu tin cậy (top move < 15%), thử các form Mega
        // — thường gặp khi Pokémon gần như luôn Mega Evolve khi thi đấu (vd: Charizard)
        if (bestTop < 15) {
            for (const variant of [`${showdownId}mega`, `${showdownId}megay`, `${showdownId}megax`]) {
                const alt = await fetchBattleJson(variant, format);
                const altTop = alt ? topMovePercent(alt) : -1;
                if (altTop > bestTop) {
                    best = alt;
                    bestId = variant;
                    bestTop = altTop;
                }
            }
        }

        battleData = best;
        usedFormat = format;
        usedShowdownId = bestId;
        break;
    }

    const header = `
        <div class="chat-pokemon-header">
            ${spriteUrl ? `<img src="${spriteUrl}" alt="${displayName}" class="chat-pokemon-sprite">` : ""}
            <div>
                <strong>${displayName}</strong><br>
                ${chipList(types)}
            </div>
        </div>
        <p>📊 Chỉ số nổi bật: <strong>${topStats}</strong></p>
    `;

    if (!battleData) {
        addMessage(`
            ${header}
            <p>⚠️ Hiện chưa có đủ dữ liệu trận đấu (competitive) cho <strong>${displayName}</strong>,
            có thể do ít được sử dụng hoặc chưa hỗ trợ trong Pokémon Champions.</p>
            <p><a class="chat-link" href="PokemonDatabase.html?search=${pokeData.name}" target="_blank">Xem thông tin Pokédex đầy đủ →</a></p>
        `);
        renderSuggestions(["Garchomp build?", "Sneasler", "Hệ nước khắc gì?"]);
        return;
    }

    const grouped = {};
    battleData.rows.forEach(row => {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push(row);
    });

    let topMoves = topOf(grouped.move, 4).map(r => r.name);
    let topItem = topOf(grouped.held_item, 1)[0];
    const topNature = topOf(grouped.stat_alignment, 1)[0];
    let topAbility = topOf(grouped.ability, 1)[0];
    let topTeammates = topOf(grouped.teammate, 4).map(r => r.name);

    const switchNote = (usedShowdownId !== showdownId)
        ? `<p>✅ Đã tự động dùng dữ liệu form <strong>Mega Evolution</strong> vì chính xác hơn form thường.</p>`
        : "";

    // Nếu dữ liệu champds vẫn thiếu tin cậy (top move quá thấp %), đối chiếu với Pikalytics
    let pikaNote = "";
    const currentTopMovePct = topMovePercent(battleData);
    if (currentTopMovePct < 15) {
        const pika = await fetchPikalyticsData(displayName);
        if (pika) {
            if (pika.moves.length) topMoves = pika.moves.slice(0, 4).map(m => `${capitalizeWords(m.name)} (${m.pct}%)`);
            if (pika.items.length) topItem = { name: capitalizeWords(pika.items[0].name), percentage: `${pika.items[0].pct}%` };
            if (pika.abilities.length) topAbility = { name: capitalizeWords(pika.abilities[0].name), percentage: `${pika.abilities[0].pct}%` };
            if (pika.teammates.length) topTeammates = pika.teammates.slice(0, 4).map(t => capitalizeWords(t.name));
            pikaNote = `<p>📊 Đã đối chiếu với <strong>Pikalytics.com</strong> vì dữ liệu gốc chưa đầy đủ.</p>`;
        }
    }

    addMessage(`
        ${header}
        ${switchNote}
        ${pikaNote}
        <p>💡 Gợi ý build phổ biến nhất (chế độ <strong>${usedFormat}</strong>):</p>
        <ul class="chat-list">
            ${topAbility ? `<li>🧪 Kỹ năng: <strong>${topAbility.name}</strong> (${topAbility.percentage})</li>` : ""}
            ${topItem ? `<li>🎒 Vật phẩm: <strong>${topItem.name}</strong> (${topItem.percentage})</li>` : ""}
            ${topNature ? `<li>🧬 Bản chất: <strong>${topNature.name}</strong> (${topNature.percentage}) — tăng ${topNature.stat_up}, giảm ${topNature.stat_down}</li>` : ""}
            ${topMoves.length ? `<li>⚔️ Chiêu thức hay dùng: ${topMoves.join(", ")}</li>` : ""}
            ${topTeammates.length ? `<li>🤝 Đồng đội ăn ý: ${topTeammates.join(", ")}</li>` : ""}
        </ul>
        <p>
            <a class="chat-link" href="Meta.html?pokemon=${usedShowdownId}&format=${usedFormat}" target="_blank">
                Xem đầy đủ thống kê tại trang Meta →
            </a>
        </p>
    `);

    renderSuggestions([`${capitalizeWords(topTeammates[0] || "Garchomp")} build?`, "Hệ nào khắc " + types[0], "Charizard"]);
}

// Không dựa vào field "rank" của API (đôi khi không reset về 1 cho từng
// category) — luôn sắp xếp lại theo % sử dụng thực tế để đảm bảo gợi ý đúng.
function topOf(rows, n) {
    if (!rows) return [];
    return [...rows]
        .sort((a, b) => {
            const pa = typeof a.percentage_value === "number" ? a.percentage_value : -1;
            const pb = typeof b.percentage_value === "number" ? b.percentage_value : -1;
            if (pb !== pa) return pb - pa;
            return (a.rank || 0) - (b.rank || 0);
        })
        .slice(0, n);
}

async function fetchBattleJson(id, format) {
    try {
        const res = await fetch(`${BATTLE_API_BASE}/battle/${format}/${id}`);
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.rows || json.rows.length === 0) return null;
        return json;
    } catch {
        return null;
    }
}

function topMovePercent(battleData) {
    const moves = (battleData.rows || []).filter(r => r.category === "move");
    if (moves.length === 0) return -1;
    return Math.max(...moves.map(m => (typeof m.percentage_value === "number" ? m.percentage_value : 0)));
}

function statLabelVi(statName) {
    const map = {
        hp: "HP",
        attack: "Tấn công",
        defense: "Phòng thủ",
        "special-attack": "Tấn công đặc biệt",
        "special-defense": "Phòng thủ đặc biệt",
        speed: "Tốc độ"
    };
    return map[statName] || statName;
}


// ========================================
// INIT
// ========================================

addMessage(`
    Chào bạn! 👋 Mình là trợ lý Pokémon.<br>
    Hỏi mình về <strong>build/item/đồng đội</strong> của 1 Pokémon, hoặc <strong>tương khắc hệ</strong> nhé!
`);
renderSuggestions(["Basculegion build?", "Hệ rồng khắc gì?", "Garchomp"]);
