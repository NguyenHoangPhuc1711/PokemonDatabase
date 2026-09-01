// ========================================
// TRAINER CARD — thẻ hồ sơ kiểu game (lấy cảm hứng từ profile card Liên Quân)
// Avatar tròn (ảnh thật hoặc sprite Pokémon) + khung trang trí tuỳ chọn,
// tên + danh hiệu, và 1 Pokémon đồng hành làm ảnh nền lớn, rõ nét.
// Toàn bộ chạy client-side bằng Canvas, không cần AI / server.
// ========================================

const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
const PORTRAIT_W = 1080, PORTRAIT_H = 1920;
const LANDSCAPE_W = 1920, LANDSCAPE_H = 1080;
let CANVAS_W = PORTRAIT_W;
let CANVAS_H = PORTRAIT_H;

const TYPE_COLORS = {
    normal: "#a9a9a9", fire: "#e0653f", water: "#4a8fe0", electric: "#dcb52c",
    grass: "#48ad58", ice: "#63c1c1", fighting: "#c2483c", poison: "#9955bf",
    ground: "#c49f4e", flying: "#94a6dd", psychic: "#e0618a", bug: "#84a83a",
    rock: "#98865a", ghost: "#6d5fa0", dragon: "#665fc4", dark: "#5c5450",
    steel: "#8b93a3", fairy: "#df8cba"
};

const DEFAULT_ACCENT = "#ef4444";

const TAG_PRESETS = [
    "VGC Player", "Shiny Hunter", "Master Ball Tier",
    "Elite Trainer", "Gym Leader", "Nhà Vô Địch"
];


// ========================================
// DOM
// ========================================

const formatRow = document.getElementById("tc-format-row");
const canvasFrame = document.getElementById("tc-canvas-frame");
const safeZoneTop = document.getElementById("tc-safe-zone-top");
const safeZoneBottom = document.getElementById("tc-safe-zone-bottom");
const previewNote = document.getElementById("tc-preview-note");
const previewCloseBtn = document.getElementById("tc-preview-close-btn");
const tcLayout = document.querySelector(".tc-layout");

const avatarModeRow = document.getElementById("tc-avatar-mode-row");
const photoModeBlock = document.getElementById("tc-photo-mode-block");
const spriteModeBlock = document.getElementById("tc-sprite-mode-block");

const photoInput = document.getElementById("tc-photo-input");
const photoAdjustPanel = document.getElementById("tc-photo-adjust");
const cropBox = document.getElementById("tc-crop-box");
const cropImg = document.getElementById("tc-crop-img");
const zoomSlider = document.getElementById("tc-zoom-slider");
const photoClearBtn = document.getElementById("tc-photo-clear");

const avatarSpriteInput = document.getElementById("tc-avatar-sprite-input");
const avatarSpriteSuggestions = document.getElementById("tc-avatar-sprite-suggestions");
const avatarSpritePreview = document.getElementById("tc-avatar-sprite-preview");
const avatarSpriteImgEl = document.getElementById("tc-avatar-sprite-img");
const avatarSpriteNameEl = document.getElementById("tc-avatar-sprite-name");
const avatarSpriteRemoveBtn = document.getElementById("tc-avatar-sprite-remove");

const heroInput = document.getElementById("tc-hero-input");
const heroSuggestions = document.getElementById("tc-hero-suggestions");
const heroRandomBtn = document.getElementById("tc-hero-random-btn");
const heroPreview = document.getElementById("tc-hero-preview");
const heroImgEl = document.getElementById("tc-hero-img");
const heroNameEl = document.getElementById("tc-hero-name");
const heroShinyBtn = document.getElementById("tc-hero-shiny-btn");
const heroRemoveBtn = document.getElementById("tc-hero-remove");

const teamInput = document.getElementById("tc-team-input");
const teamSuggestions = document.getElementById("tc-team-suggestions");
const teamChipsBox = document.getElementById("tc-team-chips");
const teamCountEl = document.getElementById("tc-team-count");

const frameGrid = document.getElementById("tc-frame-grid");
const rankSelect = document.getElementById("tc-rank-select");

const nameInput = document.getElementById("tc-name-input");
const tagInput = document.getElementById("tc-tag-input");
const tagChipsBox = document.getElementById("tc-tag-chips");

const themeRow = document.getElementById("tc-theme-row");
const generateBtn = document.getElementById("tc-generate-btn");
const downloadBtn = document.getElementById("tc-download-btn");

const canvas = document.getElementById("tc-canvas");
const ctx = canvas.getContext("2d");


// ========================================
// STATE
// ========================================

let avatarMode = "photo";      // "photo" | "sprite"

let uploadedPhoto = null;      // HTMLImageElement
let photoNaturalW = 0, photoNaturalH = 0;
let photoZoom = 1;
let photoPanX = 0;
let photoPanY = 0;
let isDraggingPhoto = false;
let dragStartX = 0, dragStartY = 0, dragStartPanX = 0, dragStartPanY = 0;

let avatarSprite = null;       // { name, url }

let heroPokemon = null;        // { name, spriteNormal, spriteShiny, shiny, types: [] }
let teamMembers = [];          // tối đa 5, [{ name, url, types }]

let frameStyle = "pokeball";   // pokeball | neon | metal-gold | metal-silver | fireice | carbon | holo | electric
let rankTier = "none";         // none | beginner | pokeball | greatball | ultraball | masterball | champion
let rankSub = null;            // 4..1 hoặc null (Beginner/Champion không có hạng phụ)
let themeMode = "auto";        // "auto" | "fixed"
let cardFormat = "portrait";   // "portrait" (Story 9:16) | "landscape" (Trainer Card 16:9)

let pokemonNameList = null;
let pokemonNameListPromise = null;
const pokemonDataCache = new Map();


// ========================================
// TẢI DANH SÁCH TÊN POKÉMON (1 lần, dùng để autocomplete local)
// ========================================

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
        .catch(() => { pokemonNameList = []; return pokemonNameList; });
    return pokemonNameListPromise;
}
loadPokemonNameList();

function spriteArtUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function spriteIconUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function capitalizeWords(str) {
    return str.toLowerCase().split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function currentHeroArt(poke) {
    return poke.shiny && poke.spriteShiny ? poke.spriteShiny : poke.spriteNormal;
}

async function fetchPokemonData(name) {
    let data = pokemonDataCache.get(name);
    if (data) return data;
    try {
        const res = await fetch(`${POKE_API_BASE}/${name}`);
        if (!res.ok) return null;
        data = await res.json();
        pokemonDataCache.set(name, data);
        return data;
    } catch {
        return null;
    }
}

function buildSuggestionList(box, query, onPick) {
    if (query.length < 2 || !pokemonNameList) { box.classList.remove("active"); box.innerHTML = ""; return; }
    const matches = pokemonNameList.filter(p => p.name.startsWith(query)).slice(0, 6);
    if (matches.length === 0) { box.classList.remove("active"); box.innerHTML = ""; return; }

    box.innerHTML = matches.map(p => `
        <div class="tc-suggestion-item" data-name="${p.name}" data-id="${p.id}">
            <img src="${spriteIconUrl(p.id)}" alt="${p.name}" loading="lazy">
            <span>${capitalizeWords(p.name)}</span>
        </div>
    `).join("");
    box.classList.add("active");
    box.onclick = event => {
        const item = event.target.closest(".tc-suggestion-item");
        if (!item) return;
        onPick(item.dataset.name, item.dataset.id);
        box.classList.remove("active");
        box.innerHTML = "";
    };
}


// ========================================
// AVATAR MODE (ảnh thật / sprite)
// ========================================

avatarModeRow.addEventListener("click", event => {
    const btn = event.target.closest(".tc-mode-btn");
    if (!btn) return;
    avatarMode = btn.dataset.mode;
    avatarModeRow.querySelectorAll(".tc-mode-btn").forEach(b => b.classList.toggle("active", b === btn));
    photoModeBlock.style.display = avatarMode === "photo" ? "block" : "none";
    spriteModeBlock.style.display = avatarMode === "sprite" ? "block" : "none";
});


// ========================================
// AVATAR SPRITE (chọn 1 Pokémon làm avatar)
// ========================================

avatarSpriteInput.addEventListener("input", () => {
    buildSuggestionList(avatarSpriteSuggestions, avatarSpriteInput.value.trim().toLowerCase(), (name, id) => {
        avatarSprite = { name, url: spriteIconUrl(id) };
        avatarSpriteImgEl.src = avatarSprite.url;
        avatarSpriteNameEl.textContent = capitalizeWords(name);
        avatarSpritePreview.classList.add("active");
        avatarSpriteInput.value = "";
    });
});

document.addEventListener("click", event => {
    if (!event.target.closest(".tc-search-wrap")) {
        avatarSpriteSuggestions.classList.remove("active");
        heroSuggestions.classList.remove("active");
        teamSuggestions.classList.remove("active");
    }
});

avatarSpriteRemoveBtn.addEventListener("click", () => {
    avatarSprite = null;
    avatarSpritePreview.classList.remove("active");
});


// ========================================
// HERO POKÉMON (1 Pokémon duy nhất — ảnh nền lớn)
// ========================================

async function setHeroPokemon(name) {
    const data = await fetchPokemonData(name);
    if (!data) return;

    heroPokemon = {
        name: data.name,
        spriteNormal: data.sprites?.other?.["official-artwork"]?.front_default || spriteArtUrl(data.id),
        spriteShiny: data.sprites?.other?.["official-artwork"]?.front_shiny || null,
        shiny: false,
        types: data.types.map(t => t.type.name),
        stats: Object.fromEntries(data.stats.map(s => [s.stat.name, s.base_stat]))
    };
    renderHeroPreview();
}

function renderHeroPreview() {
    if (!heroPokemon) {
        heroPreview.classList.remove("active");
        return;
    }
    heroImgEl.src = currentHeroArt(heroPokemon);
    heroNameEl.textContent = capitalizeWords(heroPokemon.name);
    heroShinyBtn.classList.toggle("active", heroPokemon.shiny);
    heroShinyBtn.disabled = !heroPokemon.spriteShiny;
    heroPreview.classList.add("active");
}

heroInput.addEventListener("input", () => {
    buildSuggestionList(heroSuggestions, heroInput.value.trim().toLowerCase(), (name) => {
        setHeroPokemon(name);
        heroInput.value = "";
    });
});

heroRandomBtn.addEventListener("click", async () => {
    await loadPokemonNameList();
    if (!pokemonNameList || pokemonNameList.length === 0) return;
    const pool = pokemonNameList.filter(p => !p.name.includes("-"));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    await setHeroPokemon(pick.name);
});

heroShinyBtn.addEventListener("click", () => {
    if (!heroPokemon || !heroPokemon.spriteShiny) return;
    heroPokemon.shiny = !heroPokemon.shiny;
    renderHeroPreview();
});

heroRemoveBtn.addEventListener("click", () => {
    heroPokemon = null;
    renderHeroPreview();
});


// ========================================
// ĐỘI HÌNH PHỤ (Ô 1: Hero Pokemon auto-set, Ô 2-6: 5 Companion Pokemon tối đa — hiện thành 2 hàng x 3 cột trong landscape)
// ========================================

async function addTeamMember(name) {
    // Limit 5 companion Pokemon (not counting hero)
    if (teamMembers.length >= 5) return;
    if (teamMembers.some(p => p.name === name)) return;
    if (heroPokemon && heroPokemon.name === name) return;

    const data = await fetchPokemonData(name);
    if (!data) return;

    teamMembers.push({
        name: data.name,
        url: data.sprites?.other?.["official-artwork"]?.front_default || spriteArtUrl(data.id),
        types: data.types.map(t => t.type.name)
    });
    
    // Auto-set first team member as hero if no hero exists
    if (!heroPokemon && teamMembers.length === 1) {
        await setHeroPokemon(data.name);
    }
    
    renderTeamChips();
}

function removeTeamMember(name) {
    teamMembers = teamMembers.filter(p => p.name !== name);
    renderTeamChips();
}

function renderTeamChips() {
    teamCountEl.textContent = `${teamMembers.length}/5`;
    teamChipsBox.innerHTML = teamMembers.map(p => `
        <div class="tc-chip">
            <img src="${p.url}" alt="${p.name}">
            <span>${capitalizeWords(p.name)}</span>
            <button class="tc-chip-remove" type="button" data-team-remove="${p.name}" aria-label="Xoá">✕</button>
        </div>
    `).join("");
}

teamInput.addEventListener("input", () => {
    buildSuggestionList(teamSuggestions, teamInput.value.trim().toLowerCase(), (name) => {
        addTeamMember(name);
        teamInput.value = "";
    });
});

teamChipsBox.addEventListener("click", event => {
    const btn = event.target.closest("[data-team-remove]");
    if (!btn) return;
    removeTeamMember(btn.dataset.teamRemove);
});


// ========================================
// KHUNG AVATAR (frame)
// ========================================

frameGrid.addEventListener("click", event => {
    const btn = event.target.closest(".tc-frame-btn");
    if (!btn) return;
    frameStyle = btn.dataset.frame;
    frameGrid.querySelectorAll(".tc-frame-btn").forEach(b => b.classList.toggle("active", b === btn));
});


// ========================================
// BẬC RANK (Pokémon Champions)
// ========================================

rankSelect.addEventListener("change", () => {
    const [tier, sub] = rankSelect.value.split(":");
    rankTier = tier;
    rankSub = sub ? Number(sub) : null;
});


// ========================================
// TÊN & DANH HIỆU
// ========================================

tagChipsBox.innerHTML = TAG_PRESETS.map(tag => `<button class="tc-tag-chip" type="button" data-tag="${tag}">${tag}</button>`).join("");

tagChipsBox.addEventListener("click", event => {
    const chip = event.target.closest(".tc-tag-chip");
    if (!chip) return;
    tagInput.value = chip.dataset.tag;
    tagChipsBox.querySelectorAll(".tc-tag-chip").forEach(c => c.classList.toggle("active", c === chip));
});

tagInput.addEventListener("input", () => {
    tagChipsBox.querySelectorAll(".tc-tag-chip").forEach(c => c.classList.toggle("active", c.dataset.tag === tagInput.value));
});


// ========================================
// ẢNH NGƯỜI CHƠI — KÉO ĐỂ CANH VỊ TRÍ + ZOOM (chế độ Ảnh thật)
// ========================================

photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            uploadedPhoto = img;
            photoNaturalW = img.width;
            photoNaturalH = img.height;
            photoZoom = 1;
            photoPanX = 0;
            photoPanY = 0;
            zoomSlider.value = 100;
            cropImg.src = reader.result;
            photoAdjustPanel.style.display = "block";
            updateCropPreview();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

photoClearBtn.addEventListener("click", () => {
    uploadedPhoto = null;
    photoInput.value = "";
    photoAdjustPanel.style.display = "none";
});

zoomSlider.addEventListener("input", () => {
    photoZoom = Number(zoomSlider.value) / 100;
    updateCropPreview();
});

function getPhotoGeometry(boxSize) {
    const coverScale = Math.max(boxSize / photoNaturalW, boxSize / photoNaturalH);
    const scale = coverScale * photoZoom;
    const dw = photoNaturalW * scale;
    const dh = photoNaturalH * scale;
    return {
        dw, dh,
        maxOffX: Math.max(0, (dw - boxSize) / 2),
        maxOffY: Math.max(0, (dh - boxSize) / 2)
    };
}

function updateCropPreview() {
    if (!uploadedPhoto) return;
    const boxSize = cropBox.clientWidth;
    const { dw, dh, maxOffX, maxOffY } = getPhotoGeometry(boxSize);
    const offX = photoPanX * maxOffX;
    const offY = photoPanY * maxOffY;
    cropImg.style.width = `${dw}px`;
    cropImg.style.height = `${dh}px`;
    cropImg.style.left = `${boxSize / 2 - dw / 2 + offX}px`;
    cropImg.style.top = `${boxSize / 2 - dh / 2 + offY}px`;
}

cropBox.addEventListener("pointerdown", event => {
    if (!uploadedPhoto) return;
    isDraggingPhoto = true;
    cropBox.setPointerCapture(event.pointerId);
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartPanX = photoPanX;
    dragStartPanY = photoPanY;
});

cropBox.addEventListener("pointermove", event => {
    if (!isDraggingPhoto || !uploadedPhoto) return;
    const boxSize = cropBox.clientWidth;
    const { maxOffX, maxOffY } = getPhotoGeometry(boxSize);
    const dxClient = event.clientX - dragStartX;
    const dyClient = event.clientY - dragStartY;
    photoPanX = maxOffX > 0 ? Math.min(1, Math.max(-1, dragStartPanX + dxClient / maxOffX)) : 0;
    photoPanY = maxOffY > 0 ? Math.min(1, Math.max(-1, dragStartPanY + dyClient / maxOffY)) : 0;
    updateCropPreview();
});

function stopDragging() { isDraggingPhoto = false; }
cropBox.addEventListener("pointerup", stopDragging);
cropBox.addEventListener("pointercancel", stopDragging);
window.addEventListener("pointerup", stopDragging);


// ========================================
// TÔNG MÀU
// ========================================

themeRow.addEventListener("click", event => {
    const btn = event.target.closest(".tc-theme-btn");
    if (!btn) return;
    themeMode = btn.dataset.theme;
    themeRow.querySelectorAll(".tc-theme-btn").forEach(b => b.classList.toggle("active", b === btn));
});

function getAccentColor() {
    if (themeMode === "fixed") return DEFAULT_ACCENT;
    const firstType = heroPokemon?.types?.[0];
    return TYPE_COLORS[firstType] || DEFAULT_ACCENT;
}


// ========================================
// ĐỊNH DẠNG ẢNH (dọc Story / ngang Trainer Card)
// ========================================

function updatePreviewNoteText() {
    if (!previewNote) return;
    const language = localStorage.getItem("pokemon-information-language") || "vi";
    const baseText = cardFormat === "landscape"
        ? "Định dạng ngang — hợp để đăng làm ảnh bìa, wallpaper, hoặc chia sẻ trên Twitter/X, Discord."
        : "Vùng mờ trên/dưới là nơi giao diện Story hay che mất — ảnh tải về vẫn đầy đủ, không bị mờ.";
    previewNote.textContent = typeof translateText === "function" ? translateText(baseText, language) : baseText;
}

function applyCardFormat() {
    if (cardFormat === "landscape") {
        CANVAS_W = LANDSCAPE_W;
        CANVAS_H = LANDSCAPE_H;
        canvasFrame.style.aspectRatio = "16 / 9";
        safeZoneTop.style.display = "none";
        safeZoneBottom.style.display = "none";
        downloadBtn.textContent = "⬇️ Tải ảnh (1920×1080)";
    } else {
        CANVAS_W = PORTRAIT_W;
        CANVAS_H = PORTRAIT_H;
        canvasFrame.style.aspectRatio = "9 / 16";
        safeZoneTop.style.display = "";
        safeZoneBottom.style.display = "";
        downloadBtn.textContent = "⬇️ Tải ảnh (1080×1920)";
    }
    updatePreviewNoteText();
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
}

window.addEventListener("languagechanged", updatePreviewNoteText);

formatRow.addEventListener("click", event => {
    const btn = event.target.closest(".tc-mode-btn");
    if (!btn) return;
    cardFormat = btn.dataset.format;
    formatRow.querySelectorAll(".tc-mode-btn").forEach(b => b.classList.toggle("active", b === btn));
    applyCardFormat();
    renderCard();
});


// ========================================
// TIỆN ÍCH MÀU SẮC
// ========================================

function hexToRgba(hex, alpha) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeColor(hex, percent) {
    const n = parseInt(hex.replace("#", ""), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.max(0, Math.round(r + (percent >= 0 ? (255 - r) : r) * (percent / 100))));
    g = Math.min(255, Math.max(0, Math.round(g + (percent >= 0 ? (255 - g) : g) * (percent / 100))));
    b = Math.min(255, Math.max(0, Math.round(b + (percent >= 0 ? (255 - b) : b) * (percent / 100))));
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) { h = 0; s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getSecondaryColor(accentHex) {
    const hsl = hexToHsl(accentHex);
    return hslToHex(hsl.h + 150, Math.min(1, hsl.s + 0.1), Math.min(0.55, Math.max(0.32, hsl.l)));
}


// ========================================
// TIỆN ÍCH VẼ HÌNH CHUNG
// ========================================

function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
}

function loadImageAsync(url) {
    return new Promise(resolve => {
        if (!url) { resolve(null); return; }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

function drawPokeballIcon(context, cx, cy, r) {
    context.save();
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = "#ef4444";
    context.fillRect(cx - r, cy - r, r * 2, r);
    context.fillStyle = "#f8fafc";
    context.fillRect(cx - r, cy, r * 2, r);
    context.restore();

    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2);
    context.lineWidth = r * 0.16; context.strokeStyle = "#11151d"; context.stroke();

    context.beginPath(); context.moveTo(cx - r, cy); context.lineTo(cx + r, cy);
    context.lineWidth = r * 0.14; context.strokeStyle = "#11151d"; context.stroke();

    context.beginPath(); context.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    context.fillStyle = "#f8fafc"; context.fill();
    context.lineWidth = r * 0.12; context.strokeStyle = "#11151d"; context.stroke();
}

function drawSparkle(context, cx, cy, r, color, alpha = 1) {
    context.save();
    context.globalAlpha = alpha;
    context.translate(cx, cy);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, -r);
    context.bezierCurveTo(r * 0.18, -r * 0.18, r * 0.18, -r * 0.18, r, 0);
    context.bezierCurveTo(r * 0.18, r * 0.18, r * 0.18, r * 0.18, 0, r);
    context.bezierCurveTo(-r * 0.18, r * 0.18, -r * 0.18, r * 0.18, -r, 0);
    context.bezierCurveTo(-r * 0.18, -r * 0.18, -r * 0.18, -r * 0.18, 0, -r);
    context.closePath();
    context.fill();
    context.beginPath();
    context.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,0.9)";
    context.fill();
    context.restore();
}

function drawScatteredSparkles(context, count, colorA, colorB, avoidCx, avoidCy, avoidR) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * CANVAS_W;
        const y = Math.random() * (CANVAS_H - 260);
        const dx = x - avoidCx, dy = y - avoidCy;
        if (Math.sqrt(dx * dx + dy * dy) < avoidR) continue;
        const size = 4 + Math.random() * 15;
        const alpha = 0.15 + Math.random() * 0.35;
        const color = Math.random() > 0.5 ? colorA : (Math.random() > 0.5 ? colorB : "#ffffff");
        drawSparkle(context, x, y, size, color, alpha);
    }
}

function drawLightRays(context, cx, cy, colorA, colorB, rayCount = 14) {
    context.save();
    context.globalCompositeOperation = "lighter";
    for (let i = 0; i < rayCount; i++) {
        const angle = ((Math.PI * 2) / rayCount) * i;
        context.save();
        context.translate(cx, cy);
        context.rotate(angle);
        const grad = context.createLinearGradient(0, 0, 0, -1500);
        const color = i % 2 === 0 ? colorA : colorB;
        grad.addColorStop(0, hexToRgba(color, 0.12));
        grad.addColorStop(1, hexToRgba(color, 0));
        context.fillStyle = grad;
        context.beginPath();
        context.moveTo(-40, 0);
        context.lineTo(40, 0);
        context.lineTo(6, -1500);
        context.lineTo(-6, -1500);
        context.closePath();
        context.fill();
        context.restore();
    }
    context.restore();
}

function drawVignette(context) {
    const grad = context.createRadialGradient(
        CANVAS_W / 2, CANVAS_H * 0.4, CANVAS_H * 0.3,
        CANVAS_W / 2, CANVAS_H * 0.4, CANVAS_H * 0.85
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.45)");
    context.fillStyle = grad;
    context.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawPill(context, cx, cy, text, bgColor, textColor, fontSize) {
    context.font = `800 ${fontSize}px Arial`;
    const padX = 16;
    const w = context.measureText(text).width + padX * 2;
    const h = fontSize + 18;
    context.save();
    context.shadowColor = "rgba(0,0,0,0.45)";
    context.shadowBlur = 10;
    roundRect(context, cx - w / 2, cy - h / 2, w, h, h / 2);
    context.fillStyle = bgColor;
    context.fill();
    context.restore();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,255,255,0.4)";
    roundRect(context, cx - w / 2, cy - h / 2, w, h, h / 2);
    context.stroke();
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, cx, cy + 1);
    return { w, h };
}

const STAT_LABELS_VI = { hp: "HP", attack: "ATK", defense: "DEF", "special-attack": "SPA", "special-defense": "SPD", speed: "SPE" };
const STAT_ORDER = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

// Thanh chỉ số cơ bản kiểu Pokédex — dùng để lấp phần trống giữa thông tin Trainer và ảnh Pokémon
function drawStatRow(context, x, y, w, label, value, maxScale, color) {
    context.textBaseline = "alphabetic";
    context.font = "700 16px Arial";
    context.fillStyle = "#9aa1b0";
    context.textAlign = "left";
    context.fillText(label, x, y);

    context.font = "800 17px Arial";
    context.fillStyle = "#ffffff";
    context.textAlign = "right";
    context.fillText(String(value), x + w, y);

    const trackY = y + 10;
    roundRect(context, x, trackY, w, 10, 5);
    context.fillStyle = "rgba(255,255,255,0.1)";
    context.fill();

    const ratio = Math.min(1, value / maxScale);
    if (ratio > 0) {
        context.save();
        roundRect(context, x, trackY, w, 10, 5);
        context.clip();
        roundRect(context, x, trackY, w * ratio, 10, 5);
        const grad = context.createLinearGradient(x, trackY, x + w, trackY);
        grad.addColorStop(0, shadeColor(color, -10));
        grad.addColorStop(1, shadeColor(color, 30));
        context.fillStyle = grad;
        context.fill();
        context.restore();
    }
}


// ========================================
// KHUNG AVATAR — 5 KIỂU TRANG TRÍ
// ========================================

function drawFramePokeball(context, cx, cy, r) {
    const ringW = 16;
    context.save();
    context.lineWidth = ringW;
    context.beginPath(); context.arc(cx, cy, r, Math.PI, Math.PI * 2); context.strokeStyle = "#ef4444"; context.stroke();
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI); context.strokeStyle = "#f5f7fa"; context.stroke();
    context.lineWidth = 4;
    context.beginPath(); context.arc(cx, cy, r + ringW / 2, 0, Math.PI * 2); context.strokeStyle = "#11151d"; context.stroke();
    context.beginPath(); context.arc(cx, cy, r - ringW / 2, 0, Math.PI * 2); context.strokeStyle = "#11151d"; context.stroke();
    // đường phân cách đỏ/trắng — chỉ vẽ trong phần viền, KHÔNG cắt ngang qua ảnh ở giữa
    context.beginPath();
    context.moveTo(cx - r - ringW / 2, cy); context.lineTo(cx - r + ringW / 2, cy);
    context.moveTo(cx + r - ringW / 2, cy); context.lineTo(cx + r + ringW / 2, cy);
    context.lineWidth = 4; context.strokeStyle = "#11151d"; context.stroke();
    context.beginPath(); context.arc(cx + r, cy, 15, 0, Math.PI * 2); context.fillStyle = "#f5f7fa"; context.fill();
    context.lineWidth = 4; context.strokeStyle = "#11151d"; context.stroke();
    context.beginPath(); context.arc(cx + r, cy, 6, 0, Math.PI * 2); context.fillStyle = "#dbe1ea"; context.fill();
    context.lineWidth = 2; context.strokeStyle = "#11151d"; context.stroke();
    context.restore();
}

function drawFrameNeon(context, cx, cy, r) {
    context.save();
    context.shadowColor = "#22d3ee"; context.shadowBlur = 22;
    context.lineWidth = 6; context.strokeStyle = "#22d3ee";
    context.beginPath(); context.arc(cx, cy, r + 14, 0, Math.PI * 2); context.stroke();
    context.shadowBlur = 0;
    context.shadowColor = "#e879f9"; context.shadowBlur = 16;
    context.lineWidth = 4; context.strokeStyle = "#e879f9";
    context.beginPath(); context.arc(cx, cy, r + 4, 0, Math.PI * 2); context.stroke();
    context.shadowBlur = 0;
    for (let i = 0; i < 12; i++) {
        const angle = ((Math.PI * 2) / 12) * i;
        const x1 = cx + Math.cos(angle) * (r + 22), y1 = cy + Math.sin(angle) * (r + 22);
        const x2 = cx + Math.cos(angle) * (r + 34), y2 = cy + Math.sin(angle) * (r + 34);
        context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2);
        context.lineWidth = 3;
        context.strokeStyle = i % 3 === 0 ? "#22d3ee" : "#e879f9";
        context.stroke();
    }
    context.restore();
}

function drawFrameMetal(context, cx, cy, r, tone) {
    const colors = tone === "gold"
        ? ["#fff3c4", "#d4af37", "#8a6b12", "#f5d382"]
        : ["#f3f6fa", "#c0c9d6", "#6b7688", "#e2e8f0"];
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.35, colors[1]);
    grad.addColorStop(0.65, colors[2]);
    grad.addColorStop(1, colors[3]);
    context.lineWidth = 16; context.strokeStyle = grad;
    context.beginPath(); context.arc(cx, cy, r + 9, 0, Math.PI * 2); context.stroke();
    context.lineWidth = 5; context.strokeStyle = "rgba(255,255,255,0.65)";
    context.beginPath(); context.arc(cx, cy, r + 9, Math.PI * 1.15, Math.PI * 1.6); context.stroke();
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
        const gx = cx + Math.cos(angle) * (r + 9), gy = cy + Math.sin(angle) * (r + 9);
        context.beginPath(); context.arc(gx, gy, 9, 0, Math.PI * 2);
        context.fillStyle = colors[1]; context.fill();
        context.lineWidth = 2; context.strokeStyle = colors[3]; context.stroke();
    });
    context.restore();
}

function drawFrameFireIce(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx, cy - r, cx, cy + r);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(0.5, "#fde68a");
    grad.addColorStop(1, "#22d3ee");
    context.lineWidth = 14; context.strokeStyle = grad;
    context.beginPath(); context.arc(cx, cy, r + 9, 0, Math.PI * 2); context.stroke();
    for (let i = 0; i < 16; i++) {
        const angle = ((Math.PI * 2) / 16) * i;
        const isTop = Math.sin(angle) < 0;
        const baseR = r + 17;
        const spikeLen = 12 + (i % 3) * 6;
        const x1 = cx + Math.cos(angle) * baseR, y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + spikeLen), y2 = cy + Math.sin(angle) * (baseR + spikeLen);
        context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2);
        context.lineWidth = 3;
        context.strokeStyle = isTop ? "#fb923c" : "#67e8f9";
        context.stroke();
    }
    context.restore();
}

// Carbon Đen — viền sợi carbon bóng, hợp tông nền đen hiện đại
function drawFrameCarbon(context, cx, cy, r) {
    const outer = r + 20, inner = r + 2;
    context.save();
    context.beginPath();
    context.arc(cx, cy, outer, 0, Math.PI * 2);
    context.arc(cx, cy, inner, 0, Math.PI * 2);
    context.clip("evenodd");
    context.fillStyle = "#14161c";
    context.fillRect(cx - outer, cy - outer, outer * 2, outer * 2);
    context.strokeStyle = "rgba(255,255,255,0.09)";
    context.lineWidth = 3;
    for (let i = -8; i <= 8; i++) {
        context.beginPath();
        context.moveTo(cx - outer + i * 12, cy - outer);
        context.lineTo(cx - outer + i * 12 + outer * 2, cy + outer);
        context.stroke();
    }
    context.restore();
    context.beginPath();
    context.arc(cx, cy, outer, 0, Math.PI * 2);
    context.lineWidth = 3;
    context.strokeStyle = "#4b5563";
    context.stroke();
    context.beginPath();
    context.arc(cx, cy, inner, 0, Math.PI * 2);
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,255,255,0.4)";
    context.stroke();
}

// Holographic — viền cầu vồng ánh kim, xoay góc mỗi lần tạo ảnh cho lung linh
function drawFrameHolo(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(0.2, "#facc15");
    grad.addColorStop(0.45, "#4ade80");
    grad.addColorStop(0.65, "#22d3ee");
    grad.addColorStop(0.85, "#a855f7");
    grad.addColorStop(1, "#f97316");
    context.lineWidth = 15;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 4;
    context.strokeStyle = "rgba(255,255,255,0.6)";
    context.beginPath();
    context.arc(cx, cy, r + 9, Math.PI * 1.1, Math.PI * 1.5);
    context.stroke();
    context.restore();
}

// Điện Vàng — viền neon vàng kèm tia sét quanh khung
function drawFrameElectric(context, cx, cy, r) {
    context.save();
    context.shadowColor = "#facc15";
    context.shadowBlur = 24;
    context.lineWidth = 7;
    context.strokeStyle = "#facc15";
    context.beginPath();
    context.arc(cx, cy, r + 10, 0, Math.PI * 2);
    context.stroke();
    context.shadowBlur = 0;
    for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i;
        const baseR = r + 20;
        const bx = cx + Math.cos(angle) * baseR, by = cy + Math.sin(angle) * baseR;
        const midX = cx + Math.cos(angle + 0.12) * (baseR + 10), midY = cy + Math.sin(angle + 0.12) * (baseR + 10);
        const tipX = cx + Math.cos(angle) * (baseR + 22), tipY = cy + Math.sin(angle) * (baseR + 22);
        context.beginPath();
        context.moveTo(bx, by);
        context.lineTo(midX, midY);
        context.lineTo(tipX, tipY);
        context.lineWidth = 3;
        context.strokeStyle = "#fde68a";
        context.stroke();
    }
    context.restore();
}

// Thiên Nhiên — viền xanh lá + lá cây nhỏ quanh khung
function drawFrameNature(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#86efac");
    grad.addColorStop(1, "#15803d");
    context.lineWidth = 13;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    for (let i = 0; i < 10; i++) {
        const angle = ((Math.PI * 2) / 10) * i;
        const bx = cx + Math.cos(angle) * (r + 20), by = cy + Math.sin(angle) * (r + 20);
        context.save();
        context.translate(bx, by);
        context.rotate(angle + Math.PI / 2);
        context.beginPath();
        context.moveTo(0, -11);
        context.quadraticCurveTo(9, 0, 0, 11);
        context.quadraticCurveTo(-9, 0, 0, -11);
        context.fillStyle = i % 2 === 0 ? "#4ade80" : "#22c55e";
        context.fill();
        context.restore();
    }
    context.restore();
}

// Đại Dương — viền xanh dương gợn sóng + giọt nước
function drawFrameAqua(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx, cy - r, cx, cy + r);
    grad.addColorStop(0, "#7dd3fc");
    grad.addColorStop(1, "#0369a1");
    context.lineWidth = 13;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    const waveCount = 24;
    context.beginPath();
    for (let i = 0; i <= waveCount; i++) {
        const angle = ((Math.PI * 2) / waveCount) * i;
        const wobble = (i % 2 === 0) ? 3 : -3;
        const rr = r + 20 + wobble;
        const x = cx + Math.cos(angle) * rr, y = cy + Math.sin(angle) * rr;
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.lineWidth = 3;
    context.strokeStyle = "rgba(224,242,254,0.8)";
    context.stroke();
    [-40, 60, 170].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const dx = cx + Math.cos(rad) * (r + 30), dy = cy + Math.sin(rad) * (r + 30);
        context.beginPath();
        context.moveTo(dx, dy - 8);
        context.quadraticCurveTo(dx + 7, dy + 4, dx, dy + 9);
        context.quadraticCurveTo(dx - 7, dy + 4, dx, dy - 8);
        context.fillStyle = "#bae6fd";
        context.fill();
    });
    context.restore();
}

// Siêu Năng — viền hồng-tím + 2 vòng quỹ đạo đứt nét
function drawFramePsychic(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#f0abfc");
    grad.addColorStop(1, "#9333ea");
    context.shadowColor = "#e879f9";
    context.shadowBlur = 16;
    context.lineWidth = 11;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    context.shadowBlur = 0;
    context.setLineDash([10, 8]);
    context.lineWidth = 2.5;
    context.strokeStyle = "rgba(240,171,252,0.8)";
    context.beginPath();
    context.ellipse(cx, cy, r + 26, r * 0.5, Math.PI / 6, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(cx, cy, r + 26, r * 0.5, -Math.PI / 6, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    [30, 150, 270].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        drawSparkle(context, cx + Math.cos(rad) * (r + 22), cy + Math.sin(rad) * (r + 22), 8, "#f0abfc", 0.95);
    });
    context.restore();
}

// Rồng — viền chàm/tím đậm + vảy tam giác nhọn quanh khung
function drawFrameDragon(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#818cf8");
    grad.addColorStop(1, "#3730a3");
    context.lineWidth = 13;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    for (let i = 0; i < 14; i++) {
        const angle = ((Math.PI * 2) / 14) * i;
        const baseR = r + 18;
        const bx1 = cx + Math.cos(angle - 0.09) * baseR, by1 = cy + Math.sin(angle - 0.09) * baseR;
        const bx2 = cx + Math.cos(angle + 0.09) * baseR, by2 = cy + Math.sin(angle + 0.09) * baseR;
        const tipR = baseR + 16;
        const tx = cx + Math.cos(angle) * tipR, ty = cy + Math.sin(angle) * tipR;
        context.beginPath();
        context.moveTo(bx1, by1);
        context.lineTo(tx, ty);
        context.lineTo(bx2, by2);
        context.closePath();
        context.fillStyle = i % 2 === 0 ? "#6366f1" : "#4338ca";
        context.fill();
    }
    context.restore();
}

// Ngân Hà — viền tối kèm sao nhiều màu lấp lánh quanh khung
function drawFrameGalaxy(context, cx, cy, r) {
    context.save();
    context.lineWidth = 12;
    context.strokeStyle = "#1e1b4b";
    context.beginPath();
    context.arc(cx, cy, r + 10, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 3;
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#a855f7");
    grad.addColorStop(0.5, "#ec4899");
    grad.addColorStop(1, "#6366f1");
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 16, 0, Math.PI * 2);
    context.stroke();
    const starColors = ["#f0abfc", "#a5b4fc", "#fda4af", "#ffffff"];
    for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = r + 22 + Math.random() * 20;
        drawSparkle(
            context,
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            3 + Math.random() * 6,
            starColors[i % starColors.length],
            0.7 + Math.random() * 0.3
        );
    }
    context.restore();
}

// Hoàng Gia — viền tím-vàng chạm khắc, đính hạt vàng quanh khung
function drawFrameRoyal(context, cx, cy, r) {
    context.save();
    const grad = context.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, "#facc15");
    grad.addColorStop(0.5, "#7e22ce");
    grad.addColorStop(1, "#facc15");
    context.lineWidth = 15;
    context.strokeStyle = grad;
    context.beginPath();
    context.arc(cx, cy, r + 9, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,255,255,0.55)";
    context.beginPath();
    context.arc(cx, cy, r + 9, Math.PI * 1.1, Math.PI * 1.55);
    context.stroke();
    for (let i = 0; i < 10; i++) {
        const angle = ((Math.PI * 2) / 10) * i;
        const gx = cx + Math.cos(angle) * (r + 9), gy = cy + Math.sin(angle) * (r + 9);
        context.beginPath();
        context.arc(gx, gy, 6, 0, Math.PI * 2);
        context.fillStyle = "#fde68a";
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = "#7e22ce";
        context.stroke();
    }
    context.restore();
}

function drawAvatarFrame(context, style, cx, cy, r) {
    if (style === "neon") return drawFrameNeon(context, cx, cy, r);
    if (style === "metal-gold") return drawFrameMetal(context, cx, cy, r, "gold");
    if (style === "metal-silver") return drawFrameMetal(context, cx, cy, r, "silver");
    if (style === "fireice") return drawFrameFireIce(context, cx, cy, r);
    if (style === "carbon") return drawFrameCarbon(context, cx, cy, r);
    if (style === "holo") return drawFrameHolo(context, cx, cy, r);
    if (style === "electric") return drawFrameElectric(context, cx, cy, r);
    if (style === "nature") return drawFrameNature(context, cx, cy, r);
    if (style === "aqua") return drawFrameAqua(context, cx, cy, r);
    if (style === "psychic") return drawFramePsychic(context, cx, cy, r);
    if (style === "dragon") return drawFrameDragon(context, cx, cy, r);
    if (style === "galaxy") return drawFrameGalaxy(context, cx, cy, r);
    if (style === "royal") return drawFrameRoyal(context, cx, cy, r);
    return drawFramePokeball(context, cx, cy, r);
}


// ========================================
// BADGE BẬC RANK — tự vẽ (không dùng icon gốc của game)
// ========================================

const RANK_TIERS = {
    beginner: { label: "Beginner", top: "#6b7280", bottom: "#9aa1b0" },
    pokeball: { label: "Poké Ball", top: "#ef4444", bottom: "#f8fafc" },
    greatball: { label: "Great Ball", top: "#3b82f6", bottom: "#f8fafc" },
    ultraball: { label: "Ultra Ball", top: "#1f2430", bottom: "#eab308" },
    masterball: { label: "Master Ball", top: "#a855f7", bottom: "#f8fafc" },
    champion: { label: "Champion", top: "#f5d382", bottom: "#f5d382" }
};
const RANK_ROMAN = { 4: "IV", 3: "III", 2: "II", 1: "I" };

function drawBallIcon(context, cx, cy, r, topColor, bottomColor) {
    context.save();
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = topColor;
    context.fillRect(cx - r, cy - r, r * 2, r);
    context.fillStyle = bottomColor;
    context.fillRect(cx - r, cy, r * 2, r);
    context.restore();
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2);
    context.lineWidth = r * 0.16; context.strokeStyle = "#11151d"; context.stroke();
    context.beginPath(); context.moveTo(cx - r, cy); context.lineTo(cx + r, cy);
    context.lineWidth = r * 0.14; context.strokeStyle = "#11151d"; context.stroke();
    context.beginPath(); context.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    context.fillStyle = "#f8fafc"; context.fill();
    context.lineWidth = r * 0.12; context.strokeStyle = "#11151d"; context.stroke();
}

// Vẽ badge rank tại (x, y) = góc trên-trái, trả về chiều rộng đã dùng
function drawRankBadge(context, x, y, h) {
    if (rankTier === "none") return 0;
    const info = RANK_TIERS[rankTier];
    if (!info) return 0;

    const label = rankSub ? `${info.label} ${RANK_ROMAN[rankSub]}` : info.label;
    const iconR = h / 2;

    context.font = "800 20px Arial";
    const textW = context.measureText(label).width;
    const totalW = iconR * 2 + 12 + textW + 16;

    context.save();
    context.shadowColor = "rgba(0,0,0,0.4)";
    context.shadowBlur = 8;
    roundRect(context, x, y, totalW, h, h / 2);
    context.fillStyle = "rgba(0,0,0,0.35)";
    context.fill();
    context.restore();
    roundRect(context, x, y, totalW, h, h / 2);
    context.lineWidth = 1.5;
    context.strokeStyle = hexToRgba(info.top, 0.6);
    context.stroke();

    if (rankTier === "champion") {
        drawSparkle(context, x + iconR + 2, y + h / 2, iconR * 0.85, "#f5d382", 1);
    } else {
        drawBallIcon(context, x + iconR + 2, y + h / 2, iconR - 3, info.top, info.bottom);
    }

    context.fillStyle = "#ffffff";
    context.font = "800 20px Arial";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(label, x + iconR * 2 + 12, y + h / 2 + 1);

    return totalW;
}



// ========================================
// VẼ TRAINER CARD
// ========================================

async function renderCardPortrait() {
    const accent = getAccentColor();
    const accentLight = shadeColor(accent, 45);
    const accentDark = shadeColor(accent, -45);
    const centerX = CANVAS_W / 2;

    // Tải trước ảnh cần dùng
    const avatarSpriteImg = avatarMode === "sprite" && avatarSprite ? await loadImageAsync(avatarSprite.url) : null;
    const heroArtImg = heroPokemon ? await loadImageAsync(currentHeroArt(heroPokemon)) : null;
    const teamImgs = await Promise.all(teamMembers.map(m => loadImageAsync(m.url)));

    // ================= NỀN ĐEN TUYỀN, HIỆN ĐẠI, TỐI GIẢN =================
    ctx.fillStyle = "#040405";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 1 quầng sáng rất nhẹ phía sau thẻ — đủ để không phẳng lì, không loè loẹt
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(centerX, 380, 40, centerX, 380, 950);
    glow.addColorStop(0, hexToRgba(accent, 0.16));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // 1 vòng pokeball mờ góc dưới phải — điểm nhấn tối giản duy nhất
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.beginPath(); ctx.arc(CANVAS_W + 20, CANVAS_H - 20, 320, 0, Math.PI * 2);
    ctx.strokeStyle = accent; ctx.lineWidth = 28; ctx.stroke();
    ctx.restore();

    // Sao lấp lánh rải rác, tối giản
    drawScatteredSparkles(ctx, 22, accentLight, "#ffffff", centerX, 900, 520);

    // Thương hiệu nhỏ phía trên thẻ
    drawPokeballIcon(ctx, 70, 50, 16);
    ctx.fillStyle = "#c9cfdb";
    ctx.font = "700 20px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("PokemonInformation", 96, 50);

    // ================= THẺ HỒ SƠ — THẲNG, CÂN XỨNG (không nghiêng) =================
    const cardX = 40, cardY = 90, cardW = 1000, cardH = 700, cardRadius = 30;
    const cardBottom = cardY + cardH;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.75)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    const cardFill = ctx.createLinearGradient(cardX, cardY, cardX, cardBottom);
    cardFill.addColorStop(0, "rgba(24,26,34,0.95)");
    cardFill.addColorStop(1, "rgba(12,13,18,0.98)");
    ctx.fillStyle = cardFill;
    ctx.fill();
    ctx.restore();

    roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba(accentLight, 0.4);
    ctx.stroke();

    // viền hào quang mảnh bao quanh thẻ — cho thẻ "nổi" trên nền đen thay vì phẳng lì
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
    ctx.shadowColor = hexToRgba(accent, 0.55);
    ctx.shadowBlur = 26;
    ctx.lineWidth = 1;
    ctx.strokeStyle = hexToRgba(accentLight, 0.5);
    ctx.stroke();
    ctx.restore();

    // thanh tiêu đề
    const headerH = 140;
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, headerH, cardRadius);
    ctx.clip();
    ctx.fillStyle = hexToRgba(shadeColor(accent, -30), 0.35);
    ctx.fillRect(cardX, cardY, cardW, headerH);

    // vệt sáng quét chéo qua thanh tiêu đề — điểm nhấn bóng kính
    const sweepGrad = ctx.createLinearGradient(cardX, cardY, cardX + 260, cardY + headerH);
    sweepGrad.addColorStop(0, "rgba(255,255,255,0)");
    sweepGrad.addColorStop(0.5, "rgba(255,255,255,0.1)");
    sweepGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cardX + 120, cardY);
    ctx.lineTo(cardX + 260, cardY);
    ctx.lineTo(cardX + 140, cardY + headerH);
    ctx.lineTo(cardX, cardY + headerH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cardX, cardY + headerH);
    ctx.lineTo(cardX + cardW, cardY + headerH);
    ctx.strokeStyle = hexToRgba(accentLight, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawPokeballIcon(ctx, cardX + 56, cardY + 70, 24);
    ctx.save();
    ctx.shadowColor = hexToRgba(accent, 0.6);
    ctx.shadowBlur = 12;
    ctx.fillStyle = accentLight;
    ctx.font = "800 34px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("TRAINER CARD", cardX + 98, cardY + 70);
    ctx.restore();

    // ================= AVATAR + KHUNG TRANG TRÍ =================
    const avatarR = 100;
    const avatarCX = cardX + 56 + avatarR;
    const avatarCY = cardY + headerH + 40 + avatarR;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(avatarCX, avatarCY + avatarR + 10, avatarR * 0.7, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#191d27";
    ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);

    if (avatarMode === "photo" && uploadedPhoto) {
        const boxSize = avatarR * 2;
        const coverScale = Math.max(boxSize / uploadedPhoto.width, boxSize / uploadedPhoto.height);
        const scale = coverScale * photoZoom;
        const dw = uploadedPhoto.width * scale;
        const dh = uploadedPhoto.height * scale;
        const maxOffX = Math.max(0, (dw - boxSize) / 2);
        const maxOffY = Math.max(0, (dh - boxSize) / 2);
        const dx = avatarCX - dw / 2 + photoPanX * maxOffX;
        const dy = avatarCY - dh / 2 + photoPanY * maxOffY;
        ctx.drawImage(uploadedPhoto, dx, dy, dw, dh);
    } else if (avatarMode === "sprite" && avatarSpriteImg) {
        const pad = avatarR * 0.28;
        const avail = avatarR * 2 - pad * 2;
        const ratio = Math.min(avail / avatarSpriteImg.width, avail / avatarSpriteImg.height);
        const dw = avatarSpriteImg.width * ratio, dh = avatarSpriteImg.height * ratio;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarSpriteImg, avatarCX - dw / 2, avatarCY - dh / 2, dw, dh);
        ctx.imageSmoothingEnabled = true;
    } else {
        ctx.fillStyle = "#3c4656";
        ctx.font = "70px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(avatarMode === "sprite" ? "🎮" : "📷", avatarCX, avatarCY);
    }
    ctx.restore();

    drawAvatarFrame(ctx, frameStyle, avatarCX, avatarCY, avatarR);

    if (heroPokemon) {
        const typeLabel = (typeof TYPE_LABEL_VI !== "undefined" && TYPE_LABEL_VI[heroPokemon.types[0]])
            ? TYPE_LABEL_VI[heroPokemon.types[0]] : heroPokemon.types[0].toUpperCase();
        drawPill(ctx, avatarCX, avatarCY + avatarR, typeLabel, TYPE_COLORS[heroPokemon.types[0]] || accent, "#ffffff", 17);
    }

    // ================= TÊN + DANH HIỆU + RANK =================
    const infoX = avatarCX + avatarR + 34;
    const trainerName = nameInput.value.trim() || "Trainer";
    const tag = tagInput.value.trim();
    const hasTag = !!tag;

    ctx.font = "800 46px Arial";
    const nameW = ctx.measureText(trainerName).width;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    const nameGrad = ctx.createLinearGradient(infoX, 0, infoX + nameW, 0);
    nameGrad.addColorStop(0, "#ffffff");
    nameGrad.addColorStop(1, accentLight);
    ctx.fillStyle = nameGrad;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(trainerName, infoX, avatarCY - 8);
    ctx.restore();

    const underlineY = avatarCY - 8 + 10;
    const underlineGrad = ctx.createLinearGradient(infoX, 0, infoX + nameW + 26, 0);
    underlineGrad.addColorStop(0, hexToRgba(accentLight, 0.9));
    underlineGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = underlineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(infoX, underlineY);
    ctx.lineTo(infoX + nameW + 26, underlineY);
    ctx.stroke();
    drawSparkle(ctx, infoX + nameW + 26, underlineY - 14, 10, "#ffffff", 0.9);

    const tagText = hasTag ? tag : "Chưa có danh hiệu";
    const tagIcon = hasTag ? "🏷" : "✦";
    ctx.font = "700 20px Arial";
    const tagPadX = 18;
    const tagW = Math.min(cardX + cardW - 40 - infoX, ctx.measureText(`${tagIcon} ${tagText}`).width + tagPadX * 2);
    const tagY = avatarCY + 18;
    const tagH = 42;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    roundRect(ctx, infoX, tagY, tagW, tagH, tagH / 2);
    if (hasTag) {
        const tagGrad = ctx.createLinearGradient(infoX, tagY, infoX + tagW, tagY);
        tagGrad.addColorStop(0, accent);
        tagGrad.addColorStop(1, accentDark);
        ctx.fillStyle = tagGrad;
    } else {
        ctx.fillStyle = "rgba(0,0,0,0.32)";
    }
    ctx.fill();
    ctx.restore();

    roundRect(ctx, infoX, tagY, tagW, tagH, tagH / 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = hasTag ? "rgba(255,255,255,0.55)" : hexToRgba(accentLight, 0.4);
    ctx.stroke();

    ctx.fillStyle = hasTag ? "#ffffff" : "#9aa1b0";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${tagIcon} ${tagText}`, infoX + tagPadX, tagY + tagH / 2 + 1);

    // badge bậc rank — hàng riêng ngay dưới danh hiệu
    const rankY = tagY + tagH + 12;
    drawRankBadge(ctx, infoX, rankY, 40);

    // ================= ĐỘI HÌNH ĐỒNG HÀNH — icon to hơn =================
    const teamLabelY = rankY + 40 + 30;
    ctx.fillStyle = "#5f6a7e";
    ctx.font = "800 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("ĐỘI HÌNH ĐỒNG HÀNH", cardX + 56, teamLabelY);

    const teamTop = teamLabelY + 20;
    const slotD = 158, slotGap = 26;
    for (let i = 0; i < 5; i++) {
        const scx = cardX + 56 + slotD / 2 + i * (slotD + slotGap);
        const scy = teamTop + slotD / 2;
        const member = teamMembers[i];
        const img = teamImgs[i];
        const slotNumber = i + 1;

        if (member) {
            const typeColor = TYPE_COLORS[member.types[0]] || accent;
            ctx.beginPath();
            ctx.arc(scx, scy, slotD / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#151a26";
            ctx.fill();
            if (img) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(scx, scy, slotD / 2 - 7, 0, Math.PI * 2);
                ctx.clip();
                const ratio = Math.min((slotD - 24) / img.width, (slotD - 24) / img.height);
                const dw = img.width * ratio, dh = img.height * ratio;
                ctx.drawImage(img, scx - dw / 2, scy - dh / 2, dw, dh);
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(scx, scy, slotD / 2, 0, Math.PI * 2);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = typeColor;
            ctx.stroke();
            
            // Add number badge on the right side
            const numX = scx + slotD / 2 + 8;
            const numY = scy - 8;
            ctx.save();
            ctx.beginPath();
            ctx.arc(numX, numY, 12, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(typeColor, 0.9);
            ctx.fill();
            ctx.strokeStyle = typeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(slotNumber.toString(), numX, numY);
            ctx.restore();
        } else {
            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(scx, scy, slotD / 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(169,175,189,0.3)";
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = "rgba(169,175,189,0.3)";
            ctx.font = "300 24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("+", scx, scy - 1);
        }
    }

    // ================= POKÉMON ĐỒNG HÀNH — TO HƠN, ĐỔ BÓNG RÕ =================
    if (heroArtImg) {
        const heroZoneTop = cardBottom - 30;
        const overflowBottom = CANVAS_H - 60;
        const availH = overflowBottom - heroZoneTop;
        const maxW = CANVAS_W * 1.05;

        const scale = Math.min(maxW / heroArtImg.width, availH / heroArtImg.height);
        const dw = heroArtImg.width * scale;
        const dh = heroArtImg.height * scale;
        const dx = centerX - dw / 2;
        const dy = overflowBottom - dh;

        // hào quang phía sau
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const heroGlow = ctx.createRadialGradient(centerX, dy + dh * 0.4, 40, centerX, dy + dh * 0.4, dw);
        heroGlow.addColorStop(0, hexToRgba(accent, 0.5));
        heroGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = heroGlow;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();

        // bóng đổ thật — silhouette đen đậm hơn, lệch xuống-phải rõ hơn, tách khỏi Pokémon
        ctx.save();
        ctx.filter = "blur(24px) brightness(0)";
        ctx.globalAlpha = 0.7;
        ctx.drawImage(heroArtImg, dx + 26, dy + 36, dw, dh);
        ctx.restore();

        // lớp bóng thứ 2, gần & sắc hơn — tăng chiều sâu
        ctx.save();
        ctx.filter = "blur(10px) brightness(0)";
        ctx.globalAlpha = 0.5;
        ctx.drawImage(heroArtImg, dx + 10, dy + 14, dw, dh);
        ctx.restore();

        // bóng elip dưới chân, đậm hơn, tăng cảm giác chạm đất
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, dy + dh - 4, dw * 0.36, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.filter = "blur(20px)";
        ctx.fill();
        ctx.restore();

        // Pokémon sắc nét (bật nội suy chất lượng cao), có shadow màu hệ để nổi khối
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.shadowColor = hexToRgba(accent, 0.55);
        ctx.shadowBlur = 34;
        ctx.drawImage(heroArtImg, dx, dy, dw, dh);
        ctx.restore();

        [[dx + dw * 0.06, dy + dh * 0.12], [dx + dw * 0.95, dy + dh * 0.28]].forEach(([sx, sy]) => {
            drawSparkle(ctx, sx, sy, 17, "#ffffff", 0.85);
        });
    } else {
        ctx.fillStyle = "#4b5563";
        ctx.font = "700 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Chưa chọn Pokémon đồng hành — thêm ở bước 2", centerX, cardBottom + 120);
    }

    // ================= WATERMARK DƯỚI CÙNG =================
    ctx.save();
    const bottomStrip = ctx.createLinearGradient(0, CANVAS_H - 120, 0, CANVAS_H);
    bottomStrip.addColorStop(0, "rgba(3,3,5,0)");
    bottomStrip.addColorStop(1, "rgba(3,3,5,0.85)");
    ctx.fillStyle = bottomStrip;
    ctx.fillRect(0, CANVAS_H - 120, CANVAS_W, 120);
    ctx.restore();

    drawSparkle(ctx, centerX, CANVAS_H - 44, 10, accentLight, 0.85);
    ctx.fillStyle = "#c9cfdb";
    ctx.font = "600 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Trainer Card  •  Tạo trainer card tại pokemonif.com", centerX, CANVAS_H - 20);
    drawTopRightStar(ctx, CANVAS_W - 60, 60, 40, accentLight);
}

function drawTopRightStar(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.shadowColor = hexToRgba(color, 0.6);
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.8);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}


// ========================================
// VẼ TRAINER CARD — ĐỊNH DẠNG NGANG (16:9, kiểu profile Liên Quân)
// Pokémon chính chiếm ~70% bên phải, panel Trainer + 5 Pokémon phụ bên trái.
// ========================================

async function renderCardLandscape() {
    const accent = getAccentColor();
    const accentLight = shadeColor(accent, 45);
    const accentDark = shadeColor(accent, -45);
    const secondary = getSecondaryColor(accent);

    const avatarSpriteImg = avatarMode === "sprite" && avatarSprite ? await loadImageAsync(avatarSprite.url) : null;
    const heroArtImg = heroPokemon ? await loadImageAsync(currentHeroArt(heroPokemon)) : null;
    const teamImgs = await Promise.all(teamMembers.map(m => loadImageAsync(m.url)));

    // ================= NỀN ĐEN VŨ TRỤ =================
    const bgGrad = ctx.createRadialGradient(CANVAS_W * 0.7, CANVAS_H * 0.4, 60, CANVAS_W * 0.7, CANVAS_H * 0.4, CANVAS_W * 0.9);
    bgGrad.addColorStop(0, "#0b0a16");
    bgGrad.addColorStop(0.55, "#050409");
    bgGrad.addColorStop(1, "#020103");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // tinh vân (nebula) mờ nhiều màu, tạo chiều sâu vũ trụ
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const neb1 = ctx.createRadialGradient(CANVAS_W * 0.78, CANVAS_H * 0.25, 20, CANVAS_W * 0.78, CANVAS_H * 0.25, 620);
    neb1.addColorStop(0, hexToRgba(accent, 0.28));
    neb1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = neb1; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const neb2 = ctx.createRadialGradient(CANVAS_W * 0.55, CANVAS_H * 0.85, 20, CANVAS_W * 0.55, CANVAS_H * 0.85, 560);
    neb2.addColorStop(0, hexToRgba(secondary, 0.24));
    neb2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const neb3 = ctx.createRadialGradient(CANVAS_W * 0.15, CANVAS_H * 0.15, 10, CANVAS_W * 0.15, CANVAS_H * 0.15, 420);
    neb3.addColorStop(0, hexToRgba("#7c3aed", 0.16));
    neb3.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = neb3; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // vòng quỹ đạo hành tinh mờ — điểm nhấn "vũ trụ"
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = accentLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(CANVAS_W * 0.74, CANVAS_H * 0.3, 480, 130, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // sao nhỏ rải khắp nền
    for (let i = 0; i < 90; i++) {
        const sx = Math.random() * CANVAS_W;
        const sy = Math.random() * CANVAS_H;
        const size = Math.random() * 1.8 + 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.55})`;
        ctx.fill();
    }
    drawScatteredSparkles(ctx, 16, accentLight, "#ffffff", CANVAS_W * 0.72, CANVAS_H * 0.5, 260);

    // ================= PANEL TRÁI — THÔNG TIN TRAINER (40%) =================
    const panelX = 40, panelY = 40;
    const panelW = Math.round(CANVAS_W * 0.4);
    const panelH = CANVAS_H - 80, panelRadius = 28;
    const panelBottom = panelY + panelH;
    const panelCenterX = panelX + panelW / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 20;
    roundRect(ctx, panelX, panelY, panelW, panelH, panelRadius);
    const panelFill = ctx.createLinearGradient(panelX, panelY, panelX, panelBottom);
    panelFill.addColorStop(0, "rgba(22,24,32,0.95)");
    panelFill.addColorStop(1, "rgba(10,11,16,0.98)");
    ctx.fillStyle = panelFill;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, panelX, panelY, panelW, panelH, panelRadius);
    ctx.shadowColor = hexToRgba(accent, 0.4);
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "transparent";
    ctx.stroke();
    ctx.restore();

    roundRect(ctx, panelX, panelY, panelW, panelH, panelRadius);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba(accentLight, 0.4);
    ctx.stroke();

    ctx.save();
    roundRect(ctx, panelX, panelY, panelW, panelH, panelRadius);
    ctx.shadowColor = hexToRgba(accent, 0.5);
    ctx.shadowBlur = 24;
    ctx.lineWidth = 1;
    ctx.strokeStyle = hexToRgba(accentLight, 0.45);
    ctx.stroke();
    ctx.restore();

    // Subtle luminous glow for left panel - keep dark but brighter
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = "screen";
    const panelGlowGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
    panelGlowGrad.addColorStop(0, hexToRgba(accentLight, 0.4));
    panelGlowGrad.addColorStop(0.5, hexToRgba(accent, 0.3));
    panelGlowGrad.addColorStop(1, hexToRgba(secondary, 0.35));
    roundRect(ctx, panelX + 2, panelY + 2, panelW - 4, panelH - 4, panelRadius - 2);
    ctx.fillStyle = panelGlowGrad;
    ctx.fill();
    ctx.restore();

    // thanh tiêu đề gọn
    const headerH = 90;
    ctx.save();
    roundRect(ctx, panelX, panelY, panelW, headerH, panelRadius);
    ctx.clip();
    ctx.fillStyle = hexToRgba(shadeColor(accent, -30), 0.35);
    ctx.fillRect(panelX, panelY, panelW, headerH);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(panelX, panelY + headerH);
    ctx.lineTo(panelX + panelW, panelY + headerH);
    ctx.strokeStyle = hexToRgba(accentLight, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawPokeballIcon(ctx, panelX + 40, panelY + 45, 18);
    ctx.save();
    ctx.shadowColor = hexToRgba(accent, 0.6);
    ctx.shadowBlur = 10;
    ctx.fillStyle = accentLight;
    ctx.font = "800 24px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("TRAINER CARD", panelX + 70, panelY + 45);
    ctx.restore();

    // ================= AVATAR (căn giữa panel) =================
    const avatarR = 118;
    const avatarCX = panelCenterX;
    const avatarCY = panelY + headerH + 56 + avatarR;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(avatarCX, avatarCY + avatarR + 10, avatarR * 0.68, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.filter = "blur(14px)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#191d27";
    ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);

    if (avatarMode === "photo" && uploadedPhoto) {
        const boxSize = avatarR * 2;
        const coverScale = Math.max(boxSize / uploadedPhoto.width, boxSize / uploadedPhoto.height);
        const scale = coverScale * photoZoom;
        const dw = uploadedPhoto.width * scale;
        const dh = uploadedPhoto.height * scale;
        const maxOffX = Math.max(0, (dw - boxSize) / 2);
        const maxOffY = Math.max(0, (dh - boxSize) / 2);
        const dx = avatarCX - dw / 2 + photoPanX * maxOffX;
        const dy = avatarCY - dh / 2 + photoPanY * maxOffY;
        ctx.drawImage(uploadedPhoto, dx, dy, dw, dh);
    } else if (avatarMode === "sprite" && avatarSpriteImg) {
        const pad = avatarR * 0.28;
        const avail = avatarR * 2 - pad * 2;
        const ratio = Math.min(avail / avatarSpriteImg.width, avail / avatarSpriteImg.height);
        const dw = avatarSpriteImg.width * ratio, dh = avatarSpriteImg.height * ratio;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(avatarSpriteImg, avatarCX - dw / 2, avatarCY - dh / 2, dw, dh);
        ctx.imageSmoothingEnabled = true;
    } else {
        ctx.fillStyle = "#3c4656";
        ctx.font = "66px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(avatarMode === "sprite" ? "🎮" : "📷", avatarCX, avatarCY);
    }
    ctx.restore();

    drawAvatarFrame(ctx, frameStyle, avatarCX, avatarCY, avatarR);

    if (heroPokemon) {
        const typeLabel = (typeof TYPE_LABEL_VI !== "undefined" && TYPE_LABEL_VI[heroPokemon.types[0]])
            ? TYPE_LABEL_VI[heroPokemon.types[0]] : heroPokemon.types[0].toUpperCase();
        drawPill(ctx, avatarCX, avatarCY + avatarR, typeLabel, TYPE_COLORS[heroPokemon.types[0]] || accent, "#ffffff", 15);
    }

    // ================= TÊN + DANH HIỆU + RANK (căn giữa) =================
    const trainerName = nameInput.value.trim() || "Trainer";
    const tag = tagInput.value.trim();
    const hasTag = !!tag;

    const nameY = avatarCY + avatarR + 55;
    ctx.font = "800 34px Arial";
    const nameW = ctx.measureText(trainerName).width;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    const nameGrad = ctx.createLinearGradient(panelCenterX - nameW / 2, 0, panelCenterX + nameW / 2, 0);
    nameGrad.addColorStop(0, accentLight);
    nameGrad.addColorStop(0.5, "#ffffff");
    nameGrad.addColorStop(1, accentLight);
    ctx.fillStyle = nameGrad;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(trainerName, panelCenterX, nameY);
    ctx.restore();

    const underlineY = nameY + 8;
    ctx.strokeStyle = hexToRgba(accentLight, 0.7);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(panelCenterX - nameW / 2 - 14, underlineY);
    ctx.lineTo(panelCenterX + nameW / 2 + 14, underlineY);
    ctx.stroke();

    const tagText = hasTag ? tag : "Chưa có danh hiệu";
    const tagIcon = hasTag ? "🏷" : "✦";
    ctx.font = "700 18px Arial";
    const tagPadX = 16;
    const tagW = Math.min(panelW - 60, ctx.measureText(`${tagIcon} ${tagText}`).width + tagPadX * 2);
    const tagY = nameY + 20;
    const tagH = 38;
    const tagX = panelCenterX - tagW / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2);
    if (hasTag) {
        const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagW, tagY);
        tagGrad.addColorStop(0, accent);
        tagGrad.addColorStop(1, accentDark);
        ctx.fillStyle = tagGrad;
    } else {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
    }
    ctx.fill();
    ctx.restore();
    roundRect(ctx, tagX, tagY, tagW, tagH, tagH / 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = hasTag ? "rgba(255,255,255,0.55)" : hexToRgba(accentLight, 0.4);
    ctx.stroke();
    ctx.fillStyle = hasTag ? "#ffffff" : "#9aa1b0";
    ctx.font = "700 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${tagIcon} ${tagText}`, tagX + tagW / 2, tagY + tagH / 2 + 1);

    const rankY = tagY + tagH + 14;
    if (rankTier !== "none") {
        ctx.font = "800 18px Arial";
        const info = RANK_TIERS[rankTier];
        const label = rankSub ? `${info.label} ${RANK_ROMAN[rankSub]}` : info.label;
        const iconR = 18;
        const rankW = iconR * 2 + 12 + ctx.measureText(label).width + 16;
        drawRankBadge(ctx, panelCenterX - rankW / 2, rankY, 36);
    }

    // ================= ĐỘI HÌNH PHỤ — 2 HÀNG x 3 CỘT =================
    const teamLabelY = rankY + (rankTier !== "none" ? 36 : 0) + 34;
    ctx.fillStyle = "#5f6a7e";
    ctx.font = "800 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("ĐỘI HÌNH ĐỒNG HÀNH", panelCenterX, teamLabelY);

    const teamTop = teamLabelY + 18;
    const slotSize = 150;
    const colGap = 24;
    const rowGap = 26;
    const slotPerRow = 3;
    const gridW = slotSize * 3 + colGap * 2;
    const gridLeftX = panelCenterX - gridW / 2;

    const positions = [];
    for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / slotPerRow);
        const col = i % slotPerRow;
        positions.push({
            x: gridLeftX + col * (slotSize + colGap) + slotSize / 2,
            y: teamTop + row * (slotSize + rowGap) + slotSize / 2,
            size: slotSize
        });
    }

    // Build display members: slot 0 = hero, slot 1-5 = team members
    const displayMembers = [];
    const displayImgs = [];
    
    if (heroPokemon) {
        displayMembers.push(heroPokemon);
        displayImgs.push(heroArtImg);
    }
    for (let i = 0; i < Math.min(5, teamMembers.length); i++) {
        displayMembers.push(teamMembers[i]);
        displayImgs.push(teamImgs[i]);
    }

    positions.forEach((pos, idx) => {
        const member = displayMembers[idx] || null;
        const img = displayImgs[idx] || null;
        const currentSize = pos.size;
        const cx = pos.x;
        const cy = pos.y;
        const slotNumber = idx + 1;
        const isHero = idx === 0;

        if (member) {
            const typeColor = TYPE_COLORS[member.types[0]] || accent;
            
            // Background circle
            ctx.beginPath();
            ctx.arc(cx, cy, currentSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#151a26";
            ctx.fill();
            
            // Draw pokemon image - full Pokemon shown
            if (img) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, currentSize / 2 - 4, 0, Math.PI * 2);
                ctx.clip();
                const ratio = Math.min((currentSize - 12) / img.width, (currentSize - 12) / img.height);
                const dw = img.width * ratio, dh = img.height * ratio;
                ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
                ctx.restore();
            }
            
            // Border circle with type color
            ctx.beginPath();
            ctx.arc(cx, cy, currentSize / 2, 0, Math.PI * 2);
            ctx.lineWidth = isHero ? 4.5 : 3.5;
            ctx.strokeStyle = typeColor;
            ctx.stroke();
            
            // Glow effect for hero
            if (isHero) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(cx, cy, currentSize / 2, 0, Math.PI * 2);
                ctx.lineWidth = 8;
                ctx.strokeStyle = hexToRgba(typeColor, 0.6);
                ctx.stroke();
                ctx.restore();
            }
            
            // Number badge on top-left of circle border
            const numRadius = 16;
            const numX = cx - currentSize / 2 + numRadius + 4;
            const numY = cy - currentSize / 2 - numRadius - 4;
            ctx.save();
            ctx.beginPath();
            ctx.arc(numX, numY, numRadius, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(typeColor, 0.95);
            ctx.fill();
            ctx.strokeStyle = typeColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = isHero ? "bold 18px Arial" : "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(slotNumber.toString(), numX, numY);
            ctx.restore();
        } else {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(cx, cy, currentSize / 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(169,175,189,0.3)";
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = "rgba(169,175,189,0.3)";
            ctx.font = "300 26px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("+", cx, cy - 1);
        }
    });

    // dải chân panel trang trí
    const footerLineY = panelBottom - 46;
    ctx.beginPath();
    ctx.moveTo(panelX + 50, footerLineY);
    ctx.lineTo(panelX + panelW - 50, footerLineY);
    ctx.strokeStyle = hexToRgba(accentLight, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    drawSparkle(ctx, panelCenterX, footerLineY, 8, accentLight, 0.8);
    ctx.fillStyle = "#5f6a7e";
    ctx.font = "600 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pokémon Champions", panelCenterX, footerLineY + 24);

    // ================= POKÉMON CHÍNH — 70% BÊN PHẢI =================
    const heroZoneX = panelX + panelW + 40;
    const heroZoneRight = CANVAS_W - 40;
    const heroZoneW = heroZoneRight - heroZoneX;

    if (heroArtImg) {
        const topMargin = 40, bottomMargin = 40;
        const availH = CANVAS_H - topMargin - bottomMargin;
        const maxW = heroZoneW * 1.05;

        const scale = Math.min(maxW / heroArtImg.width, availH / heroArtImg.height);
        const dw = heroArtImg.width * scale;
        const dh = heroArtImg.height * scale;
        const dx = heroZoneX + (heroZoneW - dw) / 2;
        const dy = (CANVAS_H - bottomMargin) - dh;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const heroGlow = ctx.createRadialGradient(dx + dw / 2, dy + dh * 0.42, 40, dx + dw / 2, dy + dh * 0.42, dw * 0.85);
        heroGlow.addColorStop(0, hexToRgba(accent, 0.55));
        heroGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = heroGlow;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();

        ctx.save();
        ctx.filter = "blur(26px) brightness(0)";
        ctx.globalAlpha = 0.65;
        ctx.drawImage(heroArtImg, dx + 26, dy + 34, dw, dh);
        ctx.restore();

        ctx.save();
        ctx.filter = "blur(11px) brightness(0)";
        ctx.globalAlpha = 0.45;
        ctx.drawImage(heroArtImg, dx + 10, dy + 14, dw, dh);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(dx + dw / 2, dy + dh - 4, dw * 0.34, 28, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.filter = "blur(20px)";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.shadowColor = hexToRgba(accent, 0.55);
        ctx.shadowBlur = 34;
        ctx.drawImage(heroArtImg, dx, dy, dw, dh);
        ctx.restore();

        [[dx + dw * 0.05, dy + dh * 0.1], [dx + dw * 0.95, dy + dh * 0.25], [dx + dw * 0.15, dy + dh * 0.9]].forEach(([sx, sy]) => {
            drawSparkle(ctx, sx, sy, 16, "#ffffff", 0.85);
        });
    } else {
        ctx.fillStyle = "#4b5563";
        ctx.font = "700 26px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Chưa chọn Pokémon đồng hành — thêm ở bước 2", heroZoneX + heroZoneW / 2, CANVAS_H / 2);
    }

    // ================= WATERMARK DƯỚI CÙNG =================
    ctx.save();
    const bottomStrip = ctx.createLinearGradient(0, CANVAS_H - 90, 0, CANVAS_H);
    bottomStrip.addColorStop(0, "rgba(2,2,4,0)");
    bottomStrip.addColorStop(1, "rgba(2,2,4,0.8)");
    ctx.fillStyle = bottomStrip;
    ctx.fillRect(0, CANVAS_H - 90, CANVAS_W, 90);
    ctx.restore();

    ctx.fillStyle = "#c9cfdb";
    ctx.font = "600 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Trainer Card  •  Tạo trainer card tại pokemonif.com", CANVAS_W / 2, CANVAS_H - 22);
    
    // Add star in top-right corner for landscape mode
    drawTopRightStar(ctx, CANVAS_W - 60, 60, 40, accentLight);
}


// ========================================
// DISPATCHER — chọn hàm vẽ theo định dạng đã chọn
// ========================================

async function renderCard() {
    if (cardFormat === "landscape") {
        return renderCardLandscape();
    }
    return renderCardPortrait();
}


// ========================================
// PREVIEW EXPANSION / COLLAPSE
// ========================================

function expandPreview() {
    if (!tcLayout) return;
    if (window.innerWidth >= 768) {
        tcLayout.classList.remove("preview-expanded");
        document.body.style.overflow = "";
        return;
    }
    tcLayout.classList.add("preview-expanded");
    document.body.style.overflow = "hidden";
}

function collapsePreview() {
    if (!tcLayout) return;
    tcLayout.classList.remove("preview-expanded");
    document.body.style.overflow = "";
}

if (previewCloseBtn) {
    previewCloseBtn.addEventListener("click", collapsePreview);
}


// ========================================
// SỰ KIỆN NÚT
// ========================================

generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = "⏳ Đang tạo...";
    try {
        await renderCard();
        downloadBtn.classList.add("ready");

        // Desktop: scroll preview vào view nhưng không bắt buộc chuyển sang giao diện preview.
        if (window.innerWidth >= 768) {
            setTimeout(() => {
                canvasFrame.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
        }
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "🎨 Tạo ảnh";
    }
});

downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    const trainerName = nameInput.value.trim() || "trainer";
    link.download = `${trainerName.toLowerCase().replace(/\s+/g, "-")}-trainer-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});


// ========================================
// INIT
// ========================================

applyCardFormat();
collapsePreview();
renderCard();



