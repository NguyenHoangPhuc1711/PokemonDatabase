// ========================================
// META POKÉMON CHAMPIONS
// Dữ liệu build (chiêu/vật phẩm/đồng đội/kỹ năng/bản chất/EV): smogon.com/stats (Pokémon Showdown Usage Stats)
// Dữ liệu sprite/hệ/base stats: pokeapi.co
//
// LƯU Ý: smogon.com/stats là số liệu ladder Pokémon Showdown (Smogon University),
// KHÔNG phải số liệu giải đấu chính thức Pokémon Champions/VGC thật. Đây là nguồn
// công khai, ổn định, có JSON thật (khác endpoint Pikalytics cũ vốn không trả về
// dữ liệu dạng máy đọc được).
// ========================================

const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
const POKE_API_ROOT = "https://pokeapi.co/api/v2";
const SMOGON_STATS_BASE = "https://www.smogon.com/stats/";
const CHAMPIONS_META_BASE = "https://eurekaffeine.github.io/pokemon-champions-scraper/";

// Trình duyệt CHẶN request cross-origin nếu server không trả header
// Access-Control-Allow-Origin. smogon.com có thể hoặc không bật CORS tuỳ route —
// nên mọi fetch tới Smogon đều thử trực tiếp trước, fail thì fallback qua proxy này.
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";

const spriteCache = new Map();
const smogonJsonCache = new Map();     // `${month}/${file}` -> parsed JSON.data (hoặc null)
const smogonFormatCache = new Map();   // "Doubles"/"Singles" -> { month, file } (hoặc null)
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

function searchPokemonNames(prefixRaw, limit = 8) {
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

async function getPokemonSprite(id) {
    if (spriteCache.has(id)) return spriteCache.get(id);

    try {
        const res = await fetch(`${POKE_API_BASE}/${id}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        const sprite =
            data.sprites?.other?.["official-artwork"]?.front_default ||
            data.sprites?.front_default || null;
        spriteCache.set(id, sprite);
        return sprite;
    } catch {
        spriteCache.set(id, null);
        return null;
    }
}

// Danh sách Top 10 được dùng nhiều nhất (tham khảo, có thể đổi theo mùa)
const TOP_META = {
    Doubles: [
        { id: "garchomp", name: "Garchomp", types: ["dragon", "ground"] },
        { id: "sinistcha", name: "Sinistcha", types: ["grass", "ghost"] },
        { id: "basculegion", spriteId: "basculegion-male", name: "Basculegion", types: ["water", "ghost"] },
        { id: "whimsicott", name: "Whimsicott", types: ["grass", "fairy"] },
        { id: "kingambit", name: "Kingambit", types: ["dark", "steel"] },
        { id: "staraptor", name: "Staraptor", types: ["normal", "flying"] },
        { id: "incineroar", name: "Incineroar", types: ["fire", "dark"] },
        { id: "charizard", name: "Charizard", types: ["fire", "flying"] },
        { id: "raichu", name: "Raichu", types: ["electric"] },
        { id: "pelipper", name: "Pelipper", types: ["water", "flying"] },
        { id: "sneasler", name: "Sneasler", types: ["fighting", "poison"] },
        { id: "archaludon", name: "Archaludon", types: ["steel", "dragon"] },
        { id: "grimmsnarl", name: "Grimmsnarl", types: ["dark", "fairy"] },
        { id: "sylveon", name: "Sylveon", types: ["fairy"] },
        { id: "swampert", name: "Swampert", types: ["water", "ground"] },
        { id: "metagross", name: "Metagross", types: ["steel", "psychic"] },
        { id: "farigiraf", name: "Farigiraf", types: ["normal", "psychic"] },
        { id: "floette-eternal", spriteId: "floette-eternal", name: "Floette-Eternal", types: ["fairy"] },
        { id: "gholdengo", name: "Gholdengo", types: ["steel", "ghost"] },
        { id: "aerodactyl", name: "Aerodactyl", types: ["rock", "flying"] }
    ],
    Singles: [
        { id: "garchomp", name: "Garchomp", types: ["dragon", "ground"] },
        { id: "primarina", name: "Primarina", types: ["water", "fairy"] },
        { id: "charizard", name: "Charizard", types: ["fire", "flying"] },
        { id: "corviknight", name: "Corviknight", types: ["flying", "steel"] },
        { id: "archaludon", name: "Archaludon", types: ["steel", "dragon"] },
        { id: "hippowdon", name: "Hippowdon", types: ["ground"] },
        { id: "gengar", name: "Gengar", types: ["ghost", "poison"] },
        { id: "scizor", name: "Scizor", types: ["bug", "steel"] },
        { id: "aegislash", name: "Aegislash", types: ["steel", "ghost"] },
        { id: "dragonite", name: "Dragonite", types: ["dragon", "flying"] }
    ]
};

const LOCAL_META_TYPES = new Map(
    Object.values(TOP_META).flat().map(entry => [normalizeShowdownId(entry.id), entry.types])
);

const CATEGORY_LABEL_VI = {
    move: "CHIÊU THỨC PHỔ BIẾN",
    item: "VẬT PHẨM PHỔ BIẾN",
    teammate: "ĐỒNG ĐỘI PHỔ BIẾN",
    ability: "KỸ NĂNG PHỔ BIẾN"
};

const TYPE_ORDER_META = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

let selectedTypeFilter = null;

let currentFormat = "Doubles";
let currentlyLoadedId = null;
let currentlyLoadedChampionsId = null;
let detailRequestId = 0;
const championsRankings = { Doubles: null, Singles: null };

const rankGrid = document.getElementById("meta-rank-grid");
const rankLabel = document.getElementById("meta-rank-label");
const typeFilterRow = document.getElementById("meta-type-filter");
const detailPanel = document.getElementById("meta-detail");
const formatToggle = document.getElementById("meta-format-toggle");
const metaSearchInput = document.getElementById("meta-search-input");
const metaSearchButton = document.getElementById("meta-search-button");
const metaSearchSuggestions = document.getElementById("meta-search-suggestions");


// ========================================
// BỘ LỌC HỆ
// ========================================

function renderTypeFilter() {
    typeFilterRow.innerHTML = `
        <button class="meta-type-chip ${selectedTypeFilter === null ? "active" : ""}" data-type="" type="button">
            Tất cả
        </button>
        ${TYPE_ORDER_META.map(t => `
            <button class="meta-type-chip type-chip-${t} ${selectedTypeFilter === t ? "active" : ""}" data-type="${t}" type="button">
                <span class="type ${t}">${t.toUpperCase()}</span>
            </button>
        `).join("")}
    `;
}

typeFilterRow.addEventListener("click", event => {
    const chip = event.target.closest(".meta-type-chip");
    if (!chip) return;

    selectedTypeFilter = chip.dataset.type || null;
    renderTypeFilter();
    renderRankGrid();
});


// ========================================
// RANK GRID
// ========================================

function renderRankGrid() {
    const fullList = championsRankings[currentFormat] || TOP_META[currentFormat];
    let entries;

    if (selectedTypeFilter) {
        entries = fullList
            .map((entry, index) => ({
                ...entry,
                types: entry.types?.length ? entry.types : LOCAL_META_TYPES.get(normalizeShowdownId(entry.id)) || [],
                rank: index + 1
            }))
            .filter(entry => entry.types.includes(selectedTypeFilter))
            .map((entry, index) => ({ ...entry, rank: index + 1 }))
            .slice(0, 10);

        rankLabel.textContent = `TOP HỆ ${selectedTypeFilter.toUpperCase()} · ${currentFormat.toUpperCase()}`;
    } else {
        entries = fullList.slice(0, 10).map((entry, index) => ({
            ...entry,
            types: entry.types?.length ? entry.types : LOCAL_META_TYPES.get(normalizeShowdownId(entry.id)) || [],
            rank: index + 1
        }));
        rankLabel.textContent = `TOP 10 · ${currentFormat.toUpperCase()}`;
    }

    if (entries.length === 0) {
        rankGrid.innerHTML = `
            <p class="meta-empty-filter">
                Không có Pokémon hệ ${selectedTypeFilter ? selectedTypeFilter.toUpperCase() : ""} trong danh sách tham khảo hiện tại.
            </p>
        `;
        return;
    }

    rankGrid.innerHTML = entries.map(entry => `
        <button class="meta-rank-card" data-id="${entry.id}" data-sprite-id="${entry.spriteId || entry.id}" data-champions-id="${entry.championsId || ""}" type="button">
            <span class="rank-badge">#${entry.rank}</span>
            <span class="meta-rank-sprite-wrap" data-sprite-for="${entry.id}">
                <span class="meta-rank-sprite-fallback">●</span>
            </span>
            <span class="meta-rank-name">${entry.name}</span>
            <span class="meta-rank-types">
                ${entry.types.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join("")}
            </span>
        </button>
    `).join("");

    loadRankSpritesFor(entries);
}

async function loadChampionsRankings(formatKey) {
    if (championsRankings[formatKey]) return;

    const formatPath = formatKey === "Singles" ? "singles/" : "";
    const response = await fetch(`${CHAMPIONS_META_BASE}${formatPath}battle_meta.json`);
    if (!response.ok) throw new Error("Champions meta API is unavailable");
    const payload = await response.json();
    const usage = Array.isArray(payload.pokemon_usage) ? payload.pokemon_usage.slice(0, 100) : [];

    const entries = await Promise.all(usage.map(async entry => {
        try {
            const pokemonResponse = await fetch(`${POKE_API_BASE}/${entry.dex_id}`);
            const pokemon = pokemonResponse.ok ? await pokemonResponse.json() : null;
            return {
                id: pokemon?.name || normalizeShowdownId(entry.name),
                spriteId: pokemon?.name || normalizeShowdownId(entry.name),
                name: entry.name,
                types: pokemon?.types?.map(type => type.type.name) || [],
                championsId: entry.dex_id
            };
        } catch {
            return { id: normalizeShowdownId(entry.name), name: entry.name, types: [], championsId: entry.dex_id };
        }
    }));

    if (entries.length) championsRankings[formatKey] = entries;
}

async function refreshChampionsRankings() {
    try {
        await loadChampionsRankings(currentFormat);
        renderRankGrid();
    } catch (error) {
        console.warn("Unable to load Pokemon Champions rankings; using local list.", error);
    }
}

async function loadRankSpritesFor(entries) {
    await Promise.all(entries.map(async entry => {
        const sprite = await getPokemonSprite(entry.spriteId || entry.id);
        if (!sprite) return;

        const wrap = rankGrid.querySelector(`[data-sprite-for="${entry.id}"]`);
        if (wrap) {
            wrap.innerHTML = `<img src="${sprite}" alt="${entry.name}" class="meta-rank-sprite" loading="lazy" decoding="async">`;
        }
    }));
}

formatToggle.addEventListener("click", event => {
    const btn = event.target.closest(".format-toggle-btn");
    if (!btn) return;

    currentFormat = btn.dataset.format;

    formatToggle.querySelectorAll(".format-toggle-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    renderRankGrid();
    refreshChampionsRankings();

    if (currentlyLoadedId) {
        loadPokemonMeta(currentlyLoadedId, null, currentlyLoadedChampionsId);
    }
});

rankGrid.addEventListener("click", event => {
    const card = event.target.closest(".meta-rank-card");
    if (!card) return;

    loadPokemonMeta(card.dataset.id, card.dataset.spriteId, card.dataset.championsId);

    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});


// ========================================
// TÌM KIẾM (AUTOCOMPLETE)
// ========================================

metaSearchInput.addEventListener("focus", () => loadPokemonNameList(), { once: true });

function toShowdownId(pokeApiName) {
    let id = pokeApiName.toLowerCase();
    if (id.endsWith("-male")) id = id.replace(/-male$/, "");
    else if (id.endsWith("-female")) id = id.replace(/-female$/, "f");
    return id.replace(/-/g, "");
}

function normalizeShowdownId(rawInput) {
    return rawInput
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

let metaSuggestionDebounceTimer = null;

metaSearchInput.addEventListener("input", () => {
    clearTimeout(metaSuggestionDebounceTimer);
    const value = metaSearchInput.value;

    metaSuggestionDebounceTimer = setTimeout(() => {
        const matches = searchPokemonNames(value);

        if (matches.length === 0) {
            metaSearchSuggestions.classList.remove("active");
            metaSearchSuggestions.innerHTML = "";
            return;
        }

        metaSearchSuggestions.innerHTML = matches.map(p => {
            const number = String(p.id).padStart(3, "0");
            const displayName = capitalizeWords(p.name.replace(/-/g, " "));
            const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;

            return `
                <div class="search-suggestion" data-id="${p.name}">
                    <img class="suggestion-image" src="${image}" alt="${displayName}" loading="lazy" decoding="async">
                    <div class="suggestion-info">
                        <div class="suggestion-name">${displayName}</div>
                        <div class="suggestion-number">#${number}</div>
                    </div>
                </div>
            `;
        }).join("");
        metaSearchSuggestions.classList.add("active");
    }, 150);
});

metaSearchButton.addEventListener("click", () => {
    const value = normalizeShowdownId(metaSearchInput.value.trim());
    if (!value) return;

    metaSearchSuggestions.classList.remove("active");
    loadPokemonMeta(value);
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

metaSearchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") metaSearchButton.click();
    if (event.key === "Escape") metaSearchSuggestions.classList.remove("active");
});

metaSearchSuggestions.addEventListener("click", event => {
    const item = event.target.closest(".search-suggestion");
    if (!item) return;

    metaSearchInput.value = capitalizeWords(item.dataset.id.replace(/-/g, " "));
    metaSearchSuggestions.classList.remove("active");
    metaSearchSuggestions.innerHTML = "";

    loadPokemonMeta(toShowdownId(item.dataset.id), item.dataset.id);
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("click", event => {
    if (!event.target.closest(".meta-search-wrap")) {
        metaSearchSuggestions.classList.remove("active");
    }
});


// ========================================
// SMOGON.COM/STATS — NGUỒN DỮ LIỆU THẬT (JSON công khai)
// Cấu trúc chuẩn: https://www.smogon.com/stats/{YYYY-MM}/chaos/{format}-{rating}.json
// Ví dụ: https://www.smogon.com/stats/2025-11/chaos/gen9vgc2025regg-1760.json
// ========================================

// fetch có fallback qua CORS proxy — dùng chung cho mọi request tới smogon.com
async function corsAwareFetchText(url) {
    for (const attemptUrl of [url, CORS_PROXY_URL + encodeURIComponent(url)]) {
        try {
            const res = await fetch(attemptUrl);
            if (!res.ok) continue;
            const text = await res.text();
            if (text) return text;
        } catch (err) {
            console.warn(`[meta.js] Fetch thất bại: ${attemptUrl}`, err.message || err);
        }
    }
    return null;
}

// Dò thư mục tháng mới nhất trong https://www.smogon.com/stats/
async function listAvailableMonths() {
    const html = await corsAwareFetchText(SMOGON_STATS_BASE);
    if (!html) return [];

    const months = [...html.matchAll(/href="(\d{4}-\d{2})\/"/g)].map(m => m[1]);
    return [...new Set(months)].sort().reverse(); // mới nhất trước
}

// Dò file .json phù hợp nhất (Doubles → có "vgc", Singles → "ou" chuẩn) trong 1 tháng
async function findFormatFileInMonth(month, formatKey) {
    const listingUrl = `${SMOGON_STATS_BASE}${month}/chaos/`;
    const html = await corsAwareFetchText(listingUrl);
    if (!html) return null;

    const files = [...html.matchAll(/href="([^"]+\.json)"/g)].map(m => m[1]);

    const pattern = formatKey === "Doubles"
        ? /^gen(\d+)vgc/i
        : /^gen(\d+)(ou|bss)/i;

    const candidates = files.filter(f => pattern.test(f));
    if (candidates.length === 0) return null;

    // Ưu tiên: gen cao nhất, rồi ngưỡng rating cao (đại diện người chơi giỏi) nhưng
    // vẫn còn mẫu (fallback dần xuống nếu rating cao không tồn tại).
    const ratingPriority = ["1760", "1695", "1630", "1500", "1300", "0"];
    candidates.sort((a, b) => {
        const genA = parseInt(a.match(/gen(\d+)/i)?.[1] || "0", 10);
        const genB = parseInt(b.match(/gen(\d+)/i)?.[1] || "0", 10);
        if (genA !== genB) return genB - genA;
        const ratingA = ratingPriority.indexOf(a.match(/-(\d+)\.json$/)?.[1] || "");
        const ratingB = ratingPriority.indexOf(b.match(/-(\d+)\.json$/)?.[1] || "");
        return (ratingA === -1 ? 99 : ratingA) - (ratingB === -1 ? 99 : ratingB);
    });

    return candidates[0];
}

// Trả về { month, file } của format hiện tại, có cache lại trong session
async function resolveSmogonFormat(formatKey) {
    if (smogonFormatCache.has(formatKey)) return smogonFormatCache.get(formatKey);

    const months = await listAvailableMonths();
    let resolved = null;

    // Thử vài tháng gần nhất phòng khi tháng mới nhất chưa có đủ dữ liệu
    for (const month of months.slice(0, 4)) {
        const file = await findFormatFileInMonth(month, formatKey);
        if (file) {
            resolved = { month, file };
            break;
        }
    }

    if (!resolved) {
        console.warn(`[meta.js] Không tìm thấy file thống kê Smogon phù hợp cho "${formatKey}"`);
    }

    smogonFormatCache.set(formatKey, resolved);
    return resolved;
}

// Tải + cache toàn bộ JSON của 1 format/tháng (chỉ tải 1 lần, tái dùng cho mọi Pokémon)
async function loadSmogonJsonData(month, file) {
    const cacheKey = `${month}/${file}`;
    if (smogonJsonCache.has(cacheKey)) return smogonJsonCache.get(cacheKey);

    const url = `${SMOGON_STATS_BASE}${month}/chaos/${file}`;
    const text = await corsAwareFetchText(url);

    let data = null;
    if (text) {
        try {
            const parsed = JSON.parse(text);
            data = parsed.data || null;
        } catch (err) {
            console.warn(`[meta.js] Không parse được JSON từ ${url}`, err.message || err);
        }
    }

    smogonJsonCache.set(cacheKey, data);
    return data;
}

// Chuẩn hoá 1 nhóm (Moves/Items/Abilities/Teammates) thành mảng {name, pct} sắp giảm dần
function normalizeUsageGroup(rawGroup) {
    if (!rawGroup) return [];

    const entries = Object.entries(rawGroup).filter(([name]) => name && name !== "" && name !== "nothing");
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total <= 0) return [];

    return entries
        .map(([name, value]) => ({ name, pct: Math.round((value / total) * 1000) / 10 }))
        .sort((a, b) => b.pct - a.pct);
}

function parseSpreadEntry(rawSpreads) {
    if (!rawSpreads) return null;

    const entries = Object.entries(rawSpreads);
    if (entries.length === 0) return null;

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total <= 0) return null;

    const [topKey, topValue] = entries.sort((a, b) => b[1] - a[1])[0];
    const m = topKey.match(/^([A-Za-z]+):(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)$/);
    if (!m) return null;

    return {
        nature: m[1],
        hp: m[2], atk: m[3], def: m[4], spa: m[5], spd: m[6], spe: m[7],
        pct: Math.round((topValue / total) * 1000) / 10
    };
}

// Tìm species trong object "data" của Smogon (key là tên hiển thị dạng "Landorus-Therian")
function findSpeciesEntry(dataObj, displayName) {
    if (!dataObj) return null;

    if (dataObj[displayName]) return dataObj[displayName];

    const target = displayName.toLowerCase().replace(/\s+/g, "");
    const foundKey = Object.keys(dataObj).find(k => k.toLowerCase().replace(/[\s-]+/g, "") === target);
    return foundKey ? dataObj[foundKey] : null;
}

async function fetchSmogonSpeciesData(displayName, formatKey) {
    const resolved = await resolveSmogonFormat(formatKey);
    if (!resolved) return null;

    const dataObj = await loadSmogonJsonData(resolved.month, resolved.file);
    if (!dataObj) return null;

    // Thử tên gốc, rồi vài biến thể form phổ biến (Mega, form giới tính)
    const candidates = [displayName, `${displayName}-Mega`, `${displayName}-M`, `${displayName}-F`];
    let entry = null;
    let usedName = displayName;

    for (const candidate of candidates) {
        entry = findSpeciesEntry(dataObj, candidate);
        if (entry) {
            usedName = candidate;
            break;
        }
    }

    if (!entry) return null;

    return {
        data: {
            moves: normalizeUsageGroup(entry.Moves),
            items: normalizeUsageGroup(entry.Items),
            abilities: normalizeUsageGroup(entry.Abilities),
            teammates: normalizeUsageGroup(entry.Teammates),
            natureSpread: parseSpreadEntry(entry.Spreads)
        },
        usedName,
        formatFile: resolved.file
    };
}

async function getChampionsResourceName(resource, id) {
    const response = await fetch(`${POKE_API_ROOT}/${resource}/${id}`);
    if (!response.ok) throw new Error(`Unknown ${resource} id: ${id}`);
    const data = await response.json();
    return capitalizeWords(data.name.replace(/-/g, " "));
}

async function getChampionsUsageGroup(resource, entries) {
    const results = await Promise.all((entries || []).map(async entry => {
        try {
            return { name: await getChampionsResourceName(resource, entry.id), pct: Math.round(Number(entry.usage || 0) * 1000) / 10 };
        } catch {
            return null;
        }
    }));
    return results.filter(Boolean).sort((a, b) => b.pct - a.pct);
}

async function fetchChampionsSpeciesData(dexId, formatKey) {
    const formatPath = formatKey === "Singles" ? "singles/" : "";
    const response = await fetch(`${CHAMPIONS_META_BASE}${formatPath}pokemon/${dexId}.json`);
    if (!response.ok) throw new Error("Pokemon Champions meta data is unavailable");
    const payload = await response.json();
    const competitive = payload.competitive || {};
    const [moves, items, abilities, teammates] = await Promise.all([
        getChampionsUsageGroup("move", competitive.moves),
        getChampionsUsageGroup("item", competitive.items),
        getChampionsUsageGroup("ability", competitive.abilities),
        getChampionsUsageGroup("pokemon", competitive.teammates)
    ]);
    return { data: { moves, items, abilities, teammates, natureSpread: null }, formatFile: "Pokemon Champions Ranked Battle Data" };
}


// ========================================
// LOAD & RENDER CHI TIẾT
// ========================================

async function loadPokemonMeta(rawId, pokeApiIdRaw, championsDexId) {

    const showdownId = rawId.toLowerCase().replace(/-/g, "");
    let pokeApiId = (pokeApiIdRaw || rawId).toLowerCase();
    const requestId = ++detailRequestId;

    currentlyLoadedId = rawId;
    currentlyLoadedChampionsId = championsDexId || null;

    detailPanel.innerHTML = `
        <div class="meta-loading">
            🔄 Đang tải dữ liệu cho "<strong>${showdownId}</strong>"...
        </div>
    `;

    try {

        const pokeRes = await fetch(`${POKE_API_BASE}/${pokeApiId}`);
        let pokeData = pokeRes.ok ? await pokeRes.json() : null;

        // Một số loài chỉ tồn tại dưới dạng form theo giới tính trên PokeAPI
        // (vd: Basculegion không có "basculegion" trơn, chỉ có -male/-female)
        if (!pokeData) {
            const fallbackRes = await fetch(`${POKE_API_BASE}/${pokeApiId}-male`).catch(() => null);
            if (fallbackRes && fallbackRes.ok) pokeData = await fallbackRes.json();
        }

        const displayNameForSmogon = capitalizeWords((pokeData?.name || showdownId).replace(/-/g, " "));
        if (!pokeData) throw new Error("Pokemon was not found");

        const result = await fetchChampionsSpeciesData(championsDexId || pokeData.id, currentFormat);

        if (requestId !== detailRequestId) return;
        if (!result) {
            renderPokemonFallbackMeta(pokeData);
            return;
        }

        if (!result) {
            throw new Error("Không tìm thấy dữ liệu trên Smogon cho Pokémon này ở chế độ " + currentFormat);
        }

        // Nếu đã tự chuyển sang tên form khác (vd: -Mega), cập nhật lại sprite cho đúng
        if (result.usedName && result.usedName !== displayNameForSmogon) {
            const altSlug = result.usedName.toLowerCase().replace(/\s+/g, "-");
            const altPokeRes = await fetch(`${POKE_API_BASE}/${altSlug}`).catch(() => null);
            if (altPokeRes && altPokeRes.ok) {
                pokeData = await altPokeRes.json();
            }
        }

        if (requestId !== detailRequestId) return;
        renderPokemonMeta(result.data, pokeData, result.usedName && result.usedName !== displayNameForSmogon ? result.usedName : null, result.formatFile);

    } catch (error) {

        if (requestId !== detailRequestId) return;

        console.error(error);

        detailPanel.innerHTML = `
            <div class="meta-error">
                ❌ Không thể tải dữ liệu cho "<strong>${showdownId}</strong>" ở chế độ ${currentFormat}.
                <br>
                Có thể tên chưa đúng, Pokémon này chưa đủ lượt đấu để có thống kê trên Smogon,
                hoặc request tới smogon.com bị chặn (mở Console — F12 — để xem lỗi chi tiết).
            </div>
        `;

    }
}

function renderPokemonFallbackMeta(pokeData) {
    const displayName = capitalizeWords(pokeData.name.replace(/-/g, " "));
    const spriteUrl = pokeData.sprites?.other?.["official-artwork"]?.front_default || pokeData.sprites?.front_default || "";
    const types = pokeData.types?.map(t => t.type.name) || [];
    const abilities = (pokeData.abilities || []).map(entry => `${capitalizeWords(entry.ability.name.replace(/-/g, " "))}${entry.is_hidden ? " (Hidden)" : ""}`);
    const moves = (pokeData.moves || []).map(entry => capitalizeWords(entry.move.name.replace(/-/g, " "))).sort((a, b) => a.localeCompare(b));
    const stats = (pokeData.stats || []).map(entry => ({
        name: entry.stat.name === "special-attack" ? "Sp. Atk" : entry.stat.name === "special-defense" ? "Sp. Def" : capitalizeWords(entry.stat.name.replace(/-/g, " ")),
        value: entry.base_stat
    }));

    detailPanel.innerHTML = `
        <div class="meta-note">Usage stats from Smogon are temporarily unavailable. Showing accurate Pok&eacute;API v2 data instead.</div>
        <div class="meta-detail-header">
            <div class="meta-sprite-wrap">${spriteUrl ? `<img class="meta-sprite" src="${spriteUrl}" alt="${displayName}">` : `<div class="meta-sprite meta-sprite-fallback">&#9679;</div>`}</div>
            <div class="meta-detail-info">
                <h3>${displayName}</h3>
                <div class="meta-detail-types">${types.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join("")}</div>
                <p class="meta-detail-format">Pok&eacute;dex #${String(pokeData.id).padStart(3, "0")} &middot; Mode: <strong>${currentFormat}</strong></p>
            </div>
        </div>
        ${renderFallbackListSection("ABILITIES", abilities)}
        ${renderFallbackListSection("MOVES IT CAN LEARN", moves)}
        ${renderBaseStatsSection(stats)}
    `;
}

function renderFallbackListSection(label, items) {
    if (!items.length) return "";
    return `<div class="meta-section"><h4 class="card-title">${label}</h4><div class="usage-list">${items.slice(0, 8).map((item, index) => `<div class="usage-row"><span class="usage-rank">#${index + 1}</span><span class="usage-name">${item}</span></div>`).join("")}</div></div>`;
}

function renderBaseStatsSection(stats) {
    if (!stats.length) return "";
    return `<div class="meta-section"><h4 class="card-title">BASE STATS</h4><div class="usage-list">${stats.map(stat => `<div class="usage-row"><span class="usage-name">${stat.name}</span><span class="usage-bar-bg"><span class="usage-bar" style="width:${Math.min(stat.value / 2, 100)}%;"></span></span><span class="usage-pct">${stat.value}</span></div>`).join("")}</div></div>`;
}

function renderPokemonMeta(smogonData, pokeData, switchedToName, formatFile) {

    const displayName = pokeData?.name ? capitalizeWords(pokeData.name.replace(/-/g, " ")) : "—";

    const spriteUrl =
        pokeData?.sprites?.other?.["official-artwork"]?.front_default ||
        pokeData?.sprites?.front_default ||
        "";

    const types = pokeData?.types?.map(t => t.type.name) || [];

    const noteHtml = switchedToName
        ? `
            <div class="meta-note">
                ✅ Đã tự động dùng dữ liệu form <strong>${switchedToName}</strong>.
            </div>
        `
        : "";

    let html = `
        ${noteHtml}
        <div class="meta-detail-header">
            <div class="meta-sprite-wrap">
                ${spriteUrl
                    ? `<img class="meta-sprite" src="${spriteUrl}" alt="${displayName}">`
                    : `<div class="meta-sprite meta-sprite-fallback">●</div>`
                }
            </div>
            <div class="meta-detail-info">
                <h3>${displayName}</h3>
                <div class="meta-detail-types">
                    ${types.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join("")}
                </div>
                <p class="meta-detail-format">Chế độ: <strong>${currentFormat}</strong>${formatFile ? ` · <span class="meta-format-file">${formatFile.replace(".json", "")}</span>` : ""}</p>
            </div>
        </div>
    `;

    html += renderPikaUsageSection("move", smogonData.moves);
    html += renderPikaUsageSection("item", smogonData.items);
    html += renderPikaUsageSection("teammate", smogonData.teammates);
    html += renderPikaUsageSection("ability", smogonData.abilities);
    html += renderNatureSpreadSection(smogonData.natureSpread);

    detailPanel.innerHTML = html;
}

function renderPikaUsageSection(category, items) {
    if (!items || items.length === 0) return "";

    const label = CATEGORY_LABEL_VI[category] || category.toUpperCase();

    const rowsHtml = items
        .slice(0, 8)
        .map((item, index) => `
            <div class="usage-row">
                <span class="usage-rank">#${index + 1}</span>
                <span class="usage-name">${capitalizeWords(item.name)}</span>
                <span class="usage-bar-bg">
                    <span class="usage-bar" style="width:${Math.min(item.pct, 100)}%;"></span>
                </span>
                <span class="usage-pct">${item.pct}%</span>
            </div>
        `)
        .join("");

    return `
        <div class="meta-section">
            <h4 class="card-title">${label}</h4>
            <div class="usage-list">${rowsHtml}</div>
        </div>
    `;
}

function renderNatureSpreadSection(spread) {
    if (!spread) return "";

    return `
        <div class="meta-section">
            <h4 class="card-title">BẢN CHẤT &amp; EV PHỔ BIẾN NHẤT</h4>
            <div class="ev-spread-list">
                <div class="ev-spread-item">
                    <span class="ev-spread-pct">${spread.pct}%</span>
                    <span class="ev-spread-values">
                        <strong>${spread.nature}</strong> —
                        HP ${spread.hp} · ATK ${spread.atk} · DEF ${spread.def} ·
                        SPA ${spread.spa} · SPD ${spread.spd} · SPE ${spread.spe}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function capitalizeWords(str) {
    if (!str) return "—";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}


// ========================================
// INIT
// ========================================

renderTypeFilter();
renderRankGrid();

const urlParams = new URLSearchParams(window.location.search);
const paramFormat = urlParams.get("format");
const paramPokemon = urlParams.get("pokemon");

if (paramFormat === "Singles" || paramFormat === "Doubles") {
    currentFormat = paramFormat;
    formatToggle.querySelectorAll(".format-toggle-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.format === currentFormat);
    });
    renderRankGrid();
}

if (paramPokemon) {
    loadPokemonMeta(paramPokemon.toLowerCase().trim());
    window.addEventListener("load", () => {
        detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

refreshChampionsRankings();
