import { apiJson } from "./_supabase.js";

export async function onRequestPost(context) {
    try {
        const apiUrl = context.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
        const apiKey = context.env.AI_API_KEY;
        const model = context.env.AI_MODEL || "gpt-4o-mini";
        if (!apiKey) return apiJson({ error: "AI service is not configured" }, 503);
        const body = await context.request.json();
        const message = String(body.message || "").trim();
        if (!message) return apiJson({ error: "Message is required" }, 400);
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                messages: [
                    { role: "system", content: "You are a concise Pokemon expert. Answer in the user's language. Cover types, base stats, abilities, moves, items, team building, and competitive strategy. Do not invent live rankings; say when data may be outdated. Return only helpful plain text." },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await response.json();
        if (!response.ok) return apiJson({ error: "AI request failed" }, 502);
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) return apiJson({ error: "AI returned an empty response" }, 502);
        return apiJson({ reply });
    } catch (error) {
        console.error("chatbot error", error);
        return apiJson({ error: "AI service unavailable" }, 503);
    }
}