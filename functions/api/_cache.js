export const CACHE_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    "Access-Control-Allow-Origin": "*"
};

export function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: CACHE_HEADERS
    });
}

function requireServerConfig(env) {
    const supabaseUrl = env.SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase Pages secrets");
    }
    return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), serviceRoleKey };
}

export async function readCache(env, table, name) {
    const { supabaseUrl, serviceRoleKey } = requireServerConfig(env);
    const query = new URLSearchParams({ name: `eq.${name}`, select: "data", limit: "1" });
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    });
    if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
    const rows = await response.json();
    return rows[0]?.data || null;
}

export async function readCacheList(env, table) {
    const { supabaseUrl, serviceRoleKey } = requireServerConfig(env);
    const query = new URLSearchParams({ select: "name,data", order: "name.asc", limit: "3000" });
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    });
    if (!response.ok) throw new Error(`Supabase list failed: ${response.status}`);
    return response.json();
}