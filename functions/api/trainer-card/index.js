import { apiJson, bearerToken, supabaseAuthUser, supabaseRest, errorJson } from "../_supabase.js";

function makeSlug(value) {
    return String(value || "trainer-card").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "trainer-card";
}

export async function onRequestPost(context) {
    try {
        const token = bearerToken(context.request);
        const user = await supabaseAuthUser(context.env, token);
        const body = await context.request.json();
        const suffix = crypto.randomUUID().slice(0, 8);
        const slug = `${makeSlug(body.slug || body.name)}-${suffix}`;
        let imageUrl = body.image_url || null;
        if (typeof body.image_data_url === "string" && body.image_data_url.startsWith("data:image/png;base64,")) {
            const base64 = body.image_data_url.slice("data:image/png;base64,".length);
            const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
            const { url, serviceKey } = getStorageConfig(context.env);
            const upload = await fetch(`${url}/storage/v1/object/trainer-cards/${slug}.png`, {
                method: "POST",
                headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "image/png", "x-upsert": "true" },
                body: bytes
            });
            if (!upload.ok) throw new Error("Trainer card image upload failed");
            imageUrl = `${url}/storage/v1/object/public/trainer-cards/${slug}.png`;
        }
        const rows = await supabaseRest(context.env, "trainer_cards", {
            method: "POST",
            token,
            body: {
                user_id: user?.id || null,
                name: body.name || "Trainer Card",
                slug,
                card_data_json: body.card_data_json || {},
                image_url: imageUrl
            }
        });
        return apiJson(rows?.[0] || rows, 201);
    } catch (error) { return errorJson(error); }
}

function getStorageConfig(env) {
    const url = env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Missing Supabase storage configuration");
    return { url, serviceKey };
}