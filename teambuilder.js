// ========================================
// TEAM BUILDER — phân tích tương khắc đội hình
// Dùng dữ liệu hệ từ typechart-data.js, sprite/hệ Pokémon từ PokeAPI
// ========================================

const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
const MAX_TEAM_SIZE = 6;

let team = [];
let pokemonNameList = null;
let pokemonNameListPromise = null;
const moveDataCache = new Map();
let analysisVersion = 0;

const tbSearchInput = document.getElementById("tb-search-input");
const tbSearchSuggestions = document.getElementById("tb-search-suggestions");
const tbTeamGrid = document.getElementById("tb-team-grid");
const tbTeamCount = document.getElementById("tb-team-count");
const tbAnalysis = document.getElementById("tb-analysis");
const tbClearBtn = document.getElementById("tb-clear-btn");


// ========================================
// TÌM KIẾM & THÊM POKÉMON
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

tbSearchInput.addEventListener("focus", () => loadPokemonNameList(), { once: true });

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

let tbDebounceTimer = null;

tbSearchInput.addEventListener("input", () => {
    clearTimeout(tbDebounceTimer);
    const value = tbSearchInput.value;

    tbDebounceTimer = setTimeout(() => {
        const matches = searchPokemonNames(value);

        if (matches.length === 0) {
            tbSearchSuggestions.classList.remove("active");
            tbSearchSuggestions.innerHTML = "";
            return;
        }

        tbSearchSuggestions.innerHTML = matches.map(p => {
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
        tbSearchSuggestions.classList.add("active");
    }, 150);
});

tbSearchSuggestions.addEventListener("click", async event => {
    const item = event.target.closest(".search-suggestion");
    if (!item) return;

    tbSearchInput.value = "";
    tbSearchSuggestions.classList.remove("active");
    tbSearchSuggestions.innerHTML = "";

    await addPokemonToTeam(item.dataset.id);
});

tbSearchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") tbSearchSuggestions.classList.remove("active");
});

document.addEventListener("click", event => {
    if (!event.target.closest(".tb-search-wrap")) {
        tbSearchSuggestions.classList.remove("active");
    }
});

async function addPokemonToTeam(pokeApiName) {
    if (team.length >= MAX_TEAM_SIZE) return;
    if (team.some(p => p.id === pokeApiName)) return;

    try {
        const res = await fetch(`${POKE_API_BASE}/${pokeApiName}`);
        if (!res.ok) return;
        const data = await res.json();

        team.push({
            id: data.name,
            name: capitalizeWords(data.name.replace(/-/g, " ")),
            types: data.types.map(t => t.type.name),
            sprite: data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "",
            abilities: data.abilities.map(entry => entry.ability.name),
            stats: Object.fromEntries(data.stats.map(entry => [entry.stat.name, entry.base_stat])),
            moves: data.moves.map(entry => ({ name: entry.move.name, url: entry.move.url }))
        });

        renderTeam();
        renderAnalysis();
    } catch {
        // im lặng bỏ qua nếu lỗi mạng
    }
}

function removeFromTeam(id) {
    team = team.filter(p => p.id !== id);
    renderTeam();
    renderAnalysis();
}

tbClearBtn.addEventListener("click", () => {
    team = [];
    renderTeam();
    renderAnalysis();
});


// ========================================
// RENDER ĐỘI HÌNH
// ========================================

function renderTeam() {
    tbTeamCount.textContent = `${team.length} / ${MAX_TEAM_SIZE} Pokémon`;

    const slots = [];
    for (let i = 0; i < MAX_TEAM_SIZE; i++) {
        const p = team[i];
        if (p) {
            slots.push(`
                <div class="tb-slot filled" data-id="${p.id}">
                    <button class="tb-remove-btn" data-id="${p.id}" type="button" aria-label="Xoá">✕</button>
                    <img src="${p.sprite}" alt="${p.name}" class="tb-slot-sprite" loading="lazy">
                    <div class="tb-slot-name">${p.name}</div>
                    <div class="tb-slot-types">
                        ${p.types.map(t => `<span class="type ${t}">${t.toUpperCase()}</span>`).join("")}
                    </div>
                </div>
            `);
        } else {
            slots.push(`
                <div class="tb-slot empty">
                    <span class="tb-slot-plus">+</span>
                </div>
            `);
        }
    }

    tbTeamGrid.innerHTML = slots.join("");

    tbTeamGrid.querySelectorAll(".tb-remove-btn").forEach(btn => {
        btn.addEventListener("click", () => removeFromTeam(btn.dataset.id));
    });
}


// ========================================
// PHÂN TÍCH TƯƠNG KHẮC ĐỘI HÌNH
// ========================================

async function getMoveData(move) {
    if (moveDataCache.has(move.url)) return moveDataCache.get(move.url);
    try {
        const response = await fetch(move.url);
        if (!response.ok) return null;
        const data = await response.json();
        const result = {
            name: data.name,
            type: data.type?.name,
            power: data.power,
            damageClass: data.damage_class?.name,
            effect: data.meta?.category?.name
        };
        moveDataCache.set(move.url, result);
        return result;
    } catch {
        return null;
    }
}

async function loadTeamMoveData(currentVersion) {
    const uniqueMoves = [...new Map(team.flatMap(pokemon => pokemon.moves).map(move => [move.url, move])).values()];
    const moveResults = await Promise.all(uniqueMoves.map(getMoveData));
    if (currentVersion !== analysisVersion) return null;
    const byUrl = new Map(uniqueMoves.map((move, index) => [move.url, moveResults[index]]));
    return team.map(pokemon => pokemon.moves.map(move => byUrl.get(move.url)).filter(Boolean));
}

function getTeamMultiplier(pokemon, attackType) {
    return pokemon.types.reduce((total, defenseType) => total * getAttackMultiplier(attackType, defenseType), 1);
}

function renderAnalysisSection(title, className, items, emptyText) {
    return `
        <section class="tb-analysis-section ${className}">
            <h4>${title}</h4>
            <ul>${items.length ? items.join("") : `<li class="tb-analysis-empty">${emptyText}</li>`}</ul>
        </section>
    `;
}

async function renderAnalysis() {
    if (team.length === 0) {
        tbAnalysis.innerHTML = `
            <p class="meta-detail-placeholder">
                👆 Thêm ít nhất 1 Pokémon để bắt đầu phân tích đội hình.
            </p>
        `;
        return;
    }

    const currentVersion = ++analysisVersion;
    tbAnalysis.innerHTML = '<p class="tb-analysis-loading">Đang phân tích coverage, moveset và synergy...</p>';
    const teamMoves = await loadTeamMoveData(currentVersion);
    if (!teamMoves || currentVersion !== analysisVersion) return;

    const defensiveRows = TYPE_ORDER.map(attackType => {
        const weak = team.filter(pokemon => getTeamMultiplier(pokemon, attackType) > 1).length;
        const covered = team.filter(pokemon => getTeamMultiplier(pokemon, attackType) < 1).length;
        const immune = team.filter(pokemon => getTeamMultiplier(pokemon, attackType) === 0).length;
        return { type: attackType, weak, covered, immune };
    });
    const defensiveWeaknesses = defensiveRows.filter(row => row.weak > 0)
        .sort((a, b) => b.weak - b.covered - (a.weak - a.covered) || b.weak - a.weak);
    const defensiveStrengths = [];
    team.forEach(pokemon => {
        TYPE_ORDER.forEach(attackType => {
            const multiplier = getTeamMultiplier(pokemon, attackType);
            if (multiplier < 1) {
                defensiveStrengths.push({ pokemon: pokemon.name, type: attackType, multiplier });
            }
        });
    });

    const strengthHtml = defensiveStrengths.sort((a, b) => a.multiplier - b.multiplier)
        .slice(0, 6)
        .map(item => `
            <li>
                <strong>${item.pokemon}</strong> có thể counter hệ
                <span class="type ${item.type}">${TYPE_LABEL_VI[item.type]}</span>
                <small>(${item.multiplier}x damage nhận vào)</small>
            </li>
        `).join("") || "<li>Chưa có lợi thế phòng thủ rõ ràng.</li>";

    const weaknessHtml = defensiveWeaknesses.slice(0, 6).map(row => `
        <li>
            ${row.weak >= 3 ? "⚠ Cảnh báo: " : ""}Team dễ bị áp lực bởi hệ
            <span class="type ${row.type}">${TYPE_LABEL_VI[row.type]}</span>
            <small>(${row.weak}/${team.length} yếu${row.covered ? `, ${row.covered} kháng` : ""})</small>
        </li>
    `).join("") || "<li>Đội hình chưa có điểm yếu diện rộng rõ ràng.</li>";

    const offensiveCoverage = TYPE_ORDER.map(defenseType => {
        const attackers = [];
        teamMoves.forEach((moves, index) => {
            if (moves.some(move => move.damageClass !== "status" && move.power && getAttackMultiplier(move.type, defenseType) > 1)) {
                attackers.push(team[index].name);
            }
        });
        return { type: defenseType, attackers };
    });
    const missingCoverage = offensiveCoverage.filter(row => row.attackers.length === 0);
    const coverageItems = missingCoverage.length
        ? [`<li>Thiếu đòn siêu hiệu quả lên: ${missingCoverage.map(row => `<span class="type ${row.type}">${TYPE_LABEL_VI[row.type]}</span>`).join(" ")}</li>`]
        : ["<li>Đủ ít nhất một đòn siêu hiệu quả lên cả 18 hệ.</li>"];

    const physical = team.filter(pokemon => (pokemon.stats.attack || 0) >= (pokemon.stats["special-attack"] || 0));
    const special = team.filter(pokemon => (pokemon.stats["special-attack"] || 0) > (pokemon.stats.attack || 0));
    const physicalSweepers = team.filter(pokemon => (pokemon.stats.attack || 0) >= 100).length;
    const specialSweepers = team.filter(pokemon => (pokemon.stats["special-attack"] || 0) >= 100).length;
    const physicalWalls = team.filter(pokemon => (pokemon.stats.defense || 0) >= 100).length;
    const specialWalls = team.filter(pokemon => (pokemon.stats["special-defense"] || 0) >= 100).length;
    const distributionItems = [
        `<li>Thiên Physical: <strong>${physical.length}</strong> · Special: <strong>${special.length}</strong></li>`,
        `<li>Sweeper: <strong>${physicalSweepers}</strong> ATK · <strong>${specialSweepers}</strong> SpA</li>`,
        `<li>Wall: <strong>${physicalWalls}</strong> DEF · <strong>${specialWalls}</strong> SpD</li>`
    ];

    const moveNames = teamMoves.flat().map(move => move.name);
    const archetypes = [];
    if (moveNames.includes("trick-room")) archetypes.push("Có thể xây Trick Room");
    if (moveNames.includes("sunny-day") || team.some(p => p.abilities.includes("drought"))) archetypes.push("Có thể xây Sun");
    if (moveNames.includes("rain-dance") || team.some(p => p.abilities.includes("drizzle"))) archetypes.push("Có thể xây Rain");
    if (moveNames.includes("hail") || moveNames.includes("snowscape") || team.some(p => ["snow-warning", "snow-cloak"].some(a => p.abilities.includes(a)))) archetypes.push("Có thể xây Snow");
    if (team.some(p => p.types.includes("fire")) && team.some(p => p.types.includes("water")) && team.some(p => p.types.includes("grass"))) archetypes.push("Có core Fire / Water / Grass");
    if (team.some(p => p.types.includes("dragon")) && team.some(p => p.types.includes("fairy")) && team.some(p => p.types.includes("steel"))) archetypes.push("Có core Dragon / Fairy / Steel");

    const antiSynergies = [];
    if ((moveNames.includes("sunny-day") || team.some(p => p.abilities.includes("drought"))) && teamMoves.flat().some(move => move.type === "water" && move.power)) antiSynergies.push("Nếu dùng Sun, damage Water của đồng đội giảm 50%");
    if (teamMoves.some((moves, index) => moves.some(move => move.name === "earthquake") && team.some((pokemon, teammateIndex) => teammateIndex !== index && getTeamMultiplier(pokemon, "ground") > 0))) {
        antiSynergies.push("Nếu dùng Earthquake, có thể đánh trúng đồng đội không miễn Ground");
    }
    const synergyItems = archetypes.length ? archetypes.map(item => `<li>${item}</li>`) : ["<li>Chưa phát hiện archetype nổi bật.</li>"];
    const antiSynergyItems = antiSynergies.map(item => `<li>${item}</li>`);

    tbAnalysis.innerHTML = `
        <div class="tb-analysis-header">
            <div>
                <p class="section-label">TEAM CHECK</p>
                <h3 class="tb-analysis-title">Tóm tắt đội hình</h3>
            </div>
            <span class="tb-analysis-count">${team.length}/6 Pokémon</span>
        </div>
        <div class="tb-summary-grid">
            ${renderAnalysisSection("✓ Kháng / yếu hệ", "tb-summary-positive", [strengthHtml], "Chưa có lợi thế phòng thủ rõ ràng.")}
            ${renderAnalysisSection("! Điểm yếu", "tb-summary-negative", [weaknessHtml], "Đội hình chưa có điểm yếu rõ ràng.")}
            ${renderAnalysisSection("⚔ Độ phủ tấn công", "tb-summary-positive", coverageItems, "")}
            ${renderAnalysisSection("▣ Phân bổ damage", "tb-summary-neutral", distributionItems, "")}
            ${renderAnalysisSection("◇ Synergy / Archetype", "tb-summary-positive", synergyItems, "")}
            ${renderAnalysisSection("⚠ Anti-synergy", "tb-summary-negative", antiSynergyItems, "Chưa phát hiện xung đột rõ ràng.")}
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

renderTeam();
renderAnalysis();
