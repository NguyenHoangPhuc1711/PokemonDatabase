const SEO_API_ROOT = "https://pokeapi.co/api/v2";
const SEO_KIND_LABELS = { pokemon: "Pokémon", types: "Type", moves: "Move", abilities: "Ability", items: "Item" };

function seoSlug(value) {
    return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function seoName(value) {
    return String(value || "—").replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function seoLink(kind, slug, label = seoName(slug)) {
    return `<a href="../../${kind}/${seoSlug(slug)}/">${label}</a>`;
}

function seoEndpoint(kind) {
    return { pokemon: "pokemon", types: "type", moves: "move", abilities: "ability", items: "item" }[kind];
}

function seoList(items, kind, limit = 24) {
    return items.slice(0, limit).map(item => seoLink(kind, item.name || item, seoName(item.name || item))).join("");
}

function getSeoRoute() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const kindIndex = parts.findIndex(part => Object.prototype.hasOwnProperty.call(SEO_KIND_LABELS, part));
    return kindIndex >= 0 ? { kind: parts[kindIndex], slug: parts[kindIndex + 1] || "" } : null;
}

function setSeoMeta(route, name, description) {
    const titleName = seoName(name);
    const title = route.kind === "pokemon"
        ? `${titleName} — Stats, Moves, Abilities & Competitive | PokémonIF`
        : `${titleName} ${SEO_KIND_LABELS[route.kind]} — PokémonIF`;
    document.title = title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.content = description;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `${window.location.origin}${window.location.pathname}`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
}

function renderSeoShell(route, name, description) {
    const main = document.querySelector("#seo-content");
    const label = SEO_KIND_LABELS[route.kind];
    main.innerHTML = `
        <nav class="seo-breadcrumbs" aria-label="Breadcrumb">
            <a href="../../index.html">PokémonIF</a><span>/</span>
            <a href="../../${route.kind}/">${label}</a><span>/</span><strong>${seoName(name)}</strong>
        </nav>
        <section class="seo-hero-card">
            <span class="seo-kicker">${label} Database</span>
            <h1>${seoName(name)}</h1>
            <p class="seo-summary">${description}</p>
        </section>
        <div class="seo-grid" id="seo-details">
            <section class="seo-card"><h2>Loading data</h2><p class="seo-loading">Loading live data from PokéAPI...</p></section>
        </div>
    `;
}

function renderPokemon(data) {
    const types = data.types.map(item => item.type.name);
    const abilities = data.abilities.map(item => item.ability.name);
    const moves = data.moves.map(item => item.move.name);
    const details = document.querySelector("#seo-details");
    details.innerHTML = `
        <section class="seo-card"><h2>Stats & Identity</h2><div class="seo-stat-list">
            <span>National Dex: <strong>#${String(data.id).padStart(4, "0")}</strong></span>
            <span>Height: <strong>${data.height / 10} m</strong></span>
            <span>Weight: <strong>${data.weight / 10} kg</strong></span>
            <span>Types: <strong>${types.map(type => seoLink("types", type, seoName(type))).join(", ")}</strong></span>
        </div></section>
        <section class="seo-card"><h2>Abilities</h2><div class="seo-link-list">${abilities.map(ability => seoLink("abilities", ability)).join("")}</div></section>
        <section class="seo-card"><h2>Moves</h2><div class="seo-link-list">${moves.slice(0, 30).map(move => seoLink("moves", move)).join("")}</div></section>
        <section class="seo-card"><h2>Explore More</h2><div class="seo-link-list">
            <a href="../../Meta.html">Competitive Meta</a><a href="../../TeamBuilder.html">Team Builder</a><a href="../../DamageCalc.html">Damage Calculator</a>
        </div></section>
    `;
    const image = data.sprites?.other?.["official-artwork"]?.front_default;
    if (image) document.querySelector(".seo-hero-card").insertAdjacentHTML("beforeend", `<img src="${image}" alt="${seoName(data.name)} official artwork" width="180" height="180" loading="eager" decoding="async">`);
}

function renderCollection(data, route) {
    const details = document.querySelector("#seo-details");
    const entries = route.kind === "types" ? data.pokemon.map(item => item.pokemon) : route.kind === "moves" ? data.learned_by_pokemon : route.kind === "abilities" ? data.pokemon.map(item => item.pokemon) : route.kind === "items" ? (data.held_by_pokemon || []) : [];
    const listKind = route.kind === "types" || route.kind === "abilities" || route.kind === "moves" ? "pokemon" : "items";
    const itemEffect = route.kind === "items" ? (data.effect_entries?.find(entry => entry.language?.name === "en")?.effect || "") : "";
    const itemSummary = route.kind === "items" ? `<section class="seo-card"><h2>Item Details</h2><div class="seo-stat-list"><span>Cost: <strong>${data.cost ?? "—"}</strong></span><span>${itemEffect || "Competitive item data and related Pokémon."}</span></div></section>` : "";
    details.innerHTML = `${itemSummary}<section class="seo-card"><h2>Related Pokémon</h2><div class="seo-link-list">${seoList(entries, "pokemon") || "<span>No related Pokémon listed by PokéAPI.</span>"}</div></section><section class="seo-card"><h2>Explore Database</h2><div class="seo-link-list"><a href="../../PokemonDatabase.html">Full Pokédex</a><a href="../../Meta.html">Competitive Meta</a></div></section>`;
}

async function loadSeoPage() {
    const route = getSeoRoute();
    if (!route || !route.slug) return;
    const endpoint = `${SEO_API_ROOT}/${seoEndpoint(route.kind)}/${encodeURIComponent(route.slug)}`;
    const fallbackDescription = `${seoName(route.slug)} ${SEO_KIND_LABELS[route.kind]} data, related Pokémon, competitive information and useful database links.`;
    renderSeoShell(route, route.slug, fallbackDescription);
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Not found");
        const data = await response.json();
        setSeoMeta(route, data.name, `${seoName(data.name)} ${SEO_KIND_LABELS[route.kind]} data, stats, related Pokémon and competitive links from PokémonIF.`);
        if (route.kind === "pokemon") renderPokemon(data); else renderCollection(data, route);
    } catch {
        document.querySelector("#seo-details").innerHTML = `<section class="seo-card"><h2>Data unavailable</h2><p class="seo-error">This entry could not be loaded right now. Return to the <a href="../../PokemonDatabase.html">Pokédex</a> and try again.</p></section>`;
    }
}

loadSeoPage();
