// ========================================
// POKÉDEX DATABASE
// ========================================


// ========================================
// DOM ELEMENTS
// ========================================

const pokemonGrid =
    document.getElementById("pokemon-grid");

const searchInput =
    document.getElementById("search-input");

const searchButton =
    document.getElementById("search-button");

const searchSuggestions =
    document.getElementById("search-suggestions");

const headerSearchInput =
    document.getElementById("header-search-input");

const headerSearchButton =
    document.getElementById("header-search-button");

const loadMoreBtn =
    document.getElementById("load-more-btn");

const loadMoreContainer =
    document.getElementById("load-more-container");


// ========================================
// CACHE TOÀN BỘ TÊN POKÉMON
// ========================================

let allPokemon = [];
let currentPokemonMoves = [];
let selectedVersionGroup = "champions";
let selectedSpriteMode = "normal";
const translationCache = new Map();
const POKEMON_PAGE_SIZE = 12;
const MAX_POKEMON_ID = 1025;
let loadedPokemonCount = 0;
const versionGroupOrder = [
    "champions",
    "mega-dimension",
    "legends-za",
    "scarlet-violet",
    "sword-shield",
    "sun-moon",
    "x-y",
    "black-white",
    "diamond-pearl",
    "ruby-sapphire",
    "gold-silver",
    "red-blue"
];

function normalizePokemonQuery(query) {
    const normalized = query
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const parts = normalized.split("-");

    if (parts[0] === "mega" && parts.length > 1) {
        return `${parts[1]}-mega${parts.length > 2 ? `-${parts.slice(2).join("-")}` : ""}`;
    }

    return normalized;
}


// ========================================
// LẤY DANH SÁCH TÊN POKÉMON
// ========================================

async function loadPokemonNames() {

    const cachedNames = sessionStorage.getItem("pokemon-name-list");
    if (cachedNames) {
        try {
            allPokemon = JSON.parse(cachedNames).map(pokemon => ({
                ...pokemon,
                id: pokemon.id || pokemon.url?.split("/").filter(Boolean).pop(),
                url: pokemon.url || `${POKE_API_BASE}/${pokemon.id}`
            }));
            return;
        } catch {
            sessionStorage.removeItem("pokemon-name-list");
        }
    }

    try {

        const response = await fetch(
            "https://pokeapi.co/api/v2/pokemon?limit=2000"
        );

        const data = await response.json();

        allPokemon = data.results.map(pokemon => ({
            ...pokemon,
            id: pokemon.url.split("/").filter(Boolean).pop()
        }));
        sessionStorage.setItem("pokemon-name-list", JSON.stringify(allPokemon));

        console.log(
            "Đã tải",
            allPokemon.length,
            "Pokémon"
        );

    } catch (error) {

        console.error(
            "Không thể tải danh sách Pokémon:",
            error
        );

    }
}


// ========================================
// LẤY DỮ LIỆU MỘT POKÉMON
// ========================================

async function getPokemon(id) {

    const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${id}`
    );


    if (!response.ok) {

        throw new Error(
            "Không tìm thấy Pokémon"
        );

    }


    const data =
        await response.json();


    return data;
}


// ========================================
// TẠO CARD (ĐÃ BỔ SUNG DATASET ATTRIBUTE)
// ========================================

function createPokemonCard(pokemon) {

    const card =
        document.createElement("div");


    card.classList.add(
        "pokemon-card"
    );

    // Gắn id/name vào thẻ để nhận biết khi click
    card.dataset.id = pokemon.id;
    card.dataset.name = pokemon.name;


    const number =
        String(pokemon.id)
            .padStart(3, "0");


    const name =
        pokemon.name
            .charAt(0)
            .toUpperCase()
        +
        pokemon.name.slice(1);


    const image =
        pokemon.sprites
            .other["official-artwork"]
            .front_default;
    const shinyImage =
        pokemon.sprites
            .other["official-artwork"]
            .front_shiny || pokemon.sprites.front_shiny;


    const types =
        pokemon.types.map(
            type =>
                type.type.name
        );


    card.innerHTML = `

        <div class="pokemon-number">
            #${number}
        </div>


        <div class="pokemon-image">

            <img
                class="pokemon-sprite"
                src="${image}"
                data-normal-image="${image}"
                data-shiny-image="${shinyImage}"
                alt="${name}"
                loading="lazy"
            >

        </div>


        <h3>
            ${name}
        </h3>


        <div class="types">

            ${types.map(type => `

                <span
                    class="type ${type}"
                >
                    ${type.toUpperCase()}
                </span>

            `).join("")}

        </div>

    `;

    let shinyTimer;
    card.addEventListener("pointerenter", () => {
        if (selectedSpriteMode !== "normal") return;
        shinyTimer = setTimeout(() => setCardSprite(card, "shiny"), 3000);
    });
    card.addEventListener("pointerleave", () => {
        clearTimeout(shinyTimer);
        if (selectedSpriteMode === "normal") setCardSprite(card, "normal");
    });


    return card;
}

function setCardSprite(card, mode) {
    const image = card.querySelector(".pokemon-sprite");
    if (!image) return;
    image.src = mode === "shiny"
        ? image.dataset.shinyImage
        : image.dataset.normalImage;
}

document.querySelectorAll(".sprite-mode-button").forEach(button => {
    button.addEventListener("click", () => {
        selectedSpriteMode = button.dataset.spriteMode;
        document.querySelectorAll(".sprite-mode-button, .modal-sprite-mode-button").forEach(item => {
            item.classList.toggle("active", item.dataset.spriteMode === selectedSpriteMode);
        });
        document.querySelectorAll(".pokemon-card").forEach(card => {
            setCardSprite(card, selectedSpriteMode);
        });
    });
});


// ========================================
// LOAD 12 POKÉMON BAN ĐẦU
// ========================================

async function loadPokemon() {

    pokemonGrid.innerHTML = `

        <div class="loading">

            🔄 Đang tải Pokémon...

        </div>

    `;

    if (loadMoreContainer) {
        loadMoreContainer.classList.add("hidden");
    }


    try {

        const pokemonList = await Promise.all(
            Array.from({ length: POKEMON_PAGE_SIZE }, (_, index) => getPokemon(index + 1))
        );
        const fragment = document.createDocumentFragment();

        pokemonList.forEach(pokemon => {
            fragment.appendChild(createPokemonCard(pokemon));
        });

        pokemonGrid.innerHTML = "";
        pokemonGrid.appendChild(fragment);

        loadedPokemonCount = POKEMON_PAGE_SIZE;
        updateLoadMoreVisibility();

    } catch (error) {

        console.error(error);


        pokemonGrid.innerHTML = `

            <div class="error">

                ❌ Không thể tải dữ liệu Pokémon.

                <br>

                Hãy kiểm tra Internet.

            </div>

        `;

        if (loadMoreContainer) {
            loadMoreContainer.classList.add("hidden");
        }

    }
}


// ========================================
// XEM THÊM POKÉMON (LOAD MORE)
// ========================================

function updateLoadMoreVisibility() {
    if (!loadMoreContainer) return;

    if (loadedPokemonCount >= MAX_POKEMON_ID) {
        loadMoreContainer.classList.add("hidden");
    } else {
        loadMoreContainer.classList.remove("hidden");
    }
}

async function loadMorePokemon() {

    if (!loadMoreBtn || loadMoreBtn.classList.contains("is-loading")) return;

    const nextStart = loadedPokemonCount + 1;
    const nextEnd = Math.min(loadedPokemonCount + POKEMON_PAGE_SIZE, MAX_POKEMON_ID);
    const idsToLoad = [];

    for (let id = nextStart; id <= nextEnd; id++) {
        idsToLoad.push(id);
    }

    if (idsToLoad.length === 0) {
        updateLoadMoreVisibility();
        return;
    }

    loadMoreBtn.classList.add("is-loading");
    loadMoreBtn.disabled = true;
    const loadMoreText = loadMoreBtn.querySelector(".load-more-text");
    if (loadMoreText) loadMoreText.textContent = "Đang tải...";

    try {

        const pokemonList = await Promise.all(
            idsToLoad.map(id => getPokemon(id))
        );
        const fragment = document.createDocumentFragment();

        pokemonList.forEach(pokemon => {
            fragment.appendChild(createPokemonCard(pokemon));
        });

        pokemonGrid.appendChild(fragment);

        document.querySelectorAll(".pokemon-card").forEach(card => {
            setCardSprite(card, selectedSpriteMode);
        });

        loadedPokemonCount = nextEnd;
        updateLoadMoreVisibility();

    } catch (error) {

        console.error("Không thể tải thêm Pokémon:", error);

    } finally {

        loadMoreBtn.classList.remove("is-loading");
        loadMoreBtn.disabled = false;
        if (loadMoreText) loadMoreText.textContent = "Xem thêm Pokémon";

    }
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMorePokemon);
}


// ========================================
// HIỂN THỊ GỢI Ý SEARCH
// ========================================

function showSuggestions(keyword) {

    keyword = normalizePokemonQuery(keyword);


    // Không nhập gì
    if (keyword.length === 0) {

        searchSuggestions.style.display =
            "none";

        searchSuggestions.innerHTML = "";

        return;
    }


    // Nếu chưa tải danh sách
    if (allPokemon.length === 0) {

        return;
    }


    // Tìm Pokémon phù hợp
    const results =
        allPokemon
            .filter(pokemon =>
                pokemon.name.startsWith(keyword)
            )
            .slice(0, 6);


    // Không có kết quả
    if (results.length === 0) {

        searchSuggestions.innerHTML = `

            <div class="no-results">

                ❌ Không tìm thấy Pokémon

            </div>

        `;


        searchSuggestions.style.display =
            "block";


        return;
    }


    // Tạo suggestion
    searchSuggestions.innerHTML =
        results.map(
            (pokemon, index) => {

                const id =
                    pokemon.url
                        .split("/")
                        .filter(Boolean)
                        .pop();


                const number =
                    String(id)
                        .padStart(3, "0");


                const name =
                    pokemon.name
                        .charAt(0)
                        .toUpperCase()
                    +
                    pokemon.name.slice(1);


                const image =
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;


                return `

                    <div
                        class="search-suggestion"
                        data-name="${pokemon.name}"
                    >

                        <img
                            class="suggestion-image"
                            src="${image}"
                            alt="${name}"
                            loading="lazy"
                            decoding="async"
                        >


                        <div
                            class="suggestion-info"
                        >

                            <div
                                class="suggestion-name"
                            >
                                ${name}
                            </div>


                            <div
                                class="suggestion-number"
                            >
                                #${number}
                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");


    searchSuggestions.style.display =
        "block";


    // ====================================
    // CLICK VÀO GỢI Ý
    // ====================================

    document
        .querySelectorAll(
            ".search-suggestion"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                async function () {

                    const name =
                        this.dataset.name;


                    searchInput.value =
                        name;


                    searchSuggestions.style.display =
                        "none";


                    await searchPokemon(
                        name
                    );

                }
            );

        });
}


// ========================================
// SEARCH POKÉMON
// ========================================

async function searchPokemon(
    forcedName = null
) {

    if (forcedName !== null) {
        searchInput.value = forcedName;
    }

    const search = normalizePokemonQuery(
        forcedName || searchInput.value
    );


    if (search === "") {

        loadPokemon();

        return;
    }


    pokemonGrid.innerHTML = `

        <div class="loading">

            🔍 Đang tìm Pokémon...

        </div>

    `;

    if (loadMoreContainer) {
        loadMoreContainer.classList.add("hidden");
    }


    try {
        const matchingPokemon = allPokemon.filter(pokemon =>
            pokemon.name.includes(search)
        );

        if (matchingPokemon.length === 0) {
            throw new Error("Không tìm thấy Pokémon");
        }

        const pokemonList = await Promise.all(
            matchingPokemon.map(pokemon => getPokemon(pokemon.name))
        );
        const fragment = document.createDocumentFragment();

        pokemonList.forEach(pokemon => {
            fragment.appendChild(createPokemonCard(pokemon));
        });

        pokemonGrid.innerHTML = "";
        pokemonGrid.appendChild(fragment);
        document.querySelector(".container").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        pokemonGrid.innerHTML = `

            <div class="error">

                ❌ Không tìm thấy Pokémon

                "<strong>
                    ${search}
                </strong>"

            </div>

        `;

    }
}


// ========================================
// GÕ SEARCH → GỢI Ý
// ========================================

let suggestionDebounceTimer = null;

searchInput.addEventListener(
    "input",
    function () {

        clearTimeout(suggestionDebounceTimer);
        const value = this.value;

        suggestionDebounceTimer = setTimeout(() => {
            showSuggestions(value);
        }, 150);

    }
);


// ========================================
// CLICK SEARCH
// ========================================

searchButton.addEventListener(
    "click",
    function () {

        searchPokemon();

        searchSuggestions.style.display =
            "none";

    }
);

headerSearchButton.addEventListener("click", () => {
    searchPokemon(headerSearchInput.value);
});

headerSearchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchPokemon(headerSearchInput.value);
    }
});


// ========================================
// ENTER
// ========================================

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchPokemon();

            searchSuggestions.style.display =
                "none";

        }

    }
);


// ========================================
// CLICK RA NGOÀI → ĐÓNG GỢI Ý
// ========================================

document.addEventListener(
    "click",
    function (event) {

        const container =
            document.querySelector(
                ".search-container"
            );


        if (
            !container.contains(
                event.target
            )
        ) {

            searchSuggestions.style.display =
                "none";

        }

    }
);


// ========================================
// KHỞI ĐỘNG
// ========================================

async function init() {

    await Promise.all([
        loadPokemonNames(),
        loadPokemon()
    ]);

    const initialSearch = new URLSearchParams(window.location.search).get("search");
    if (initialSearch) {
        searchInput.value = initialSearch;
        await searchPokemon(initialSearch);
    }

}


init();


// ========================================
// MODAL & RENDER DỮ LIỆU CHI TIẾT
// ========================================

const modal =
    document.getElementById("pokemon-modal");

const modalClose =
    document.getElementById("modal-close");


// Toggle đóng modal
if (modalClose) {
    modalClose.addEventListener("click", () => {
        modal.classList.remove("active");
    });
}

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("active");
    }
});


// Lắng nghe sự kiện click vào thẻ Pokémon để mở modal và nạp dữ liệu
document.addEventListener("click", async (e) => {

    const card = e.target.closest(".pokemon-card");

    if (card) {

        const pokemonId = card.dataset.id || card.dataset.name;

        if (pokemonId) {
            modal.classList.add("active");
            modal.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            await loadPokemonDetailData(pokemonId);
        }

    }

});


// Hàm lấy dữ liệu chi tiết và render vào Modal UI
async function loadPokemonDetailData(idOrName) {

    try {

        // 1. Fetch dữ liệu Pokémon chính & Species
        const pokemon = await getPokemon(idOrName);

        const speciesResponse = await fetch(pokemon.species.url);
        const species = await speciesResponse.json();

        await renderPokemonOverview(pokemon, species);

        // 2. Render Base Stats
        renderBaseStats(pokemon.stats);


        // 3. Render Type Defenses
        await renderTypeDefenses(pokemon.types);


        // 4. Render Evolution Chart
        if (species.evolution_chain) {
            const evoResponse = await fetch(species.evolution_chain.url);
            const evoData = await evoResponse.json();

            const evolutionSpeciesUrls = [];

            function collectSpeciesUrls(node) {
                evolutionSpeciesUrls.push(node.species.url);
                node.evolves_to.forEach(child => collectSpeciesUrls(child));
            }

            collectSpeciesUrls(evoData.chain);

            const evolutionSpecies = await Promise.all(
                [...new Set(evolutionSpeciesUrls)].map(async url => {
                    const response = await fetch(url);
                    return response.json();
                })
            );

            const megaPokemonUrls = evolutionSpecies
                .flatMap(evolutionSpeciesData => evolutionSpeciesData.varieties)
                .filter(variety => variety.pokemon.name.includes("-mega"))
                .map(variety => variety.pokemon.url);

            const megaForms = await Promise.all(
                [...new Set(megaPokemonUrls)].map(async url => {
                        const response = await fetch(url);
                        return response.json();
                    })
            );
            renderEvolutionChain(evoData, megaForms);
        }


        // 5. Render Move Learnset
        currentPokemonMoves = pokemon.moves;
        await renderMoveLearnset(currentPokemonMoves, selectedVersionGroup);

    } catch (err) {

        console.error("Lỗi khi nạp dữ liệu chi tiết:", err);

    }

}

async function renderPokemonOverview(pokemon, species) {
    const overviewName = document.getElementById("overview-name");
    const overviewImage = document.getElementById("overview-image");
    const overviewTypes = document.getElementById("overview-types");
    const overviewNumber = document.getElementById("overview-number");
    const overviewSpecies = document.getElementById("overview-species");
    const overviewHeight = document.getElementById("overview-height");
    const overviewWeight = document.getElementById("overview-weight");
    const overviewAbilities = document.getElementById("overview-abilities");
    const abilityDetail = document.getElementById("ability-detail");
    const overviewFact = document.getElementById("overview-fact");

    const displayName = pokemon.name
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
    const flavorTextEntry = species.flavor_text_entries.find(
        entry => entry.language.name === "vi"
    ) || species.flavor_text_entries.find(entry => entry.language.name === "en");
    const originalFlavorText = flavorTextEntry?.flavor_text.replace(/[\f\n]/g, " ")
        || "Chưa có thông tin Pokédex.";
    const flavorText = await translateFlavorText(originalFlavorText);
    const formatAbilityName = name => name
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
    const regularAbilities = pokemon.abilities
        .filter(ability => !ability.is_hidden)
        .map(ability => formatAbilityName(ability.ability.name));
    const hiddenAbilities = pokemon.abilities
        .filter(ability => ability.is_hidden)
        .map(ability => formatAbilityName(ability.ability.name));

    overviewName.textContent = displayName;
    overviewImage.dataset.normalImage = pokemon.sprites.other["official-artwork"].front_default;
    overviewImage.dataset.shinyImage = pokemon.sprites.other["official-artwork"].front_shiny || pokemon.sprites.front_shiny;
    setOverviewSprite(selectedSpriteMode);
    overviewImage.alt = displayName;
    overviewTypes.innerHTML = pokemon.types.map(typeEntry => {
        const typeName = typeEntry.type.name;
        return `<span class="type ${typeName}">${typeName.toUpperCase()}</span>`;
    }).join("");
    overviewNumber.textContent = `#${String(species.id).padStart(4, "0")}`;
    overviewSpecies.textContent = species.genera.find(
        genus => genus.language.name === "en"
    )?.genus.replace(" Pokémon", " Pokémon") || "Chưa rõ loài";
    overviewHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
    overviewWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;
    const abilityLink = ability => `
        <button class="ability-link" data-ability-url="${ability.ability.url}">
            ${formatAbilityName(ability.ability.name)}
        </button>
    `;
    const regularAbilityEntries = pokemon.abilities.filter(ability => !ability.is_hidden);
    const hiddenAbilityEntries = pokemon.abilities.filter(ability => ability.is_hidden);

    overviewAbilities.innerHTML = regularAbilityEntries.length > 0
        ? regularAbilityEntries.map((ability, index) => `
            <div class="ability-row">
                ${index === 0 ? "<span class=\"ability-label\">Ability:</span>" : ""}
                ${abilityLink(ability)}
            </div>
        `).join("")
        : "<div class=\"ability-row\"><span class=\"ability-label\">Ability:</span><strong>Chưa rõ</strong></div>";

    if (hiddenAbilityEntries.length > 0) {
        overviewAbilities.innerHTML += hiddenAbilityEntries.map(ability => `
            <div class="ability-row hidden-ability">
                <span class="ability-label">Hidden Ability:</span>
                ${abilityLink(ability)}
            </div>
        `).join("");
    }

    abilityDetail.hidden = true;
    abilityDetail.innerHTML = "";
    overviewFact.textContent = flavorText;
}

function setOverviewSprite(mode) {
    const overviewImage = document.getElementById("overview-image");
    if (!overviewImage) return;
    overviewImage.src = mode === "shiny"
        ? overviewImage.dataset.shinyImage
        : overviewImage.dataset.normalImage;
}

document.querySelectorAll(".modal-sprite-mode-button").forEach(button => {
    button.addEventListener("click", () => {
        selectedSpriteMode = button.dataset.spriteMode;
        document.querySelectorAll(".sprite-mode-button, .modal-sprite-mode-button").forEach(item => {
            item.classList.toggle("active", item.dataset.spriteMode === selectedSpriteMode);
        });
        document.querySelectorAll(".pokemon-card").forEach(card => {
            setCardSprite(card, selectedSpriteMode);
        });
        setOverviewSprite(selectedSpriteMode);
    });
});

document.addEventListener("click", async event => {
    const abilityLink = event.target.closest(".ability-link");

    if (!abilityLink) return;

    event.stopPropagation();
    const abilityDetail = document.getElementById("ability-detail");
    abilityDetail.hidden = false;
    abilityDetail.innerHTML = "Đang tải mô tả Ability...";

    try {
        const response = await fetch(abilityLink.dataset.abilityUrl);
        const ability = await response.json();
        const effect = ability.effect_entries.find(
            entry => entry.language.name === "en"
        )?.effect || ability.flavor_text_entries.find(
            entry => entry.language.name === "en"
        )?.flavor_text || "Chưa có mô tả cho Ability này.";
        const translatedEffect = await translateFlavorText(
            effect.replace(/[\f\n]/g, " ")
        );

        abilityDetail.innerHTML = `
            <strong>${abilityLink.textContent.trim()}</strong>
            <p>${translatedEffect}</p>
        `;
    } catch (error) {
        abilityDetail.textContent = "Không thể tải mô tả Ability.";
    }
});

async function translateFlavorText(text) {
    if (localStorage.getItem("pokemon-information-language") === "en") {
        return text;
    }

    if (text === "Chưa có thông tin Pokédex." || translationCache.has(text)) {
        return translationCache.get(text) || text;
    }

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`
        );
        const data = await response.json();
        const translation = data.responseData?.translatedText;

        if (translation) {
            const correctedTranslation = translatePokemonTerms(translation);
            translationCache.set(text, correctedTranslation);
            return correctedTranslation;
        }
    } catch (error) {
        console.warn("Không thể dịch thông tin Pokédex:", error);
    }

    return text;
}

function summarizeMoveDescription(text) {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const summary = sentences.slice(0, 2).join(" ").trim();

    if (summary.length <= 300) return summary;

    return `${summary.slice(0, 297).trimEnd()}...`;
}

function translatePokemonTerms(text) {
    return text
        .replace(/Phí Pokémon cho một lượt trước khi tấn công/gi, "Pokémon tích tụ năng lượng trong một lượt trước khi tấn công")
        .replace(/Phí Pokémon/gi, "Pokémon tích tụ năng lượng")
        .replace(/phí Pokemon/gi, "Pokémon tích tụ năng lượng")
        .replace(/gây sát thương thường xuyên/gi, "gây sát thương")
        .replace(/nạp tiền/gi, "nạp năng lượng")
        .replace(/tắt máy/gi, "rút về")
        .replace(/chuyển ra ngoài/gi, "rút về")
    .replace(/hai giai đoạn/gi, "2 bậc")
    .replace(/hai cấp độ/gi, "2 bậc")
    .replace(/một giai đoạn/gi, "1 bậc")
        .replace(/người dùng/gi, "Pokémon")
        .replace(/mục tiêu/gi, "mục tiêu")
        .replace(/sát thương chí mạng/gi, "sát thương từ đòn chí mạng")
        .replace(/bị ngất/gi, "bị hạ gục")
        .replace(/đổi ra/gi, "rút về")
        .replace(/độ chính xác/gi, "độ chính xác");
}

async function translateMoveDescription(text) {
    const summary = summarizeMoveDescription(text);

    const loweredSummary = summary.toLowerCase();

    if (/charges? before attacking|charges? for one turn before attacking/i.test(summary)) {
        return "Pokémon tích tụ năng lượng trong một lượt trước khi tấn công.";
    }

    if (/must recharge next turn|recharge next turn/i.test(summary)) {
        return "Pokémon phải nạp năng lượng ở lượt tiếp theo và không thể tấn công hoặc rút về trong lượt đó.";
    }

    if (/can't move on the next turn|cannot move on the next turn/i.test(summary)) {
        return "Pokémon không thể hành động ở lượt tiếp theo.";
    }

    const statStageMatch = loweredSummary.match(
        /(?:lower|lowering|reduce|reducing).*?target'?s? ([a-z -]+?) by (one|two|three|four|five|1|2|3|4|5) stages?/
    );

    if (statStageMatch) {
        const statNames = {
            "special defense": "Phòng thủ Đặc biệt",
            "special attack": "Tấn công Đặc biệt",
            attack: "Tấn công",
            defense: "Phòng thủ",
            speed: "Tốc độ",
            accuracy: "Độ chính xác",
            "evasion": "Né tránh"
        };
        const amount = { one: 1, two: 2, three: 3, four: 4, five: 5 }[statStageMatch[2]] || statStageMatch[2];
        const stat = statNames[statStageMatch[1].trim()] || statStageMatch[1].trim();
        return `Gây sát thương và có cơ hội giảm ${amount} bậc ${stat} của mục tiêu.`;
    }

    return translatePokemonTerms(await translateFlavorText(summary));
}

function capitalizeSentences(text) {
    return text.replace(/(^|[.!?]\s+)([a-zà-ỹ])/g, (_, prefix, letter) =>
        `${prefix}${letter.toUpperCase()}`
    );
}


// ----------------------------------------
// RENDER BASE STATS
// ----------------------------------------

function renderBaseStats(stats) {

    const statMap = {
        hp: "HP",
        attack: "ATK",
        defense: "DEF",
        "special-attack": "SPA",
        "special-defense": "SPD",
        speed: "SPE"
    };

    const statsContainer = document.querySelector(".stats-list");

    if (!statsContainer) return;

    statsContainer.innerHTML = stats.map(s => {

        const label = statMap[s.stat.name] || s.stat.name.toUpperCase();
        const val = s.base_stat;
        const percent = Math.min(100, Math.round((val / 255) * 100));
        const colorClass = val < 50 ? "stat-low" : val > 100 ? "stat-high" : "stat-medium";

        return `
            <div class="stat-row">
                <span class="stat-label">${label}</span>
                <span class="stat-val">${val}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar ${colorClass}" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;

    }).join("");

}


// ----------------------------------------
// RENDER TYPE DEFENSES
// ----------------------------------------

async function renderTypeDefenses(types) {

    const grid = document.querySelector(".type-defenses-grid");

    if (!grid) return;

    const typeNames = [
        "normal", "fire", "water", "electric", "grass", "ice",
        "fighting", "poison", "ground", "flying", "psychic", "bug",
        "rock", "ghost", "dragon", "dark", "steel", "fairy"
    ];
    const multipliers = Object.fromEntries(typeNames.map(type => [type, 1]));

    for (const t of types) {

        try {
            const res = await fetch(t.type.url);
            const data = await res.json();

            data.damage_relations.double_damage_from.forEach(x => {
                multipliers[x.name] = (multipliers[x.name] || 1) * 2;
            });

            data.damage_relations.half_damage_from.forEach(x => {
                multipliers[x.name] = (multipliers[x.name] || 1) * 0.5;
            });

            data.damage_relations.no_damage_from.forEach(x => {
                multipliers[x.name] = (multipliers[x.name] || 1) * 0;
            });

        } catch (e) {
            console.error(e);
        }

    }

    const sortedTypes = [...typeNames].sort((firstType, secondType) =>
        multipliers[secondType] - multipliers[firstType]
    );

    grid.innerHTML = sortedTypes.map(type => {
        const mult = multipliers[type];
        const multiplierClass = `x${String(mult).replace(".", "")}`;

        return `
            <div class="type-def-item">
                <span class="type ${type}">${type.toUpperCase()}</span>
                <span class="mult ${multiplierClass}">${mult}x</span>
            </div>
        `;

    }).join("");

}


// ----------------------------------------
// RENDER EVOLUTION CHART
// ----------------------------------------

function renderEvolutionChain(evoData, megaForms = []) {

    const container = document.querySelector(".evolution-chain");

    if (!container || !evoData) return;

    const paths = [];

    function collectPaths(node, path = []) {
        const details = node.evolution_details[0];
        let condition = "Base";
        let conditionType = "base";
        let itemIcon = null;

        if (details) {
            const conditions = [];

            if (details.min_level) {
                conditions.push(`Lv. ${details.min_level}`);
                conditionType = "level";
            }

            if (details.min_happiness) {
                conditions.push(`Tình bạn ≥ ${details.min_happiness}`);
                conditionType = "friendship";
            }

            if (details.time_of_day) {
                conditions.push(details.time_of_day === "night" ? "Ban đêm" : "Ban ngày");
            }

            if (details.item) {
                conditions.push(details.item.name.replaceAll("-", " "));
                conditionType = "item";
                itemIcon = details.item.name;
            }

            if (details.held_item) {
                conditions.push(`Cầm ${details.held_item.name.replaceAll("-", " ")}`);
                conditionType = "item";
                itemIcon = details.held_item.name;
            }

            if (details.known_move) {
                conditions.push(`Biết chiêu ${details.known_move.name.replaceAll("-", " ")}`);
            }

            if (details.location) {
                conditions.push(`Tại ${details.location.name.replaceAll("-", " ")}`);
            }

            if (details.trigger?.name === "trade") {
                conditions.push("Trao đổi");
                conditionType = "trade";
            }

            if (details.trigger?.name === "level-up" && conditions.length === 0) {
                conditions.push("Lên cấp");
                conditionType = "level";
            }

            condition = conditions.join(" + ") || "Điều kiện đặc biệt";
        }

        const currentPath = [...path, {
            name: node.species.name,
            id: node.species.url.split("/").filter(Boolean).pop(),
            condition,
            conditionType,
            itemIcon
        }];

        if (node.evolves_to.length === 0) {
            paths.push(currentPath);
            return;
        }

        node.evolves_to.forEach(child => collectPaths(child, currentPath));
    }

    collectPaths(evoData.chain);

    const renderPath = path => path.map((node, index) => {
        const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`;
        const animatedImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${node.id}.gif`;
        const nameCap = node.name.replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase());
        const next = path[index + 1];

        return `
            <div class="evo-stage">
                <img src="${animatedImage}" onerror="this.onerror=null;this.src='${image}'" alt="${nameCap}">
                <button class="evo-name" data-pokemon-id="${node.id}">${nameCap}</button>
            </div>
            ${next ? `
                <div class="evo-arrow">
                    <span class="evo-cond ${next.conditionType}">
                        ${next.itemIcon ? `<img class="evo-condition-icon" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${next.itemIcon}.png" alt="${next.condition}">` : ""}
                        ${next.condition}
                    </span>
                    <span class="evo-arrow-icon">➜</span>
                </div>
            ` : ""}
        `;
    }).join("");

    const megaPath = megaForms.map(mega => {
                const nameCap = mega.name.replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase());
                const id = mega.id;
                const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
                const animatedImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;

                return `
                    <div class="evolution-path mega-path">
                        <div class="evo-arrow">
                            <span class="evo-cond mega">Mega Evolution</span>
                            <span class="evo-arrow-icon">➜</span>
                        </div>
                        <div class="evo-stage">
                            <img src="${animatedImage}" onerror="this.onerror=null;this.src='${image}'" alt="${nameCap}">
                            <button class="evo-name" data-pokemon-id="${id}">${nameCap}</button>
                        </div>
                    </div>
                `;
            }).join("");

    container.innerHTML = paths.map(path => `
        <div class="evolution-path">${renderPath(path)}</div>
    `).join("") + megaPath;

}


// ----------------------------------------
// RENDER MOVE LEARNSET
// ----------------------------------------

async function renderMoveLearnset(moves, requestedVersionGroup = selectedVersionGroup) {

    const moveTables = document.querySelectorAll(".move-table-wrapper tbody");
    const levelUpTable = moveTables[0];
    const tmTable = moveTables[1];

    if (!levelUpTable || !tmTable) return;

    const versionGroup = [
        requestedVersionGroup,
        ...versionGroupOrder.filter(group => group !== requestedVersionGroup)
    ].find(group => moves.some(moveEntry => moveEntry.version_group_details.some(
        detail => detail.version_group.name === group
    )));

    const moveData = (await Promise.all(
        moves.map(async moveEntry => {
            const detail = moveEntry.version_group_details.find(
                versionDetail => versionDetail.version_group.name === versionGroup
            );

            if (!detail) return null;

            const response = await fetch(moveEntry.move.url);
            const move = await response.json();
            let machine = null;

            if (detail.move_learn_method.name === "machine") {
                const machineRef = move.machines.find(
                    machineEntry => machineEntry.version_group.name === versionGroup
                );

                if (machineRef) {
                    const machineResponse = await fetch(machineRef.machine.url);
                    const machineData = await machineResponse.json();
                    machine = machineData.item.name.toUpperCase();
                }
            }

            return {
                name: move.name,
                type: move.type.name,
                category: move.damage_class.name,
                power: move.power ?? "—",
                accuracy: move.accuracy ?? "—",
                target: move.target?.name || "selected-pokemon",
                description: move.effect_entries.find(
                    entry => entry.language.name === "en"
                )?.effect || move.flavor_text_entries.find(
                    entry => entry.language.name === "en"
                )?.flavor_text || "Chưa có mô tả cho chiêu này.",
                method: detail?.move_learn_method.name,
                level: detail?.level_learned_at ?? 0,
                machine
            };
        })
    )).filter(Boolean);

    const levelMoves = moveData.filter(move => move.method === "level-up");
    const trainingMoves = moveData.filter(move => move.method === "train");
    const tmMoves = moveData.filter(move => move.method === "machine");
    const learnsetMoves = [...levelMoves, ...trainingMoves];

    const levelTitle = document.querySelector(".table-subtitle");
    if (levelTitle) {
        levelTitle.textContent = trainingMoves.length > 0 && levelMoves.length === 0
            ? "TRAINING"
            : "LEVEL UP";

        if (versionGroup && versionGroup !== requestedVersionGroup) {
            levelTitle.textContent += " (fallback data)";
        }
    }

    if (learnsetMoves.length === 0) {
        levelUpTable.innerHTML = `
            <tr><td colspan="6">Chưa có dữ liệu move cho version này.</td></tr>
        `;
    }

    if (tmMoves.length === 0) {
        tmTable.innerHTML = `
            <tr><td colspan="6">Chưa có dữ liệu TM cho version này.</td></tr>
        `;
    }

    const formatMoveName = name => name
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
    const formatTarget = target => ({
        "selected-pokemon": "Một mục tiêu",
        "random-opponent": "Một đối thủ ngẫu nhiên",
        "all-opponents": "Tất cả đối thủ",
        "all-other-pokemon": "Tất cả Pokémon khác",
        "all-pokemon": "Tất cả Pokémon",
        "user": "Bản thân Pokémon",
        "user-or-ally": "Bản thân hoặc đồng minh",
        "ally": "Một đồng minh",
        "specific-move": "Mục tiêu theo chiêu thức",
        "entire-field": "Toàn bộ sân đấu",
        "user-side": "Phe của Pokémon",
        "user-or-ally-side": "Phe của Pokémon hoặc đồng minh"
    }[target] || "Một mục tiêu");

    levelMoves.sort((a, b) => a.level - b.level);

    // Level-up Table
    if (learnsetMoves.length > 0) {
        levelUpTable.innerHTML = learnsetMoves.map(m => `
            <tr>
                <td>${m.level || "—"}</td>
                <td>
                    <button class="move-name move-link" data-move-name="${formatMoveName(m.name)}" data-move-target="${formatTarget(m.target)}" data-move-description="${encodeURIComponent(m.description)}">${formatMoveName(m.name)}</button>
                </td>
                <td><span class="type ${m.type}">${m.type.toUpperCase()}</span></td>
                <td><span class="cat ${m.category}" aria-label="${m.category}"></span></td>
                <td>${m.power}</td>
                <td>${m.accuracy}</td>
            </tr>
        `).join("");
    }

    // TM Table
    if (tmMoves.length > 0) {
        tmTable.innerHTML = tmMoves.map((m, idx) => `
        <tr>
            <td>${m.machine || `TM${String(idx + 1).padStart(2, "0")}`}</td>
            <td>
                <button class="move-name move-link" data-move-name="${formatMoveName(m.name)}" data-move-target="${formatTarget(m.target)}" data-move-description="${encodeURIComponent(m.description)}">${formatMoveName(m.name)}</button>
            </td>
            <td><span class="type ${m.type}">${m.type.toUpperCase()}</span></td>
            <td><span class="cat ${m.category}" aria-label="${m.category}"></span></td>
            <td>${m.power}</td>
            <td>${m.accuracy}</td>
        </tr>
        `).join("");
    }

}

document.querySelectorAll(".move-version-tab").forEach(tab => {
    tab.addEventListener("click", async () => {
        selectedVersionGroup = tab.dataset.versionGroup;

        document.querySelectorAll(".move-version-tab").forEach(item => {
            item.classList.toggle("active", item === tab);
        });

        if (currentPokemonMoves.length > 0) {
            await renderMoveLearnset(currentPokemonMoves, selectedVersionGroup);
        }
    });
});


// ----------------------------------------
// BỘ LỌC TÌM KIẾM CHIẾU THEO TÊN TRONG MODAL
// ----------------------------------------

document.addEventListener("input", (e) => {

    if (e.target.id === "move-search") {

        const keyword = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll(".move-table tbody tr");

        rows.forEach(row => {

            const moveName = row.querySelector(".move-name")?.textContent.toLowerCase() || "";

            if (moveName.includes(keyword)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    }

});

document.addEventListener("click", async event => {
    const evolutionName = event.target.closest(".evo-name");

    if (!evolutionName) return;

    event.stopPropagation();
    modal.classList.add("active");
    modal.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    await loadPokemonDetailData(evolutionName.dataset.pokemonId);
});

document.addEventListener("click", async event => {
    const moveLink = event.target.closest(".move-link");
    const moveDetail = document.getElementById("move-detail");

    if (moveLink) {
        event.stopPropagation();
        const name = moveDetail.querySelector(".move-detail-name");
        const text = moveDetail.querySelector(".move-detail-text");
        name.textContent = moveLink.dataset.moveName;
        const isEnglish = localStorage.getItem("pokemon-information-language") === "en";
        text.textContent = isEnglish ? "Loading description..." : "Đang tải mô tả...";
        moveDetail.hidden = false;

        const moveRect = moveLink.getBoundingClientRect();
        const detailWidth = Math.min(360, window.innerWidth - 24);
        moveDetail.style.width = `${detailWidth}px`;
        moveDetail.style.position = "fixed";
        moveDetail.style.left = `${Math.max(12, Math.min(moveRect.left, window.innerWidth - detailWidth - 12))}px`;
        moveDetail.style.top = `${Math.max(12, Math.min(moveRect.bottom + 8, window.innerHeight - 150))}px`;
        try {
            const description = decodeURIComponent(moveLink.dataset.moveDescription || "Chưa có mô tả cho chiêu này.");
            const translatedDescription = await translateFlavorText(
                description.replace(/[\f\n]/g, " ")
            );
            const target = isEnglish
                ? {
                    "Một mục tiêu": "One target",
                    "Một đối thủ ngẫu nhiên": "One random opponent",
                    "Tất cả đối thủ": "All opponents",
                    "Tất cả Pokémon khác": "All other Pokémon",
                    "Tất cả Pokémon": "All Pokémon",
                    "Bản thân Pokémon": "The user",
                    "Bản thân hoặc đồng minh": "The user or an ally",
                    "Một đồng minh": "One ally",
                    "Mục tiêu theo chiêu thức": "Move-specific target",
                    "Toàn bộ sân đấu": "The entire field",
                    "Phe của Pokémon": "The user's side",
                    "Phe của Pokémon hoặc đồng minh": "The user's side or an ally"
                }[moveLink.dataset.moveTarget] || moveLink.dataset.moveTarget
                : moveLink.dataset.moveTarget;
            if (!moveDetail.hidden) {
                text.innerHTML = `
                    <span class="move-target"><strong>${isEnglish ? "Target:" : "Mục tiêu:"}</strong> ${target}</span>
                    <span class="move-effect">${capitalizeSentences(translatedDescription)}</span>
                `;
            }
        } catch (error) {
            text.textContent = isEnglish ? "Could not load move description." : "Không thể tải mô tả chiêu.";
        }
        return;
    }

    moveDetail.hidden = true;
});