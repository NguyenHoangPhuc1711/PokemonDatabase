import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const api = "https://pokeapi.co/api/v2";
const siteName = "PokémonIF";

function slug(value) {
    return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function displayName(value) {
    return String(value).replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function pageTemplate(kind, itemName, description) {
    const title = kind === "pokemon"
        ? `${displayName(itemName)} — Stats, Moves, Abilities & Competitive | ${siteName}`
        : `${displayName(itemName)} ${kind.slice(0, -1)} — ${siteName}`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index,follow">
    <link rel="canonical" href="https://pokemonif.com/${kind}/${slug(itemName)}/">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <link rel="stylesheet" href="../../style.css?v=20260916-2">
    <link rel="stylesheet" href="../../seo-page.css">
</head>
<body class="seo-page">
    <header class="header">
        <div class="logo"><a href="../../index.html" style="color:inherit;text-decoration:none"><span class="pokeball">●</span>${siteName}</a></div>
        <nav><a href="../../PokemonDatabase.html">Pokédex</a><a href="../../Types.html">Types</a><a href="../../Meta.html">Meta</a><a href="../../Moves.html">Moves</a><a href="../../Abilities.html">Abilities</a><a href="../../TeamBuilder.html">Team Builder</a><a href="../../DamageCalc.html">Calculate</a></nav>
    </header>
    <main class="seo-main" id="seo-content">
        <nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="../../index.html">${siteName}</a><span>/</span><a href="../../${kind}/">${kind}</a><span>/</span><strong>${displayName(itemName)}</strong></nav>
        <section class="seo-hero-card"><span class="seo-kicker">${kind} database</span><h1>${displayName(itemName)}</h1><p class="seo-summary">${description}</p></section>
        <div class="seo-grid" id="seo-details"><section class="seo-card"><h2>Loading data</h2><p class="seo-loading">Loading live data from PokéAPI...</p></section></div>
    </main>
    <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, description, url: `https://pokemonif.com/${kind}/${slug(itemName)}/` })}</script>
    <script src="../../seo-page.js"></script>
</body>
</html>`;
}

async function fetchNames(path, limit = 3000) {
    const response = await fetch(`${api}/${path}?limit=${limit}`);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    const data = await response.json();
    return data.results.map(item => item.name).filter(Boolean);
}

async function writeRoute(kind, names) {
    for (const name of names) {
        const route = join(root, kind, slug(name), "index.html");
        await mkdir(join(root, kind, slug(name)), { recursive: true });
        const description = kind === "pokemon"
            ? `${displayName(name)} stats, moves, abilities, types and competitive links for Pokémon trainers.`
            : `${displayName(name)} ${kind} data and related Pokémon links from the PokémonIF database.`;
        await writeFile(route, pageTemplate(kind, name, description), "utf8");
    }
}

async function writeIndex(kind, names) {
    const links = names.slice(0, 100).map(name => `<li><a href="${slug(name)}/">${displayName(name)}</a></li>`).join("");
    const route = join(root, kind, "index.html");
    await mkdir(join(root, kind), { recursive: true });
    await writeFile(route, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${displayName(kind)} Database | ${siteName}</title><meta name="description" content="Browse the ${kind} database on ${siteName}."><link rel="stylesheet" href="../style.css?v=20260916-2"><link rel="stylesheet" href="../seo-page.css"></head><body class="seo-page"><main class="seo-main"><section class="seo-hero-card"><span class="seo-kicker">${kind} database</span><h1>${displayName(kind)} Database</h1><p class="seo-summary">Browse searchable ${kind} pages with related Pokémon and competitive links.</p></section><section class="seo-card"><ul class="seo-link-list">${links}</ul></section></main></body></html>`, "utf8");
}

async function writeSitemap(kind, names) {
    const urls = names.map(name => `  <url><loc>https://pokemonif.com/${kind}/${slug(name)}/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`).join("\n");
    await writeFile(join(root, `sitemap-${kind}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
}

const routes = [
    ["pokemon", "pokemon", 2000],
    ["types", "type", 50],
    ["moves", "move", 1000],
    ["abilities", "ability", 1000],
    ["items", "item", 3000]
];

const requestedKind = process.argv[2];
const routesToGenerate = requestedKind ? routes.filter(([kind]) => kind === requestedKind) : routes;

for (const [kind, endpoint, limit] of routesToGenerate) {
    const names = await fetchNames(endpoint, limit);
    await writeRoute(kind, names);
    await writeIndex(kind, names);
    await writeSitemap(kind, names);
    console.log(`${kind}: generated ${names.length} pages`);
}

if (!requestedKind || requestedKind === "meta") {
    await mkdir(join(root, "meta"), { recursive: true });
    await writeFile(join(root, "meta", "index.html"), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=../Meta.html"><link rel="canonical" href="https://pokemonif.com/meta/">`, "utf8");
    console.log("meta: generated route alias");
}
