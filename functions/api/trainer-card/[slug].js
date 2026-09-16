import { apiJson, supabaseRest, errorJson } from "../_supabase.js";

export async function onRequestGet(context) {
    try {
        const rows = await supabaseRest(context.env, "trainer_cards", {
            query: { slug: `eq.${context.params.slug}`, select: "*", limit: "1" }
        });
        if (!rows[0]) return apiJson({ error: "Trainer card not found" }, 404);
        return apiJson(rows[0]);
    } catch (error) { return errorJson(error); }
}