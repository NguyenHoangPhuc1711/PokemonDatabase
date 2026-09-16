(function () {
    const POKE_API = "https://pokeapi.co/api/v2";

    async function fetchCached(path, fallbackUrl) {
        try {
            const response = await fetch(path);
            if (response.ok) return response.json();
        } catch {
            // Use the source API while the cache service is unavailable.
        }
        const fallback = await fetch(fallbackUrl);
        if (!fallback.ok) throw new Error(`Request failed: ${fallback.status}`);
        return fallback.json();
    }

    window.PokemonApi = {
        getPokemon(name) {
            const key = encodeURIComponent(String(name).trim().toLowerCase());
            return fetchCached(`/api/pokemon-cache?name=${key}`, `${POKE_API}/pokemon/${key}`);
        },
        getMove(name) {
            const key = encodeURIComponent(String(name).trim().toLowerCase());
            return fetchCached(`/api/move-cache?name=${key}`, `${POKE_API}/move/${key}`);
        },
        listPokemon() {
            return fetchCached(`/api/pokemon-cache?list=1`, `${POKE_API}/pokemon?limit=2000`).then(data =>
                data.results || data
            );
        }
    };
})();