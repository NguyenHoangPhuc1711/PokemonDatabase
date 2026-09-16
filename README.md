# PokemonInformation

Static multi-page Pokemon database website.

## Run locally

The project uses browser JavaScript and remote APIs, so serve the folder over HTTP instead of opening `index.html` directly.

### Option 1: Python

```powershell
py -m http.server 5500
```

Open <http://127.0.0.1:5500/index.html>.

### Option 2: VS Code Live Server

Open the project folder in VS Code and run **Open with Live Server** on `index.html`.

There is no build step and no package installation required.

## Main pages

- `index.html`: landing page and global search entry
- `PokemonDatabase.html`: Pokemon list, search, filters, sprites, and detail modal
- `Types.html`: type effectiveness chart
- `Meta.html`: Singles/Doubles usage meta and Pokemon details
- `Moves.html`: move search and usage preview
- `Abilities.html`: ability search
- `Breeding.html`: egg groups and breeding lookup
- `EVIV.html`: stat calculator
- `Compare.html`: side-by-side Pokemon comparison
- `TeamBuilder.html`: team builder and weakness analysis
- `TrainerCard.html`: trainer card generator
- `Chatbot.html`: Pokemon chatbot interface
- `DamageCalc.html`: damage calculator

## Runtime dependencies

The browser fetches data from:

- [PokeAPI](https://pokeapi.co/)
- [Pokemon Champions scraper API](https://eurekaffeine.github.io/pokemon-champions-scraper/)
- Smogon usage statistics and the configured CORS fallback used by `Meta.html`

Network access is required for live Pokemon, move, ability, meta, and calculator data. `language.js` caches successful PokeAPI GET responses in `localStorage` for 24 hours.

`ads.js` loads third-party advertisement scripts. Those requests may be blocked by an ad blocker or browser policy; this does not affect the application's own syntax or local assets.

## Validation

Run JavaScript syntax checks from PowerShell:

```powershell
Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Then open the pages through the local HTTP server and verify the API-backed screens with the browser console open.

## Project conventions

- Shared styling lives in `style.css`; the meta page also uses `meta.css` where applicable.
- Each feature page has a matching script file with the same base name.
- Shared behavior is loaded through `ads.js`, `seo.js`, and `language.js`.
- Images used by the landing page and donation section are local project assets.
- Keep API-dependent behavior resilient to failed or unavailable remote requests.

## Step 1: Supabase Pokemon and Move cache

The static frontend now requests Pokemon and Move details through `/api/pokemon-cache`
and `/api/move-cache`. Cloudflare Pages Functions read from Supabase and set CDN cache
headers; while the functions are unavailable, `api-client.js` falls back to PokeAPI
so local static development still works.

1. Run `supabase/migrations/202609160001_create_pokemon_move_cache.sql` in the Supabase SQL editor.
2. Create a Cloudflare Pages project connected to this repository. Use the repository root as the output directory and leave the build command empty; Cloudflare automatically detects the `functions/` directory.
3. In Cloudflare Pages **Settings > Environment variables**, add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for the Production environment. Never add the service-role key to HTML or browser JavaScript.
4. Add the same two values as GitHub repository Actions secrets.
5. Run the `Sync Pokemon API cache` workflow once manually. It can then refresh the cache daily, or run `node scripts/sync-pokeapi-cache.mjs` locally with the two environment variables set.

Step 2 also uses the `SUPABASE_ANON_KEY` Pages variable. Step 3 uses a Gemini API key
from Google AI Studio as `AI_API_KEY`; the default endpoint uses Gemini's OpenAI-compatible
API and `gemini-2.5-flash`. `SUPABASE_SERVICE_ROLE_KEY` must still come from Supabase,
not Gemini. Step 4 uses `ADMIN_USER_IDS`, a comma-separated list of Supabase Auth user
IDs allowed to publish news.

Example requests after deployment:

```text
GET /api/pokemon-cache?name=baxcalibur
GET /api/move-cache?name=ice-shard
```
