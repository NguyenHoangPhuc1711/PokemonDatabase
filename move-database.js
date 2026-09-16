const MOVE_TYPE_OPTIONS = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
];

const moveTypeFilter = document.getElementById("move-type-filter");
const movePokemonFilter = document.getElementById("move-pokemon-filter");
const movesTableBody = document.getElementById("moves-table-body");
const moveSearchInput = document.getElementById("move-search-input");
const movesList = document.getElementById("moves-list");
const movesEmpty = document.getElementById("moves-empty");
const moveResultsCount = document.getElementById("move-results-count");

const MOVE_SAMPLE_NAMES = ["ice-shard", "earthquake", "protect", "fake-out", "trick-room"];
const CHAMPIONS_META_URL = "https://eurekaffeine.github.io/pokemon-champions-scraper/battle_meta.json";
let moveList = [];
let sampleMoves = [];
let moveCache = new Map();
let metaRankings = [];
let metaPromise = null;
let searchTimer = null;

function capitalizeWords(str) {
  if (!str) return "—";
  return str
    .toLowerCase()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoveStat(value) {
  if (value === null || value === undefined || value === 0) return "—";
  return value;
}

function formatMoveName(name) {
  return capitalizeWords(name).replace(/\bHp\b/g, "HP");
}

function getPokemonId(url) {
  return url.split("/").filter(Boolean).pop();
}

function getMoveUsage(move) {
  return metaRankings
    .map(entry => {
      const usage = entry.top_moves?.find(item => Number(item.id) === Number(move.id));
      return usage ? { ...entry, moveUsage: usage.usage } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.moveUsage - a.moveUsage)
    .slice(0, 8);
}

function renderPokemonPreview(move) {
  const pokemon = getMoveUsage(move);
  if (!pokemon.length) return `<p class="move-no-pokemon">Chưa có dữ liệu usage cho move này.</p>`;

  return `<div class="move-pokemon-section">
    <div class="move-section-label">TOP POKÉMON</div>
    <div class="move-pokemon-grid">
      ${pokemon.map(item => {
        const name = formatMoveName(item.name);
        return `<a class="move-pokemon-card" href="PokemonDatabase.html?pokemon=${encodeURIComponent(item.name)}" title="Xem ${name}">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.dex_id}.png" alt="${name}" loading="lazy">
          <span>${name}</span><small>${(item.moveUsage * 100).toFixed(1)}%</small>
        </a>`;
      }).join("")}
    </div>
  </div>`;
}

function renderMoveCard(move) {
  const moveClass = ["physical", "special", "status"].includes(move.damageClass) ? move.damageClass : "status";
  return `<article class="move-result-card">
    <div class="move-card-main">
      <div class="move-card-heading">
        <div><p class="move-card-kicker">MOVE DATABASE</p><h3>${formatMoveName(move.name)}</h3></div>
        <span class="type move-card-type ${move.type}">${move.type.toUpperCase()}</span>
      </div>
      <div class="move-card-stats">
        <span class="move-damage-class ${moveClass}">${capitalizeWords(move.damageClass || "Status")}</span>
        <span>${formatMoveStat(move.power)} Power</span><span>${formatMoveStat(move.accuracy)}% Accuracy</span>
        <span>${formatMoveStat(move.pp)} PP</span><span>${move.contact ? "Contact" : "No Contact"}</span>
        <span>Priority: ${move.priority > 0 ? "+" : ""}${move.priority}</span>
      </div>
      <p class="move-card-effect">${move.effect}</p>
    </div>
    ${renderPokemonPreview(move)}
  </article>`;
}

function populateTypeOptions() {
  const options = MOVE_TYPE_OPTIONS.map(type => `<option value="${type}">${type.toUpperCase()}</option>`).join("");
  moveTypeFilter.innerHTML = `<option value="all">Tất cả</option>${options}`;
}

async function loadMetaRankings() {
  if (metaPromise) return metaPromise;
  metaPromise = fetch(CHAMPIONS_META_URL).then(response => response.json()).then(data => {
    metaRankings = Array.isArray(data.pokemon_usage) ? data.pokemon_usage.slice(0, 50) : [];
    const names = [...new Set(metaRankings.map(entry => entry.name).filter(Boolean))];
    movePokemonFilter.innerHTML = `<option value="all">Tất cả</option>${names.map(name => `<option value="${name.toLowerCase()}">${capitalizeWords(name)}</option>`).join("")}`;
  }).catch(() => { metaRankings = []; });
  return metaPromise;
}

async function loadMoveByName(name) {
  const key = name.toLowerCase().trim().replace(/\s+/g, "-");
  if (moveCache.has(key)) return moveCache.get(key);
  let detail;
  try {
    detail = await PokemonApi.getMove(key);
  } catch {
    return null;
  }
  const move = {
      id: detail.id,
      name: detail.name,
      type: detail.type?.name || "unknown",
      power: detail.power,
      accuracy: detail.accuracy,
      pp: detail.pp,
      priority: detail.priority || 0,
      contact: detail.meta?.makes_contact || false,
      damageClass: detail.damage_class?.name || "status",
      effect: detail.effect_entries?.find(entry => entry.language.name === "en")?.short_effect || detail.effect_entries?.[0]?.short_effect || "—",
      pokemon: detail.learned_by_pokemon || []
    };
  moveCache.set(key, move);
  return move;
}

async function loadSampleMoves() {
  const details = await Promise.all(MOVE_SAMPLE_NAMES.map(loadMoveByName));
  sampleMoves = details.filter(Boolean);
  moveList = sampleMoves;
}

function getFilteredMoveList() {
  const typeValue = moveTypeFilter.value;
  const pokemonValue = movePokemonFilter.value;
  const searchValue = moveSearchInput.value.trim().toLowerCase();

  return moveList.filter(move => {
    const typeMatch = typeValue === "all" || move.type === typeValue;
    const pokemonMatch = pokemonValue === "all" || getMoveUsage(move).some(item => item.name.toLowerCase() === pokemonValue);
    const searchMatch = !searchValue || move.name.replace(/-/g, " ").includes(searchValue);
    return typeMatch && pokemonMatch && searchMatch;
  });
}

function renderMoves() {
  const rows = getFilteredMoveList();
  moveResultsCount.textContent = `${rows.length} move đang hiển thị`;
  movesList.innerHTML = rows.map(renderMoveCard).join("");
  movesEmpty.hidden = rows.length > 0;

  if (!movesTableBody) return;
  movesTableBody.innerHTML = rows.slice(0, 200).map(move => {
    const pokemonNames = move.pokemon.slice(0, 3).map(item => capitalizeWords(item.name)).join(", ") || "—";
    return `
      <tr>
        <td><strong>${capitalizeWords(move.name)}</strong></td>
        <td><span class="type ${move.type}">${move.type.toUpperCase()}</span></td>
        <td>${formatMoveStat(move.power)}</td>
        <td>${formatMoveStat(move.accuracy)}%</td>
        <td>${formatMoveStat(move.pp)}</td>
        <td>${move.effect}</td>
        <td>${pokemonNames}</td>
      </tr>
    `;
  }).join("");

}

moveTypeFilter.addEventListener("change", renderMoves);
movePokemonFilter.addEventListener("change", renderMoves);
moveSearchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = moveSearchInput.value.trim();
  if (!query) { moveList = sampleMoves; renderMoves(); return; }
  movesList.innerHTML = `<div class="move-loading">Đang tìm move và tải usage meta...</div>`;
  searchTimer = setTimeout(async () => {
    const move = await loadMoveByName(query);
    moveList = move ? [move] : [];
    renderMoves();
  }, 350);
});

(async function initMoveDatabase() {
  populateTypeOptions();
  await loadMetaRankings();
  await loadSampleMoves();
  const initialSearch = new URLSearchParams(window.location.search).get("search");
  if (initialSearch) {
    moveSearchInput.value = initialSearch.replace(/-/g, " ");
    const searchedMove = await loadMoveByName(initialSearch);
    moveList = searchedMove ? [searchedMove] : [];
  }
  renderMoves();
})();
