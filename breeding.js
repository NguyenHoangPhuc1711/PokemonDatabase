const breedingSearch = document.getElementById("breeding-search");
const breedingSuggestions = document.getElementById("breeding-suggestions");
const breedingResult = document.getElementById("breeding-result");

let pokemonNames = [];

function capitalizeWords(str) {
  if (!str) return "—";
  return str
    .toLowerCase()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function loadPokemonNames() {
  if (pokemonNames.length) return pokemonNames;
  const data = await PokemonApi.listPokemon();
  pokemonNames = data.map(item => item.name);
  return pokemonNames;
}

async function getSpeciesEggGroups(name) {
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
  if (!speciesRes.ok) return [];
  const species = await speciesRes.json();
  return species.egg_groups || [];
}

async function renderBreedingSuggestions(query) {
  if (!query) {
    breedingSuggestions.classList.remove("active");
    breedingSuggestions.innerHTML = "";
    return;
  }

  const names = await loadPokemonNames();
  const filtered = names.filter(name => name.startsWith(query.toLowerCase())).slice(0, 8);

  if (!filtered.length) {
    breedingSuggestions.classList.remove("active");
    breedingSuggestions.innerHTML = "";
    return;
  }

  breedingSuggestions.innerHTML = filtered.map(name => `
    <div class="search-suggestion" data-name="${name}">
      <img class="suggestion-image" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${name}.png" alt="${capitalizeWords(name)}">
      <div class="suggestion-info">
        <div class="suggestion-name">${capitalizeWords(name)}</div>
      </div>
    </div>
  `).join("");
  breedingSuggestions.classList.add("active");
}

async function renderBreedingResults(name) {
  const speciesName = name.trim();
  if (!speciesName) {
    breedingResult.innerHTML = `<div class="empty-data">Chọn một Pokémon để xem egg group.</div>`;
    return;
  }

  const groups = await getSpeciesEggGroups(speciesName);
  if (!groups.length) {
    breedingResult.innerHTML = `<div class="empty-data">${capitalizeWords(speciesName)} không có thông tin egg group.</div>`;
    return;
  }

  const groupCards = await Promise.all(groups.map(async group => {
    const groupRes = await fetch(group.url);
    const groupData = await groupRes.json();
    return {
      name: group.name,
      pokemon: groupData.pokemon_species?.map(item => item.name).slice(0, 12) || []
    };
  }));

  breedingResult.innerHTML = `
    <div class="breeding-summary">
      <h3>${capitalizeWords(speciesName)}</h3>
      <div class="egg-group-row">${groupCards.map(group => `<span class="egg-group-badge">${capitalizeWords(group.name)}</span>`).join("")}</div>
    </div>
    <div class="breeding-grid">
      ${groupCards.map(group => `
        <div class="breeding-card">
          <h4>${capitalizeWords(group.name)}</h4>
          <div class="pokemon-chip-row">${group.pokemon.map(name => `<a class="pokemon-chip" href="PokemonDatabase.html?pokemon=${encodeURIComponent(name)}" title="Xem ${capitalizeWords(name)}">${capitalizeWords(name)}</a>`).join("")}</div>
        </div>
      `).join("")}
    </div>
  `;
}

breedingSearch.addEventListener("input", () => renderBreedingSuggestions(breedingSearch.value));

breedingSuggestions.addEventListener("click", async (event) => {
  const suggestion = event.target.closest(".search-suggestion");
  if (!suggestion) return;
  const selected = suggestion.dataset.name;
  breedingSearch.value = capitalizeWords(selected);
  breedingSuggestions.classList.remove("active");
  breedingSuggestions.innerHTML = "";
  await renderBreedingResults(selected);
});

breedingSearch.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    const value = breedingSearch.value.trim();
    if (value) {
      await renderBreedingResults(value);
    }
  }
});

(async function initBreeding() {
  await loadPokemonNames();
  const defaultName = "pikachu";
  breedingSearch.value = capitalizeWords(defaultName);
  await renderBreedingResults(defaultName);
})();
