import { apiJson, getConfig, supabaseAuthUser, bearerToken } from "./_supabase.js";

export async function onRequestGet(context) {
    try {
        const user = await supabaseAuthUser(context.env, bearerToken(context.request));
        return apiJson({ user });
    } catch (error) {
        return apiJson({ user: null }, 200);
    }
}

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { url, anonKey } = getConfig(context.env);
        const action = body.action === "signup" ? "signup" : "token?grant_type=password";
        const response = await fetch(`${url}/auth/v1/${action}`, {
            method: "POST",
            headers: { apikey: anonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ email: body.email, password: body.password })
        });
        const data = await response.json();
        return apiJson(data, response.status);
    } catch (error) {
        return apiJson({ error: error.message || "Authentication failed" }, 400);
    }
}