import { jsonResponse, readCache } from "./_cache.js";

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const name = String(url.searchParams.get("name") || "").trim().toLowerCase();
        if (!name) return jsonResponse({ error: "Query parameter 'name' is required" }, 400);
        const data = await readCache(context.env, "move_cache", name);
        if (!data) return jsonResponse({ error: "Move is not cached" }, 404);
        return jsonResponse(data);
    } catch (error) {
        console.error("move-cache error", error);
        return jsonResponse({ error: "Move cache is unavailable" }, 500);
    }
}