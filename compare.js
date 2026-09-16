const compareOne = document.getElementById("compare-one");
const compareTwo = document.getElementById("compare-two");
const compareButton = document.getElementById("compare-button");
const compareOutput = document.getElementById("compare-output");

function capitalizeWords(str) {
  if (!str) return "—";
  return str
    .toLowerCase()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchPokemon(name) {
  return PokemonApi.getPokemon(name);
}

function renderCompareCard(pokemon) {
  const typeBadges = pokemon.types.map(item => `<span class="type ${item.type.name}">${item.type.name.toUpperCase()}</span>`).join("");
  const stats = pokemon.stats.map(item => `
    <div class="compare-stat-row">
      <span>${item.stat.name.toUpperCase()}</span>
      <div class="compare-bar"><i style="width:${Math.min(item.base_stat, 200) / 2}%"></i></div>
      <strong>${item.base_stat}</strong>
    </div>
  `).join("");

  return `
    <div class="compare-card">
      <div class="compare-head">
        <img src="${pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}" alt="${capitalizeWords(pokemon.name)}">
        <div>
          <h3>${capitalizeWords(pokemon.name)}</h3>
          <div class="type-row">${typeBadges}</div>
        </div>
      </div>
      <div class="compare-stats">${stats}</div>
    </div>
  `;
}

async function comparePokemon() {
  const first = compareOne.value.trim();
  const second = compareTwo.value.trim();

  if (!first || !second) {
    compareOutput.innerHTML = `<div class="empty-data">Vui lòng nhập tên 2 Pokémon để so sánh.</div>`;
    return;
  }

  try {
    const [p1, p2] = await Promise.all([fetchPokemon(first), fetchPokemon(second)]);
    const statTotal1 = p1.stats.reduce((sum, item) => sum + item.base_stat, 0);
    const statTotal2 = p2.stats.reduce((sum, item) => sum + item.base_stat, 0);
    const winner = statTotal1 === statTotal2 ? "Hai Pokémon ngang nhau" : statTotal1 > statTotal2 ? capitalizeWords(p1.name) : capitalizeWords(p2.name);

    compareOutput.innerHTML = `
      <div class="compare-summary">Người thắng: <strong>${winner}</strong></div>
      <div class="compare-grid">
        ${renderCompareCard(p1)}
        ${renderCompareCard(p2)}
      </div>
    `;
  } catch (error) {
    compareOutput.innerHTML = `<div class="empty-data">${error.message || "Không thể so sánh Pokémon này."}</div>`;
  }
}

compareButton.addEventListener("click", comparePokemon);
compareOne.addEventListener("keydown", (event) => { if (event.key === "Enter") comparePokemon(); });
compareTwo.addEventListener("keydown", (event) => { if (event.key === "Enter") comparePokemon(); });
