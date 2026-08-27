// ========================================
// DAMAGE CALCULATOR
// Công thức Pokemon chuẩn: Lv.50, IV 31, EV và Nature do người dùng chọn.
// ========================================

const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
const MOVE_API_BASE = "https://pokeapi.co/api/v2/move";

let pokemonNameList = null;
let pokemonNameListPromise = null;

let attacker = null; // { data, stats }
let defender = null;
let selectedMove = null;

const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_LABEL = {
    hp: "HP", attack: "ATK", defense: "DEF",
    "special-attack": "SPA", "special-defense": "SPD", speed: "SPE"
};

// 25 bản chất chuẩn của game — mỗi bản chất tăng 10% 1 chỉ số, giảm 10% 1 chỉ số khác
// (5 bản chất trung tính không tăng/giảm gì)
const NATURES = [
    { name: "Hardy", plus: null, minus: null },
    { name: "Lonely", plus: "attack", minus: "defense" },
    { name: "Adamant", plus: "attack", minus: "special-attack" },
    { name: "Naughty", plus: "attack", minus: "special-defense" },
    { name: "Brave", plus: "attack", minus: "speed" },
    { name: "Bold", plus: "defense", minus: "attack" },
    { name: "Docile", plus: null, minus: null },
    { name: "Impish", plus: "defense", minus: "special-attack" },
    { name: "Lax", plus: "defense", minus: "special-defense" },
    { name: "Relaxed", plus: "defense", minus: "speed" },
    { name: "Modest", plus: "special-attack", minus: "attack" },
    { name: "Mild", plus: "special-attack", minus: "defense" },
    { name: "Bashful", plus: null, minus: null },
    { name: "Rash", plus: "special-attack", minus: "special-defense" },
    { name: "Quiet", plus: "special-attack", minus: "speed" },
    { name: "Calm", plus: "special-defense", minus: "attack" },
    { name: "Gentle", plus: "special-defense", minus: "defense" },
    { name: "Careful", plus: "special-defense", minus: "special-attack" },
    { name: "Quirky", plus: null, minus: null },
    { name: "Sassy", plus: "special-defense", minus: "speed" },
    { name: "Timid", plus: "speed", minus: "attack" },
    { name: "Hasty", plus: "speed", minus: "defense" },
    { name: "Jolly", plus: "speed", minus: "special-attack" },
    { name: "Naive", plus: "speed", minus: "special-defense" },
    { name: "Serious", plus: null, minus: null }
];

function natureMultiplier(natureName, statKey) {
    const nature = NATURES.find(n => n.name === natureName);
    if (!nature) return 1;
    if (nature.plus === statKey) return 1.1;
    if (nature.minus === statKey) return 0.9;
    return 1;
}

function natureLabel(nature) {
    if (!nature.plus) return `${nature.name} (trung tính)`;
    return `${nature.name} (+${STAT_LABEL[nature.plus]} / -${STAT_LABEL[nature.minus]})`;
}

const atkInput = document.getElementById("dc-atk-input");
const atkSuggestions = document.getElementById("dc-atk-suggestions");
const atkPreview = document.getElementById("dc-atk-preview");
const moveField = document.getElementById("dc-move-field");
const moveSearch = document.getElementById("dc-move-search");
const moveSelect = document.getElementById("dc-move-select");
const atkBoostRow = document.getElementById("dc-atk-boost-row");
const atkStageSelect = document.getElementById("dc-atk-stage");
const atkNatureField = document.getElementById("dc-atk-nature-field");
const atkNatureSelect = document.getElementById("dc-atk-nature");
const atkEvField = document.getElementById("dc-atk-ev-field");
const atkEvGrid = document.getElementById("dc-atk-ev-grid");
const atkEvTotal = document.getElementById("dc-atk-ev-total");
const atkAbilityField = document.getElementById("dc-atk-ability-field");
const atkAbilitySelect = document.getElementById("dc-atk-ability");
const atkAbilityHelp = document.getElementById("dc-atk-ability-help");

const defInput = document.getElementById("dc-def-input");
const defSuggestions = document.getElementById("dc-def-suggestions");
const defPreview = document.getElementById("dc-def-preview");
const defBoostRow = document.getElementById("dc-def-boost-row");
const defStageSelect = document.getElementById("dc-def-stage");
const defNatureField = document.getElementById("dc-def-nature-field");
const defNatureSelect = document.getElementById("dc-def-nature");
const defEvField = document.getElementById("dc-def-ev-field");
const defEvGrid = document.getElementById("dc-def-ev-grid");
const defEvTotal = document.getElementById("dc-def-ev-total");
const defAbilityField = document.getElementById("dc-def-ability-field");
const defAbilitySelect = document.getElementById("dc-def-ability");
const defAbilityHelp = document.getElementById("dc-def-ability-help");

const atkItemSelect = document.getElementById("dc-atk-item");
const defItemSelect = document.getElementById("dc-def-item");
const weatherSelect = document.getElementById("dc-weather");
const terrainSelect = document.getElementById("dc-terrain");
const critSelect = document.getElementById("dc-crit");
const helpingHandInput = document.getElementById("dc-helping-hand");
const attackerLowHpInput = document.getElementById("dc-atk-low-hp");
const defenderFullHpInput = document.getElementById("dc-def-full-hp");
const defenderDisguiseInput = document.getElementById("dc-def-disguise");
const defenderStatusSelect = document.getElementById("dc-def-status");
const defenderIceFaceInput = document.getElementById("dc-def-ice-face");
const attackerStatusSelect = document.getElementById("dc-atk-status");
const flashFireInput = document.getElementById("dc-flash-fire");
const defenderSwitchedInInput = document.getElementById("dc-def-switched-in");
const attackerMovesSecondInput = document.getElementById("dc-attacker-moves-second");
const rivalrySelect = document.getElementById("dc-rivalry");
const faintedAlliesSelect = document.getElementById("dc-fainted-allies");
const atkItemPreview = document.getElementById("dc-atk-item-preview");
const defItemPreview = document.getElementById("dc-def-item-preview");
const weatherPreview = document.getElementById("dc-weather-preview");

const resultBox = document.getElementById("dc-result");
const startCalcButton = document.getElementById("dc-start-calc");
const calcStatus = document.getElementById("dc-calc-status");

let atkEv = { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
let defEv = { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
let availableMoves = [];

function updateCalculateButton() {
    const canCalculate = Boolean(attacker && defender && selectedMove);
    const isEnglish = document.documentElement.lang === "en";
    startCalcButton.disabled = !canCalculate;
    calcStatus.textContent = canCalculate
        ? ""
        : isEnglish
            ? "Please select both Pokémon to calculate damage."
            : "Vui lòng chọn đủ Pokémon để tính dame.";
}

window.addEventListener("languagechanged", updateCalculateButton);

startCalcButton.addEventListener("click", () => {
    if (startCalcButton.disabled) return;
    calculateAndRender();
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
});

const ITEM_ICONS = {
    none: "○", "choice-band": "◈", "choice-specs": "◈", "life-orb": "●",
    "expert-belt": "◉", "muscle-band": "◌", "wise-glasses": "◉",
    "mystic-water": "💧", charcoal: "🔥", "miracle-seed": "🌱", magnet: "⚡",
    "never-melt-ice": "❄", "black-belt": "🥋", "poison-barb": "☠",
    "soft-sand": "◇", "sharp-beak": "🪽", "twisted-spoon": "🥄",
    "silver-powder": "✦", "hard-stone": "◆", "spell-tag": "👻",
    "dragon-fang": "牙", "black-glasses": "◐", "metal-coat": "⚙", "pixie-plate": "✨",
    eviolite: "◇", "assault-vest": "▣"
};

const WEATHER_ICONS = { none: "○", sun: "☀", rain: "🌧", sand: "🌪", snow: "❄" };


// ========================================
// TÊN POKÉMON (AUTOCOMPLETE DÙNG CHUNG)
// ========================================

function loadPokemonNameList() {
    if (pokemonNameListPromise) return pokemonNameListPromise;

    const cachedNames = sessionStorage.getItem("pokemon-name-list");
    if (cachedNames) {
        try {
            pokemonNameList = JSON.parse(cachedNames).map(pokemon => ({
                name: pokemon.name,
                id: pokemon.id || pokemon.url?.split("/").filter(Boolean).pop()
            }));
            pokemonNameListPromise = Promise.resolve(pokemonNameList);
            return pokemonNameListPromise;
        } catch {
            sessionStorage.removeItem("pokemon-name-list");
        }
    }

    pokemonNameListPromise = fetch(`${POKE_API_BASE}?limit=2000`)
        .then(res => res.json())
        .then(data => {
            pokemonNameList = data.results.map(p => ({
                name: p.name,
                id: p.url.split("/").filter(Boolean).pop()
            }));
            sessionStorage.setItem("pokemon-name-list", JSON.stringify(pokemonNameList));
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

function setupSearchBox(input, suggestionsBox, wrapSelector, onPick) {
    input.addEventListener("focus", () => loadPokemonNameList(), { once: true });

    let debounceTimer = null;

    input.addEventListener("input", async () => {
        clearTimeout(debounceTimer);
        const value = input.value;

        debounceTimer = setTimeout(() => {
            loadPokemonNameList().then(() => {
                const matches = searchPokemonNames(value);

                if (matches.length === 0) {
                    suggestionsBox.classList.remove("active");
                    suggestionsBox.innerHTML = "";
                    return;
                }

                suggestionsBox.innerHTML = matches.map(p => {
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
                suggestionsBox.classList.add("active");
            });
        }, 150);
    });

    suggestionsBox.addEventListener("click", event => {
        const item = event.target.closest(".search-suggestion");
        if (!item) return;

        input.value = capitalizeWords(item.dataset.id.replace(/-/g, " "));
        suggestionsBox.classList.remove("active");
        suggestionsBox.innerHTML = "";

        onPick(item.dataset.id);
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(wrapSelector)) {
            suggestionsBox.classList.remove("active");
        }
    });
}

setupSearchBox(atkInput, atkSuggestions, "#dc-atk-wrap", pickAttacker);
setupSearchBox(defInput, defSuggestions, "#dc-def-wrap", pickDefender);


// ========================================
// CHỌN ATTACKER / DEFENDER
// ========================================

async function pickAttacker(pokeApiName) {
    try {
        const res = await fetch(`${POKE_API_BASE}/${pokeApiName}`);
        if (!res.ok) return;
        const data = await res.json();
        data.isFullyEvolved = await getFullyEvolvedStatus(data);

        attacker = { data };
        updateCalculateButton();
        renderPreview(atkPreview, data);
        atkBoostRow.hidden = false;

        setupNatureSelect(atkNatureSelect, "Adamant");
        atkNatureField.hidden = false;

        atkEv = { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
        renderStatPointGrid(atkEvGrid, atkEvTotal, atkEv, data, atkNatureSelect, () => calculateAndRender());
        setStatPointLabel(atkEvField, atkEvTotal);
        atkEvField.hidden = false;

        setupAbilitySelect(atkAbilitySelect, atkAbilityHelp, data);
        atkAbilityField.hidden = false;

        populateMoveSelect(data);
        moveField.hidden = false;

        calculateAndRender();
    } catch {
        // bỏ qua nếu lỗi mạng
    }
}

async function pickDefender(pokeApiName) {
    try {
        const res = await fetch(`${POKE_API_BASE}/${pokeApiName}`);
        if (!res.ok) return;
        const data = await res.json();
        data.isFullyEvolved = await getFullyEvolvedStatus(data);

        defender = { data };
        updateCalculateButton();
        renderPreview(defPreview, data);
        defBoostRow.hidden = false;

        setupNatureSelect(defNatureSelect, "Bold");
        defNatureField.hidden = false;

        defEv = { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
        renderStatPointGrid(defEvGrid, defEvTotal, defEv, data, defNatureSelect, () => calculateAndRender());
        setStatPointLabel(defEvField, defEvTotal);
        defEvField.hidden = false;

        setupAbilitySelect(defAbilitySelect, defAbilityHelp, data);
        defAbilityField.hidden = false;

        calculateAndRender();
    } catch {
        // bỏ qua nếu lỗi mạng
    }
}

function setupNatureSelect(selectEl, defaultNature) {
    selectEl.innerHTML = NATURES.map(n =>
        `<option value="${n.name}" ${n.name === defaultNature ? "selected" : ""}>${natureLabel(n)}</option>`
    ).join("");
    selectEl.onchange = () => calculateAndRender();
}

function setStatPointLabel(field, totalEl) {
    const label = field.querySelector(".dc-label");
    const textNode = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = "EV ";
        totalEl.textContent = "0 / 510 EV";
}

function setupAbilitySelect(selectEl, helpEl, pokemonData) {
    const abilities = pokemonData.abilities || [];
    selectEl.innerHTML = abilities.map(entry => {
        const name = capitalizeWords(entry.ability.name.replace(/-/g, " "));
        return `<option value="${entry.ability.name}">${name}${entry.is_hidden ? " (Hidden)" : ""}</option>`;
    }).join("");

    const updateHelp = () => {
        helpEl.textContent = getAbilitySummary(selectEl.value);
        calculateAndRender();
    };
    selectEl.onchange = updateHelp;
    updateHelp();
}

function getAbilitySummary(ability) {
    const summaries = {
        adaptability: "STAB is calculated as 2x instead of 1.5x.",
        pixilate: "Normal moves become Fairy and their base power is multiplied by 1.2 before STAB.",
        aerilate: "Normal moves become Flying and their base power is multiplied by 1.2 before STAB.",
        refrigerate: "Normal moves become Ice and their base power is multiplied by 1.2 before STAB.",
        galvanize: "Normal moves become Electric and their base power is multiplied by 1.2 before STAB.",
        normalize: "Moves become Normal and their base power is multiplied by 1.2.",
        "liquid-voice": "Sound-based moves become Water-type.",
        "gorilla-tactics": "Physical Attack is multiplied by 1.5.",
        guts: "Attack is multiplied by 1.5 while affected by a status condition.",
        "flare-boost": "Special Attack is multiplied by 1.5 while burned.",
        "flash-fire": "Fire moves deal 1.5x damage after Flash Fire activates.",
        "protosynthesis": "Highest stat is boosted in sun (Attack/Sp. Atk x1.3; Speed x1.5).",
        "quark-drive": "Highest stat is boosted on Electric Terrain (Attack/Sp. Atk x1.3; Speed x1.5).",
        "orichalcum-pulse": "Attack is boosted by 1.3x in sun.",
        "hadron-engine": "Sp. Attack is boosted by 1.3x on Electric Terrain.",
        "huge-power": "Physical Attack is doubled.",
        "pure-power": "Physical Attack is doubled.",
        hustle: "Physical Attack is multiplied by 1.5x (accuracy is not shown).",
        technician: "Moves with base power 60 or lower deal 1.5x damage.",
        "iron-fist": "Punching moves deal 1.2x damage when detected.",
        "tough-claws": "Contact moves deal 1.3x damage when detected.",
        "sheer-force": "Moves with secondary effects deal 1.3x damage.",
        sharpness: "Slicing moves deal 1.5x damage.",
        reckless: "Recoil moves deal 1.2x damage.",
        "steelworker": "Steel-type damage is multiplied by 1.5x.",
        "steely-spirit": "Steel-type damage is multiplied by 1.5x.",
        "dragon-s-maw": "Dragon-type damage is multiplied by 1.5x.",
        transistor: "Electric-type damage is multiplied by 1.3x.",
        "rocky-payload": "Rock-type damage is multiplied by 1.5x.",
        blaze: "Fire damage is multiplied by 1.5x when HP is at or below 1/3.",
        torrent: "Water damage is multiplied by 1.5x when HP is at or below 1/3.",
        overgrow: "Grass damage is multiplied by 1.5x when HP is at or below 1/3.",
        swarm: "Bug damage is multiplied by 1.5x when HP is at or below 1/3.",
        "solar-power": "Special Attack is multiplied by 1.5x in sun.",
        "sand-force": "Rock, Ground and Steel damage is multiplied by 1.3x in sand.",
        "water-bubble": "Water damage is doubled; Fire damage received is halved.",
        "neuroforce": "Super-effective damage is multiplied by 1.25.",
        stakeout: "Damage is doubled against a Pokémon that just switched in.",
        "supreme-overlord": "Damage rises by 10% per fainted teammate, up to 1.5x.",
        analytic: "Damage is multiplied by 1.3 when moving after the target.",
        rivalry: "Damage is multiplied by 1.25 against a target of the same gender.",
        sniper: "Critical-hit damage is multiplied by 1.5 (2.25x total critical damage).",
        "toxic-boost": "Physical Attack is multiplied by 1.5 while poisoned.",
        disguise: "The first damaging hit is reduced to 1/8 of max HP.",
        multiscale: "Damage is halved while at full HP.",
        "shadow-shield": "Damage is halved while at full HP.",
        "marvel-scale": "Defense is multiplied by 1.5 while affected by a status condition.",
        "grass-pelt": "Defense is multiplied by 1.5 on Grassy Terrain.",
        sturdy: "A full-HP Pokémon survives a hit that would otherwise KO it.",
        "ice-face": "The first physical hit deals no damage while Ice Face is intact.",
        "purifying-salt": "Damage from Ghost moves is halved.",
        "wonder-guard": "Only super-effective moves can deal damage.",
        "magic-guard": "Only direct attack damage is received; this calculator already models direct attacks only.",
        fluffy: "Contact damage is halved; Fire damage is doubled.",
        heatproof: "Fire damage received is halved.",
        "solid-rock": "Super-effective damage is reduced by 25%.",
        filter: "Super-effective damage is reduced by 25%.",
        "prism-armor": "Super-effective damage is reduced by 25%.",
        "thick-fat": "Fire and Ice damage is halved.",
        levitate: "Ground-type moves deal no damage."
    };
    return summaries[ability] || "Selected ability is included when its damage effect can be determined.";
}

function renderStatPointGrid(gridEl, totalEl, statPoints, pokemonData, natureSelect, onChange) {
    gridEl.classList.add("dc-stat-point-grid");
    gridEl.innerHTML = STAT_KEYS.map(key => `
        <div class="dc-stat-point-row">
            <span class="dc-stat-point-name">${STAT_LABEL[key]}</span>
            <strong class="dc-stat-point-value" data-value-for="${key}">0</strong>
                <input type="range" min="0" max="252" step="4" value="0" data-stat="${key}" class="dc-stat-point-slider" aria-label="${STAT_LABEL[key]} EV">
            <output class="dc-stat-point-count" data-count-for="${key}">0</output>
        </div>
    `).join("");

    const finalStat = key => statAtLevel50(
        getBaseStat(pokemonData, key),
        statPoints[key],
        key === "hp",
        natureMultiplier(natureSelect.value, key)
    );
    const update = () => {
        const total = STAT_KEYS.reduce((sum, key) => sum + statPoints[key], 0);
        totalEl.textContent = `${total} / 510 EV`;
        totalEl.classList.toggle("dc-ev-over", total > 510);
        gridEl.querySelectorAll(".dc-stat-point-slider").forEach(slider => {
            const key = slider.dataset.stat;
            slider.max = Math.max(statPoints[key], Math.min(252, 510 - (total - statPoints[key])));
            slider.value = statPoints[key];
            slider.style.setProperty("--stat-fill", `${(statPoints[key] / 252) * 100}%`);
            gridEl.querySelector(`[data-count-for="${key}"]`).textContent = statPoints[key];
            gridEl.querySelector(`[data-value-for="${key}"]`).textContent = finalStat(key);
        });
    };

    const previousNatureChange = natureSelect.onchange;
    natureSelect.onchange = () => {
        update();
        previousNatureChange?.();
    };

    gridEl.querySelectorAll(".dc-stat-point-slider").forEach(slider => {
        slider.addEventListener("input", () => {
            const key = slider.dataset.stat;
            statPoints[key] = Math.max(0, Math.min(Number(slider.value), 252));
            update();
            onChange();
        });
    });
    update();
}

function renderPreview(container, data) {
    const sprite = data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "";
    const types = data.types.map(t => t.type.name);
    const name = capitalizeWords(data.name.replace(/-/g, " "));

    container.innerHTML = `
        <img src="${sprite}" alt="${name}" class="dc-preview-sprite" loading="lazy">
        <div>
            <div class="dc-preview-name">${name}</div>
            <div class="dc-preview-types">
                ${types.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join("")}
            </div>
        </div>
    `;
}

function populateMoveSelect(pokemonData) {
    availableMoves = [...pokemonData.moves]
        .map(m => ({ name: m.move.name, url: m.move.url }))
        .sort((a, b) => a.name.localeCompare(b.name));

    renderMoveOptions(availableMoves);

    if (availableMoves.length > 0) {
        loadSelectedMove(availableMoves[0].url);
    }
}

function renderMoveOptions(moves) {
    moveSelect.innerHTML = moves.map(m =>
        `<option value="${m.url}">${capitalizeWords(m.name.replace(/-/g, " "))}</option>`
    ).join("");
}

moveSearch.addEventListener("input", () => {
    const query = moveSearch.value.trim().toLowerCase();
    const filteredMoves = availableMoves.filter(move =>
        move.name.replace(/-/g, " ").includes(query)
    );
    renderMoveOptions(filteredMoves);
    if (filteredMoves.length > 0) loadSelectedMove(filteredMoves[0].url);
});

function updateSelectionPreview(select, preview, iconMap) {
    const icon = iconMap[select.value] || "•";
    const label = select.options[select.selectedIndex]?.textContent || "";
    preview.innerHTML = `<span class="dc-selection-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
}

moveSelect.addEventListener("change", () => {
    loadSelectedMove(moveSelect.value);
});

async function loadSelectedMove(moveUrl) {
    try {
        const res = await fetch(moveUrl);
        if (!res.ok) return;
        const data = await res.json();

        selectedMove = {
            name: data.name,
            power: data.power,
            type: data.type.name,
            damageClass: data.damage_class.name,
            accuracy: data.accuracy,
            meta: data.meta || {},
            effectChance: data.effect_chance,
            priority: data.priority || 0
        };

        updateCalculateButton();
        calculateAndRender();
    } catch {
        // bỏ qua nếu lỗi mạng
    }
}

atkStageSelect.addEventListener("change", calculateAndRender);
defStageSelect.addEventListener("change", calculateAndRender);
[atkItemSelect, defItemSelect, weatherSelect, terrainSelect, critSelect, helpingHandInput, attackerLowHpInput, defenderFullHpInput, defenderDisguiseInput, defenderStatusSelect, defenderIceFaceInput, attackerStatusSelect, flashFireInput, defenderSwitchedInInput, attackerMovesSecondInput, rivalrySelect, faintedAlliesSelect]
    .forEach(control => control.addEventListener("change", calculateAndRender));

atkItemSelect.addEventListener("change", () => updateSelectionPreview(atkItemSelect, atkItemPreview, ITEM_ICONS));
defItemSelect.addEventListener("change", () => updateSelectionPreview(defItemSelect, defItemPreview, ITEM_ICONS));
weatherSelect.addEventListener("change", () => updateSelectionPreview(weatherSelect, weatherPreview, WEATHER_ICONS));
updateSelectionPreview(atkItemSelect, atkItemPreview, ITEM_ICONS);
updateSelectionPreview(defItemSelect, defItemPreview, ITEM_ICONS);
updateSelectionPreview(weatherSelect, weatherPreview, WEATHER_ICONS);


// ========================================
// TÍNH TOÁN SÁT THƯƠNG
// ========================================

// Công thức chuẩn: Level 50, IV 31 cố định — EV & Nature theo lựa chọn thực tế
function statAtLevel50(base, ev, isHp, natureMult) {
    const iv = 31;
    const level = 50;
    const intermediate = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
    if (isHp) return intermediate + level + 10;
    return Math.floor((intermediate + 5) * natureMult);
}

function stageMultiplier(stage) {
    const s = Number(stage);
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

function applyStage(stat, stage) {
    return Math.floor(stat * stageMultiplier(stage));
}

function getBaseStat(pokemonData, statName) {
    const found = pokemonData.stats.find(s => s.stat.name === statName);
    return found ? found.base_stat : 0;
}

const MOVE_TAGS = {
    sound: new Set(["boomburst", "bug-buzz", "clanging-scales", "disarming-voice", "echoed-voice", "hyper-voice", "noble-roar", "parting-shot", "relic-song", "round", "sing", "snarl", "sparkling-aria", "sparkling-torque", "supersonic", "uproar"]),
    wind: new Set(["gust", "hurricane", "icy-wind", "petal-blizzard", "razor-wind", "sandstorm", "twister", "whirlwind"]),
    ballistic: new Set(["bullet-seed", "egg-bomb", "electro-ball", "energy-ball", "focus-blast", "gunk-shot", "ice-ball", "mist-ball", "mud-bomb", "octazooka", "rock-blast", "seed-bomb", "shadow-ball", "sludge-bomb", "weather-ball", "zap-cannon"]),
    damp: new Set(["explosion", "self-destruct", "mind-blown", "misty-explosion"]),
    bite: new Set(["bite", "bite-of-the-ruins", "crunch", "fire-fang", "fishious-rend", "hyper-fang", "ice-fang", "jaw-lock", "poison-fang", "psychic-fangs", "thunder-fang"]),
    punch: new Set(["bullet-punch", "comet-punch", "drain-punch", "fire-punch", "focus-punch", "hammer-arm", "ice-hammer", "ice-punch", "mach-punch", "mega-punch", "power-up-punch", "shadow-punch", "sky-uppercut", "thunder-punch"]),
    contact: new Set(["aqua-jet", "aqua-tail", "body-slam", "close-combat", "crunch", "double-edge", "dragon-claw", "dragon-rush", "drain-punch", "facade", "fake-out", "flare-blitz", "headlong-rush", "ice-spinner", "icicle-crash", "iron-head", "knock-off", "liquidation", "outrage", "play-rough", "return", "take-down", "throat-chop", "u-turn", "uturn", "waterfall", "wild-charge", "wood-hammer", "zen-headbutt"]),
    recoil: new Set(["brave-bird", "double-edge", "flare-blitz", "head-smash", "submission", "take-down", "volt-tackle", "wave-crash", "wood-hammer"]),
    pulse: new Set(["aura-sphere", "dark-pulse", "dragon-pulse", "heal-pulse", "origin-pulse", "terrain-pulse", "water-pulse"]),
    slicing: new Set(["aerial-ace", "air-slash", "aqua-cutter", "behemoth-blade", "ceaseless-edge", "cross-poison", "cut", "kowtow-cleave", "leaf-blade", "mighty-cleave", "night-slash", "population-bomb", "psycho-cut", "razor-leaf", "razor-shell", "sacred-sword", "secret-sword", "slash", "solar-blade", "stone-axe", "x-scissor"])
};

function getEffectiveMove(move, ability) {
    const conversions = { pixilate: "fairy", aerilate: "flying", refrigerate: "ice", galvanize: "electric", dragonize: "dragon" };
    let type = move.type;
    let power = move.power;
    const notes = [];

    if (ability === "normalize") {
        type = "normal";
        power = Math.floor(power * 1.2);
        notes.push("Normalize: move → NORMAL (BP x1.2)");
    } else if (ability === "liquid-voice" && MOVE_TAGS.sound.has(move.name)) {
        type = "water";
        notes.push("Liquid Voice: sound move → WATER");
    } else if (move.type === "normal" && conversions[ability]) {
        type = conversions[ability];
        power = Math.floor(power * 1.2);
        notes.push(`${capitalizeWords(ability)}: NORMAL → ${type.toUpperCase()} (BP x1.2)`);
    }
    if (ability === "technician" && power <= 60) {
        power = Math.floor(power * 1.5);
        notes.push("Technician: BP x1.5");
    }
    if (ability === "iron-fist" && MOVE_TAGS.punch.has(move.name)) {
        power = Math.floor(power * 1.2);
        notes.push("Iron Fist: BP x1.2");
    }
    if (ability === "strong-jaw" && MOVE_TAGS.bite.has(move.name)) {
        power = Math.floor(power * 1.5);
        notes.push("Strong Jaw: BP x1.5");
    }
    if (ability === "mega-launcher" && MOVE_TAGS.pulse.has(move.name)) {
        power = Math.floor(power * 1.5);
        notes.push("Mega Launcher: BP x1.5");
    }
    if (ability === "tough-claws" && MOVE_TAGS.contact.has(move.name)) {
        power = Math.floor(power * 1.3);
        notes.push("Tough Claws: BP x1.3");
    }
    if (ability === "punk-rock" && MOVE_TAGS.sound.has(move.name)) {
        power = Math.floor(power * 1.3);
        notes.push("Punk Rock: BP x1.3");
    }
    if (ability === "sharpness" && MOVE_TAGS.slicing.has(move.name)) {
        power = Math.floor(power * 1.5);
        notes.push("Sharpness: slicing move BP x1.5");
    }
    return { ...move, type, power, notes };
}

function getAbilityDamageModifiers(move, attackerAbility, defenderAbility, typeEff, weather, terrain, attackerLowHp, defenderFullHp, attackerStatus, flashFireActive, defenderSwitchedIn, attackerMovesSecond, rivalry, faintedAllies, highestStat, defenderStatus) {
    let attackStatMultiplier = 1;
    let damageMultiplier = 1;
    let defenseMultiplier = 1;
    const notes = [];
    const isPhysical = move.damageClass === "physical";

    const abilityTypeBoosts = {
        "steelworker": "steel", "steely-spirit": "steel", "dragon-s-maw": "dragon",
        transistor: "electric", "rocky-payload": "rock"
    };
    const lowHpBoosts = { blaze: "fire", torrent: "water", overgrow: "grass", swarm: "bug" };

    if (isPhysical && ["huge-power", "pure-power"].includes(attackerAbility)) {
        attackStatMultiplier *= 2;
        notes.push("Ability x2 Attack");
    }
    if (isPhysical && attackerAbility === "hustle") {
        attackStatMultiplier *= 1.5;
        notes.push("Hustle: Attack x1.5");
    }
    if (isPhysical && attackerAbility === "gorilla-tactics") {
        attackStatMultiplier *= 1.5;
        notes.push("Gorilla Tactics: Attack x1.5");
    }
    if (isPhysical && defenderAbility === "intimidate") {
        attackStatMultiplier *= 2 / 3;
        notes.push("Intimidate: Attack x0.67");
    }
    if (isPhysical && attackerAbility === "guts" && attackerStatus !== "none") {
        attackStatMultiplier *= 1.5;
        notes.push("Guts: Attack x1.5");
    }
    if (isPhysical && attackerAbility === "toxic-boost" && ["poison", "toxic"].includes(attackerStatus)) {
        attackStatMultiplier *= 1.5;
        notes.push("Toxic Boost: Attack x1.5");
    }
    if (!isPhysical && attackerAbility === "flare-boost" && attackerStatus === "burn") {
        attackStatMultiplier *= 1.5;
        notes.push("Flare Boost: Sp. Attack x1.5");
    }
    if (isPhysical && attackerStatus === "burn" && attackerAbility !== "guts") {
        attackStatMultiplier *= 0.5;
        notes.push("Burn: Attack x0.5");
    }
    if (isPhysical && attackerAbility === "orichalcum-pulse" && weather === "sun") {
        attackStatMultiplier *= 1.3;
        notes.push("Orichalcum Pulse: Attack x1.3");
    }
    if (attackerAbility === "hadron-engine" && terrain === "electric" && highestStat === "special-attack") {
        attackStatMultiplier *= 1.3;
        notes.push("Hadron Engine: Sp. Attack x1.3");
    }
    if (["protosynthesis", "quark-drive"].includes(attackerAbility)) {
        const active = attackerAbility === "protosynthesis" ? weather === "sun" : terrain === "electric";
        const usesHighestStat = (isPhysical && highestStat === "attack") ||
            (!isPhysical && highestStat === "special-attack");
        if (active && usesHighestStat) {
            attackStatMultiplier *= 1.3;
            notes.push(`${capitalizeWords(attackerAbility.replace(/-/g, " "))}: ${highestStat} x1.3`);
        }
    }
    if (abilityTypeBoosts[attackerAbility] === move.type) {
        const typeBoost = attackerAbility === "transistor" ? 1.3 : 1.5;
        damageMultiplier *= typeBoost;
        notes.push(`${capitalizeWords(attackerAbility.replace(/-/g, " "))}: ${move.type} damage x${typeBoost}`);
    }
    if (lowHpBoosts[attackerAbility] === move.type && attackerLowHp) {
        damageMultiplier *= 1.5;
        notes.push(`${capitalizeWords(attackerAbility)}: low HP ${move.type} damage x1.5`);
    }
    if (attackerAbility === "solar-power" && weather === "sun" && !isPhysical) {
        attackStatMultiplier *= 1.5;
        notes.push("Solar Power: Sp. Attack x1.5");
    }
    if (attackerAbility === "sand-force" && weather === "sand" && ["rock", "ground", "steel"].includes(move.type)) {
        damageMultiplier *= 1.3;
        notes.push("Sand Force: damage x1.3");
    }
    if (attackerAbility === "water-bubble" && move.type === "water") {
        damageMultiplier *= 2;
        notes.push("Water Bubble: Water damage x2");
    }
    if (attackerAbility === "flash-fire" && flashFireActive && move.type === "fire") {
        damageMultiplier *= 1.5;
        notes.push("Flash Fire: Fire damage x1.5");
    }
    if (attackerAbility === "reckless" && MOVE_TAGS.recoil.has(move.name)) {
        damageMultiplier *= 1.2;
        notes.push("Reckless: recoil move x1.2");
    }
    if (attackerAbility === "sheer-force" && move.effectChance) {
        damageMultiplier *= 1.3;
        notes.push("Sheer Force: secondary-effect damage x1.3");
    }
    if (attackerAbility === "tinted-lens" && typeEff > 0 && typeEff < 1) {
        damageMultiplier *= 2;
        notes.push("Tinted Lens x2");
    }
    if (attackerAbility === "neuroforce" && typeEff > 1) {
        damageMultiplier *= 1.25;
        notes.push("Neuroforce: super-effective damage x1.25");
    }
    if (attackerAbility === "stakeout" && defenderSwitchedIn) {
        damageMultiplier *= 2;
        notes.push("Stakeout: damage x2");
    }
    if (attackerAbility === "supreme-overlord" && faintedAllies > 0) {
        const multiplier = Math.min(1.5, 1 + faintedAllies * 0.1);
        damageMultiplier *= multiplier;
        notes.push(`Supreme Overlord: damage x${multiplier.toFixed(1)}`);
    }
    if (attackerAbility === "analytic" && attackerMovesSecond) {
        damageMultiplier *= 1.3;
        notes.push("Analytic: damage x1.3");
    }
    if (attackerAbility === "rivalry" && rivalry === "same") {
        damageMultiplier *= 1.25;
        notes.push("Rivalry: same gender x1.25");
    } else if (attackerAbility === "rivalry" && rivalry === "different") {
        damageMultiplier *= 0.75;
        notes.push("Rivalry: different gender x0.75");
    }
    if (defenderAbility === "thick-fat" && ["fire", "ice"].includes(move.type)) {
        defenseMultiplier *= 0.5;
        notes.push("Thick Fat x0.5");
    }
    if (["solid-rock", "filter", "prism-armor"].includes(defenderAbility) && typeEff > 1) {
        defenseMultiplier *= 0.75;
        notes.push("Defender ability x0.75");
    }
    if (defenderAbility === "fur-coat" && isPhysical) {
        defenseMultiplier *= 0.5;
        notes.push("Fur Coat x0.5");
    }
    if (defenderAbility === "ice-scales" && !isPhysical) {
        defenseMultiplier *= 0.5;
        notes.push("Ice Scales x0.5");
    }
    if (defenderAbility === "marvel-scale" && defenderStatus !== "none") {
        defenseMultiplier /= 1.5;
        notes.push("Marvel Scale: Defense x1.5");
    }
    if (defenderAbility === "grass-pelt" && terrain === "grassy" && isPhysical) {
        defenseMultiplier /= 1.5;
        notes.push("Grass Pelt: Defense x1.5");
    }
    if (["multiscale", "shadow-shield"].includes(defenderAbility) && defenderFullHp) {
        defenseMultiplier *= 2;
        notes.push(`${capitalizeWords(defenderAbility.replace(/-/g, " "))}: damage x0.5 at full HP`);
    }
    if (defenderAbility === "fluffy" && isPhysical && MOVE_TAGS.contact.has(move.name)) {
        defenseMultiplier *= 2;
        notes.push("Fluffy: contact damage x0.5");
    }
    if (defenderAbility === "fluffy" && move.type === "fire") {
        defenseMultiplier *= 0.5;
        notes.push("Fluffy: Fire damage x2");
    }
    if (defenderAbility === "heatproof" && move.type === "fire") {
        defenseMultiplier *= 2;
        notes.push("Heatproof: Fire damage x0.5");
    }
    if (defenderAbility === "water-bubble" && move.type === "fire") {
        defenseMultiplier *= 2;
        notes.push("Water Bubble: Fire damage x0.5");
    }
    if (defenderAbility === "dry-skin" && move.type === "fire") {
        defenseMultiplier *= 1.25;
        notes.push("Dry Skin: Fire damage x1.25");
    }
    if (defenderAbility === "dauntless-shield" && isPhysical) {
        defenseMultiplier *= 2 / 3;
        notes.push("Dauntless Shield: Defense x1.5");
    }
    if (defenderAbility === "purifying-salt" && move.type === "ghost") {
        defenseMultiplier *= 0.5;
        notes.push("Purifying Salt: Ghost damage x0.5");
    }

    return { attackStatMultiplier, damageMultiplier, defenseMultiplier, notes };
}

function getAbilityImmunity(move, defenderAbility, typeEff) {
    const immunityByAbility = {
        levitate: ["ground"],
        "water-absorb": ["water"],
        "storm-drain": ["water"],
        "dry-skin": ["water"],
        "volt-absorb": ["electric"],
        "lightning-rod": ["electric"],
        "motor-drive": ["electric"],
        "flash-fire": ["fire"],
        "sap-sipper": ["grass"],
        "earth-eater": ["ground"],
        "well-baked-body": ["fire"]
    };
    return immunityByAbility[defenderAbility]?.includes(move.type) ||
        (defenderAbility === "soundproof" && MOVE_TAGS.sound.has(move.name)) ||
        (defenderAbility === "wind-rider" && MOVE_TAGS.wind.has(move.name)) ||
        (defenderAbility === "bulletproof" && MOVE_TAGS.ballistic.has(move.name)) ||
        (defenderAbility === "damp" && MOVE_TAGS.damp.has(move.name)) ||
        (defenderAbility === "wonder-guard" && typeEff <= 1);
}

function calculateDamageRolls(level, power, attack, defense, modifiers) {
    // The games use every integer random value from 217 to 255 / 255.
    const baseDamage = calculateBaseDamage(level, power, attack, defense);
    const modifiedDamage = applyDamageModifiers(baseDamage, modifiers);
    return Array.from({ length: 39 }, (_, index) => {
        const random = 217 + index;
        return Math.floor(modifiedDamage * random / 255);
    });
}

function calculateBaseDamage(level, power, attack, defense) {
    const levelStep = Math.floor((2 * level) / 5) + 2;
    const powerStep = levelStep * power;
    const attackStep = Math.floor(powerStep * attack / defense);
    return Math.floor(attackStep / 50) + 2;
}

function applyDamageModifiers(damage, modifiers) {
    return modifiers.reduce((value, modifier) => Math.floor(value * modifier), damage);
}

function isGrounded(pokemonData, ability) {
    return !pokemonData.types.some(type => type.type.name === "flying") && ability !== "levitate";
}

function getWeatherModifier(weather, moveType) {
    if (weather === "sun") {
        if (moveType === "fire") return 1.5;
        if (moveType === "water") return 0.5;
    }
    if (weather === "rain") {
        if (moveType === "water") return 1.5;
        if (moveType === "fire") return 0.5;
    }
    return 1;
}

function getTerrainModifier(terrain, moveType, attackerGrounded, defenderGrounded) {
    if (attackerGrounded) {
        if (terrain === "electric" && moveType === "electric") return 1.3;
        if (terrain === "grassy" && moveType === "grass") return 1.3;
        if (terrain === "psychic" && moveType === "psychic") return 1.3;
    }
    if (terrain === "misty" && moveType === "dragon" && defenderGrounded) return 0.5;
    return 1;
}

function getItemAttackModifier(item, isPhysical) {
    if (item === "choice-band" && isPhysical) return 1.5;
    if (item === "choice-specs" && !isPhysical) return 1.5;
    if (item === "muscle-band" && isPhysical) return 1.1;
    if (item === "wise-glasses" && !isPhysical) return 1.1;
    return 1;
}

function getItemDamageModifier(item, typeEff) {
    if (item === "life-orb") return 1.3;
    if (item === "expert-belt" && typeEff > 1) return 1.2;
    return 1;
}

const TYPE_BOOST_ITEMS = {
    "mystic-water": "water",
    charcoal: "fire",
    "miracle-seed": "grass",
    magnet: "electric",
    "never-melt-ice": "ice",
    "black-belt": "fighting",
    "poison-barb": "poison",
    "soft-sand": "ground",
    "sharp-beak": "flying",
    "twisted-spoon": "psychic",
    "silver-powder": "bug",
    "hard-stone": "rock",
    "spell-tag": "ghost",
    "dragon-fang": "dragon",
    "black-glasses": "dark",
    "metal-coat": "steel",
    "pixie-plate": "fairy"
};

function getTypeBoostItemModifier(item, moveType) {
    return TYPE_BOOST_ITEMS[item] === moveType ? 1.2 : 1;
}

function getDefenseItemModifier(item, isPhysical, pokemonData) {
    if (item === "eviolite" && !pokemonData.isFullyEvolved) return 1.5;
    if (item === "assault-vest" && !isPhysical) return 1.5;
    return 1;
}

async function getFullyEvolvedStatus(pokemonData) {
    try {
        const speciesResponse = await fetch(pokemonData.species.url);
        const species = await speciesResponse.json();
        const chainResponse = await fetch(species.evolution_chain.url);
        const chain = await chainResponse.json();
        const finalSpecies = new Set();
        const collectFinalSpecies = node => {
            if (!node.evolves_to.length) finalSpecies.add(node.species.name);
            node.evolves_to.forEach(collectFinalSpecies);
        };
        collectFinalSpecies(chain.chain);
        return finalSpecies.has(species.name);
    } catch {
        return true;
    }
}

function getWeatherDefenseModifier(weather, pokemonData, isPhysical) {
    if (weather === "snow" && isPhysical && pokemonData.types.some(type => type.type.name === "ice")) return 1.5;
    if (weather === "sand" && !isPhysical && pokemonData.types.some(type => type.type.name === "rock")) return 1.5;
    return 1;
}

function calculateAndRender() {
    if (!attacker || !defender || !selectedMove) return;

    if (selectedMove.damageClass === "status") {
        resultBox.innerHTML = `
            <div class="dc-result-box">
                <p class="dc-no-damage">
                    💬 <strong>${capitalizeWords(selectedMove.name.replace(/-/g, " "))}</strong> là chiêu hỗ trợ (status),
                    không trực tiếp gây sát thương.
                </p>
            </div>
        `;
        return;
    }

    if (selectedMove.power === null) {
        resultBox.innerHTML = `
            <div class="dc-result-box">
                <p class="dc-no-damage">
                    💬 Chiêu này không có chỉ số sức mạnh cố định (biến đổi theo điều kiện đặc biệt) —
                    công cụ chưa hỗ trợ tính chính xác cho trường hợp này.
                </p>
            </div>
        `;
        return;
    }

    const isPhysical = selectedMove.damageClass === "physical";
    const atkStatName = isPhysical ? "attack" : "special-attack";
    const defStatName = isPhysical ? "defense" : "special-defense";

    const attackerAbility = atkAbilitySelect.value;
    const selectedDefenderAbility = defAbilitySelect.value;
    const ignoresDefenderAbility = ["mold-breaker", "teravolt", "turboblaze"].includes(attackerAbility);
    const defenderAbility = ignoresDefenderAbility ? "" : selectedDefenderAbility;
    const effectiveMove = getEffectiveMove(selectedMove, attackerAbility);
    const attackerItem = atkItemSelect.value;
    const defenderItem = defItemSelect.value;
    const isCritical = critSelect.checked;

    const atkBase = getBaseStat(attacker.data, atkStatName);
    const defBase = getBaseStat(defender.data, defStatName);

    const atkNatureMult = natureMultiplier(atkNatureSelect.value, atkStatName);
    const defNatureMult = natureMultiplier(defNatureSelect.value, defStatName);

    const attackerStage = isCritical
        ? Math.max(0, Number(atkStageSelect.value))
        : (defenderAbility === "unaware" ? 0 : atkStageSelect.value);
    const defenderStage = isCritical
        ? Math.min(0, Number(defStageSelect.value))
        : (attackerAbility === "unaware" ? 0 : defStageSelect.value);
    const ABase = applyStage(
        statAtLevel50(atkBase, atkEv[atkStatName], false, atkNatureMult) * getItemAttackModifier(attackerItem, isPhysical),
        attackerStage
    );
    const D = applyStage(
        statAtLevel50(defBase, defEv[defStatName], false, defNatureMult) *
            getDefenseItemModifier(defenderItem, isPhysical, defender.data) *
            getWeatherDefenseModifier(weatherSelect.value, defender.data, isPhysical),
        defenderStage
    );

    const defenderHp = statAtLevel50(getBaseStat(defender.data, "hp"), defEv.hp, true, 1);
    const highestStat = ["attack", "defense", "special-attack", "special-defense", "speed"]
        .reduce((highest, statName) => {
            const value = statAtLevel50(
                getBaseStat(attacker.data, statName),
                atkEv[statName],
                false,
                natureMultiplier(atkNatureSelect.value, statName)
            );
            return value > highest.value ? { name: statName, value } : highest;
        }, { name: "", value: -1 }).name;

    const attackerTypes = attacker.data.types.map(t => t.type.name);
    const defenderTypes = defender.data.types.map(t => t.type.name);
    const attackerGrounded = isGrounded(attacker.data, attackerAbility);
    const defenderGrounded = isGrounded(defender.data, defenderAbility);

    const stab = attackerTypes.includes(effectiveMove.type) ? (attackerAbility === "adaptability" ? 2 : 1.5) : 1;
    const typeEff = defenderTypes.reduce((acc, t) => acc * getAttackMultiplier(effectiveMove.type, t), 1);
    const priorityBlocked = effectiveMove.priority > 0 && ["queenly-majesty", "armor-tail", "dazzling"].includes(defenderAbility);
    const abilityImmune = priorityBlocked || getAbilityImmunity(effectiveMove, defenderAbility, typeEff);

    if (typeEff === 0 || abilityImmune) {
        resultBox.innerHTML = `
            <div class="dc-result-box">
                <p class="dc-no-damage">
                    🚫 <strong>${capitalizeWords(defender.data.name.replace(/-/g, " "))}</strong>
                    miễn nhiễm với hệ <strong>${effectiveMove.type.toUpperCase()}</strong> — sát thương = 0.
                </p>
            </div>
        `;
        return;
    }

    const abilityModifiers = getAbilityDamageModifiers(
        effectiveMove,
        attackerAbility,
        defenderAbility,
        typeEff,
        weatherSelect.value,
        terrainSelect.value,
        attackerLowHpInput.checked,
        defenderFullHpInput.checked,
        attackerStatusSelect.value,
        flashFireInput.checked,
        defenderSwitchedInInput.checked,
        attackerMovesSecondInput.checked,
        rivalrySelect.value,
        Number(faintedAlliesSelect.value),
        highestStat,
        defenderStatusSelect.value
    );
    const A = Math.floor(ABase * abilityModifiers.attackStatMultiplier);

    const weatherModifier = getWeatherModifier(weatherSelect.value, effectiveMove.type);
    const terrainModifier = getTerrainModifier(
        terrainSelect.value,
        effectiveMove.type,
        attackerGrounded,
        defenderGrounded
    );
    const modifier = [
        stab,
        typeEff,
        abilityModifiers.damageMultiplier,
        abilityModifiers.defenseMultiplier,
        getItemDamageModifier(attackerItem, typeEff),
        getTypeBoostItemModifier(attackerItem, effectiveMove.type),
        weatherModifier,
        terrainModifier,
        isCritical ? (attackerAbility === "sniper" ? 2.25 : 1.5) : 1,
        helpingHandInput.checked ? 1.5 : 1
    ];
    const baseDamage = calculateBaseDamage(50, effectiveMove.power, A, D);
    const disguiseActive = defenderAbility === "disguise" && defenderDisguiseInput.checked;
    const sturdyActive = defenderAbility === "sturdy" && defenderFullHpInput.checked;
    const iceFaceActive = defenderAbility === "ice-face" && defenderIceFaceInput.checked && isPhysical;
    const rolls = calculateDamageRolls(50, effectiveMove.power, A, D, modifier)
        .map(damage => {
            if (iceFaceActive) return 0;
            if (disguiseActive) damage = Math.min(damage, Math.floor(defenderHp / 8));
            if (sturdyActive) damage = Math.min(damage, Math.max(0, defenderHp - 1));
            return damage;
        });
    if (disguiseActive) {
        abilityModifiers.notes.push("Disguise: damage capped at 1/8 max HP");
    }
    if (sturdyActive) abilityModifiers.notes.push("Sturdy: survives at 1 HP");
    if (iceFaceActive) abilityModifiers.notes.push("Ice Face: physical damage blocked");
    const minDamage = Math.min(...rolls);
    const maxDamage = Math.max(...rolls);

    const minPct = Math.min(100, ((minDamage / defenderHp) * 100)).toFixed(1);
    const maxPct = Math.min(100, ((maxDamage / defenderHp) * 100)).toFixed(1);

    const effLabel = typeEff > 1
        ? `<span class="dc-eff dc-eff-super">Hiệu quả cao (${typeEff}x)</span>`
        : typeEff < 1
            ? `<span class="dc-eff dc-eff-weak">Không hiệu quả (${typeEff}x)</span>`
            : `<span class="dc-eff dc-eff-normal">Bình thường (1x)</span>`;

    const koNote = minPct >= 100
        ? `<p class="dc-ko-note dc-ko-guaranteed">💀 Chắc chắn hạ gục (OHKO) trong mọi trường hợp roll.</p>`
        : maxPct >= 100
            ? `<p class="dc-ko-note dc-ko-possible">⚡ Có thể hạ gục (OHKO) nếu roll sát thương cao.</p>`
            : "";

    resultBox.innerHTML = `
        <div class="dc-result-box">
            <div class="dc-result-header">
                <span>${capitalizeWords(selectedMove.name.replace(/-/g, " "))}</span>
                <span class="type ${effectiveMove.type}">${effectiveMove.type.toUpperCase()}</span>
                ${stab > 1 ? `<span class="dc-stab-tag">STAB</span>` : ""}
                ${effLabel}
            </div>
            <div class="dc-damage-range">
                <strong>${minDamage} – ${maxDamage}</strong> sát thương
            </div>
            <details class="dc-calc-details">
                <summary>Chi tiết phép tính</summary>
                <p>Lv. 50 · BP ${effectiveMove.power} · ${isPhysical ? "ATK" : "SpA"} ${A} · ${isPhysical ? "DEF" : "SpD"} ${D} · HP ${defenderHp}</p>
                <p>Base damage ${baseDamage} · STAB x${stab} · Type x${typeEff} · Modifiers được làm tròn từng bước</p>
            </details>
            ${[...effectiveMove.notes, ...abilityModifiers.notes, ...[
                weatherModifier !== 1 ? `Weather x${weatherModifier}` : "",
                terrainModifier !== 1 ? `Terrain x${terrainModifier}` : "",
                attackerItem !== "none" ? `Item: ${capitalizeWords(attackerItem.replace(/-/g, " "))}` : "",
                defenderItem !== "none" ? `Defender item: ${capitalizeWords(defenderItem.replace(/-/g, " "))}` : "",
                isCritical ? `Critical hit x${attackerAbility === "sniper" ? 2.25 : 1.5}` : "",
                helpingHandInput.checked ? "Helping Hand x1.5" : ""
            ].filter(Boolean)].length ? `<p class="dc-ability-applied">✨ ${[...effectiveMove.notes, ...abilityModifiers.notes].concat([
                weatherModifier !== 1 ? `Weather x${weatherModifier}` : "",
                terrainModifier !== 1 ? `Terrain x${terrainModifier}` : "",
                attackerItem !== "none" ? `Item: ${capitalizeWords(attackerItem.replace(/-/g, " "))}` : "",
                defenderItem !== "none" ? `Defender item: ${capitalizeWords(defenderItem.replace(/-/g, " "))}` : "",
                isCritical ? `Critical hit x${attackerAbility === "sniper" ? 2.25 : 1.5}` : "",
                helpingHandInput.checked ? "Helping Hand x1.5" : ""
            ].filter(Boolean)).join(" · ")}</p>` : ""}
            <div class="dc-hp-bar-wrap">
                <div class="dc-hp-bar-bg">
                    <div class="dc-hp-bar-lost" style="width:${maxPct}%;"></div>
                    <div class="dc-hp-bar-lost-min" style="width:${minPct}%;"></div>
                </div>
                <span class="dc-hp-pct">${minPct}% – ${maxPct}% HP</span>
            </div>
            ${koNote}
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
