export function getConfig(env) {
    const url = env.SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = env.SUPABASE_ANON_KEY;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey) throw new Error("Missing Supabase URL or anon key");
    return { url, anonKey, serviceKey };
}

export function bearerToken(request) {
    const value = request.headers.get("Authorization") || "";
    return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function supabaseAuthUser(env, token) {
    if (!token) return null;
    const { url, anonKey } = getConfig(env);
    const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
    });
    return response.ok ? response.json() : null;
}

export async function supabaseRest(env, table, options = {}) {
    const { url, anonKey, serviceKey } = getConfig(env);
    const key = options.service ? serviceKey : anonKey;
    if (!key) throw new Error("Missing Supabase service key");
    const query = options.query ? `?${new URLSearchParams(options.query)}` : "";
    const headers = {
        apikey: key,
        Authorization: `Bearer ${options.token || key}`,
        Prefer: options.prefer || "return=representation"
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${url}/rest/v1/${table}${query}`, {
        method: options.method || "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!response.ok) {
        const error = new Error(`Supabase request failed: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

export function apiJson(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        }
    });
}

export function errorJson(error) {
    console.error(error);
    return apiJson({ error: error.message || "Request failed" }, error.status || 500);
}