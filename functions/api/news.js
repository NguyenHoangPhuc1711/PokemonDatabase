import { apiJson, bearerToken, getConfig, supabaseAuthUser, supabaseRest, errorJson } from "./_supabase.js";

export async function onRequestGet(context) {
    try {
        const rows = await supabaseRest(context.env, "news_items", {
            query: { is_published: "eq.true", order: "published_at.desc", select: "*", limit: "50" }
        });
        return apiJson(rows);
    } catch (error) { return errorJson(error); }
}

export async function onRequestPost(context) {
    try {
        const token = bearerToken(context.request);
        const user = await supabaseAuthUser(context.env, token);
        const admins = String(context.env.ADMIN_USER_IDS || "").split(",").map(value => value.trim()).filter(Boolean);
        if (!user || !admins.includes(user.id) && user.app_metadata?.role !== "admin") {
            return apiJson({ error: "Admin access required" }, 403);
        }
        const body = await context.request.json();
        const rows = await supabaseRest(context.env, "news_items", {
            method: "POST",
            service: true,
            body: {
                title: body.title,
                summary: body.summary || "",
                tag: body.tag || "News",
                source_name: body.source_name || "",
                source_url: body.source_url || "",
                published_at: body.published_at || new Date().toISOString(),
                is_published: Boolean(body.is_published)
            }
        });
        return apiJson(rows?.[0] || rows, 201);
    } catch (error) { return errorJson(error); }
}