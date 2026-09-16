import { apiJson, bearerToken, supabaseAuthUser, supabaseRest, errorJson } from "../_supabase.js";

export async function onRequestGet(context) {
    try {
        const token = bearerToken(context.request);
        const user = await supabaseAuthUser(context.env, token);
        if (!user) return apiJson({ error: "Login required" }, 401);
        const rows = await supabaseRest(context.env, "teams", {
            token,
            query: { id: `eq.${context.params.id}`, user_id: `eq.${user.id}`, select: "*", limit: "1" }
        });
        if (!rows[0]) return apiJson({ error: "Team not found" }, 404);
        return apiJson(rows[0]);
    } catch (error) { return errorJson(error); }
}