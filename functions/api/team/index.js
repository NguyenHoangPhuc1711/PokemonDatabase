import { apiJson, bearerToken, supabaseAuthUser, supabaseRest, errorJson } from "../_supabase.js";

export async function onRequestPost(context) {
    try {
        const token = bearerToken(context.request);
        const user = await supabaseAuthUser(context.env, token);
        if (!user) return apiJson({ error: "Login required" }, 401);
        const body = await context.request.json();
        const rows = await supabaseRest(context.env, "teams", {
            method: "POST",
            token,
            body: { user_id: user.id, name: body.name || "My Team", pokemon_json: body.pokemon_json || [] }
        });
        return apiJson(rows?.[0] || rows, 201);
    } catch (error) { return errorJson(error); }
}