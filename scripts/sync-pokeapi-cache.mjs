const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POKE_API = "https://pokeapi.co/api/v2";
const CONCURRENCY = 8;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the cache sync.");
}

async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
}

async function fetchDetails(resource, names) {
    const results = [];
    let cursor = 0;
    async function worker() {
        while (cursor < names.length) {
            const index = cursor++;
            const name = names[index];
            results[index] = { name, data: await getJson(`${POKE_API}/${resource}/${encodeURIComponent(name)}`) };
            if ((index + 1) % 100 === 0 || index + 1 === names.length) {
                console.log(`${resource}: ${index + 1}/${names.length}`);
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, names.length) }, worker));
    return results;
}

async function upsert(table, rows) {
    for (let index = 0; index < rows.length; index += 100) {
        const batch = rows.slice(index, index + 100).map(row => ({
            name: row.name,
            data: row.data,
            source_updated_at: new Date().toISOString()
        }));
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: "POST",
            headers: {
                apikey: SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates"
            },
            body: JSON.stringify(batch)
        });
        if (!response.ok) throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${await response.text()}`);
        console.log(`${table}: saved ${Math.min(index + 100, rows.length)}/${rows.length}`);
    }
}

async function syncResource(resource, table, limit) {
    const listing = await getJson(`${POKE_API}/${resource}?limit=${limit}`);
    const names = listing.results.map(item => item.name);
    const rows = await fetchDetails(resource, names);
    await upsert(table, rows);
}

await syncResource("pokemon", "pokemon_cache", 2000);
await syncResource("move", "move_cache", 1000);
console.log("Pokemon and move cache sync complete.");