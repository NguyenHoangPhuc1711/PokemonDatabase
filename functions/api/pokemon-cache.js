import { jsonResponse, readCache, readCacheList } from "./_cache.js";

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        if (url.searchParams.get("list") === "1") {
            const rows = await readCacheList(context.env, "pokemon_cache");
            return jsonResponse(rows.map(row => ({
                name: row.data.name || row.name,
                id: row.data.id,
                url: `https://pokeapi.co/api/v2/pokemon/${row.data.name || row.name}`
            })));
        }

        const name = String(url.searchParams.get("name") || "").trim().toLowerCase();
        if (!name) return jsonResponse({ error: "Query parameter 'name' is required" }, 400);
        const data = await readCache(context.env, "pokemon_cache", name);
        if (!data) return jsonResponse({ error: "Pokemon is not cached" }, 404);
        return jsonResponse(data);
    } catch (error) {
        console.error("pokemon-cache error", error);
        return jsonResponse({ error: "Pokemon cache is unavailable" }, 500);
    }
}