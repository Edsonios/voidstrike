// netlify/functions/wahapedia.js
// Server-side proxy for Wahapedia CSV exports. Avoids browser CORS entirely:
// the browser calls /.netlify/functions/wahapedia?file=Datasheets and this
// function fetches it from Wahapedia server-to-server and returns the text.
//
// Whitelisted filenames only (can't be abused to fetch arbitrary URLs).
// Caches each file in memory for the lifetime of the warm function instance,
// and sets HTTP cache headers so Netlify's CDN caches it too.

const BASE = "https://wahapedia.ru/wh40k10ed/";

// The CSVs the app understands. Abilities tables included.
const ALLOWED = new Set([
  "Factions",
  "Datasheets",
  "Datasheets_models",
  "Datasheets_wargear",
  "Datasheets_models_cost",
  "Datasheets_keywords",
  "Datasheets_abilities",   // links datasheets -> ability ids + datasheet-specific text
  "Abilities",              // the ability id -> name/description/type table (Core/Faction/etc.)
  "Last_update",
]);

// warm-instance memory cache
const mem = {};

exports.handler = async (event) => {
  const file = (event.queryStringParameters && event.queryStringParameters.file) || "";
  const refresh = (event.queryStringParameters && event.queryStringParameters.refresh) === "1";

  if (!ALLOWED.has(file)) {
    return resp(400, "Bad or missing 'file' parameter.", "text/plain");
  }

  if (!refresh && mem[file]) {
    return resp(200, mem[file], "text/csv", true);
  }

  try {
    const url = BASE + file + ".csv";
    const r = await fetch(url, {
      headers: { "User-Agent": "voidstrike-sim/1.0 (Netlify Function)" },
    });
    if (!r.ok) {
      return resp(502, `Upstream HTTP ${r.status} for ${file}.csv`, "text/plain");
    }
    const text = await r.text();
    if (!text || text.indexOf("|") === -1) {
      return resp(502, `Upstream returned no CSV for ${file}.csv`, "text/plain");
    }
    mem[file] = text;
    return resp(200, text, "text/csv", true);
  } catch (e) {
    return resp(502, `Fetch error: ${e.message}`, "text/plain");
  }
};

function resp(status, body, type, cache) {
  const headers = {
    "Content-Type": type + "; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  };
  // Cache successful CSVs at the CDN for a day; clients can force ?refresh=1.
  if (cache) headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800";
  return { statusCode: status, headers, body };
}
