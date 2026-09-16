const abilityList = document.getElementById("ability-list");
const abilitySearch = document.getElementById("ability-search");

let abilityData = [];

function capitalizeWords(str) {
  if (!str) return "—";
  return str
    .toLowerCase()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shortEffect(rawText) {
  if (!rawText) return "Không có mô tả ngắn.";
  return rawText.replace(/\s+/g, " ").trim();
}

async function loadAbilities() {
  if (abilityData.length) return abilityData;

  const response = await fetch("https://pokeapi.co/api/v2/ability?limit=1000");
  const data = await response.json();

  abilityData = await Promise.all(data.results.map(async (ability) => {
    const detailRes = await fetch(ability.url);
    const detail = await detailRes.json();

    return {
      name: detail.name,
      effect: detail.effect_entries?.find(entry => entry.language.name === "en")?.effect || detail.effect_entries?.[0]?.effect || "—",
      shortEffectText: detail.effect_entries?.find(entry => entry.language.name === "en")?.short_effect || detail.effect_entries?.[0]?.short_effect || "—",
      pokemon: detail.pokemon?.map(item => ({
        name: item.pokemon.name,
        id: item.pokemon.url.split("/").filter(Boolean).pop()
      })) || []
    };
  }));

  return abilityData;
}

function renderAbilities() {
  const keyword = abilitySearch.value.trim().toLowerCase();
  const filtered = abilityData.filter(item => {
    const isMatch = !keyword || item.name.toLowerCase().includes(keyword) || item.effect.toLowerCase().includes(keyword);
    return isMatch;
  });

  if (!filtered.length) {
    abilityList.innerHTML = `<div class="empty-data">Không tìm thấy ability phù hợp.</div>`;
    return;
  }

  abilityList.innerHTML = filtered.slice(0, 100).map(ability => `
    <div class="ability-card">
      <div class="ability-header">
        <h3>${capitalizeWords(ability.name)}</h3>
        <span class="ability-tag">Ability</span>
      </div>
      <p>${shortEffect(ability.shortEffectText)}</p>
      <div class="ability-detail">
        <strong>Mô tả:</strong>
        <span>${shortEffect(ability.effect)}</span>
      </div>
      <div class="ability-pokemon-list">
        <strong>Pokémon sở hữu:</strong>
        <div class="pokemon-chip-row">${ability.pokemon.slice(0, 8).map(pokemon => `<a class="pokemon-chip" href="PokemonDatabase.html?pokemon=${encodeURIComponent(pokemon.name)}" title="Xem ${capitalizeWords(pokemon.name)}"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png" alt="" loading="lazy">${capitalizeWords(pokemon.name)}</a>`).join("") || "<span class='muted'>Không rõ</span>"}</div>
      </div>
    </div>
  `).join("");
}

abilitySearch.addEventListener("input", async () => {
  if (!abilityData.length) {
    await loadAbilities();
  }
  renderAbilities();
});

(async function initAbilityDatabase() {
  await loadAbilities();
  const initialSearch = new URLSearchParams(window.location.search).get("search");
  if (initialSearch) abilitySearch.value = initialSearch.replace(/-/g, " ");
  renderAbilities();
})();
