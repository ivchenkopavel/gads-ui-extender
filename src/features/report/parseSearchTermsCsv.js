import Papa from "papaparse";

/**
 * Expected: Google Ads Search Terms export (CSV), any UI language.
 * Detects Search Term column by known header variants (EN/RU + heuristics).
 */
export async function parseSearchTermsCsv(file) {
  const textRaw = await file.text();

  const parsed = Papa.parse(textRaw, {
    header: true,
    skipEmptyLines: true,

    // Removes BOM and trims header cells
    transformHeader: (h) => String(h || "").replace(/^\uFEFF/, "").trim(),

    // Helps when BOM appears before first chunk
    beforeFirstChunk: (chunk) => String(chunk || "").replace(/^\uFEFF/, ""),
  });

  const rawRows = parsed.data || [];
  const rawCols = parsed.meta?.fields || [];

  const searchTermCol = detectSearchTermColumn(rawCols);

  const rows = rawRows.map((r, i) => {
    // Ensure object keys match the transformed headers
    const normalizedRow = r || {};
    return {
      __rowId: i + 1,
      ...normalizedRow,
      searchTerm: String(normalizedRow?.[searchTermCol] ?? ""),
    };
  });

  const columns = rawCols.length ? rawCols : ["Search term"];

  return {
    columns,
    rows,
    searchTermColumnName: searchTermCol,
  };
}

/**
 * Try to find the column name that represents Search Term.
 * Covers common Google Ads export localizations + heuristics.
 */
function detectSearchTermColumn(cols) {
  if (!cols || !cols.length) return "Search term";

  const normalized = cols.map((c) => ({
    original: c,
    key: normalizeHeader(c),
  }));

  // Known exact matches (add more if you encounter them)
  const exactCandidates = new Set([
    "search term",
    "search terms",
    "customer search term",
    "search query",
    "queries",
    // Russian variants
    "поисковый запрос",
    "поисковые запросы",
    "поисковый термин",
    "поисковые термины",
    "поисковая фраза",
    "поисковые фразы",
  ]);

  const exact = normalized.find((x) => exactCandidates.has(x.key));
  if (exact) return exact.original;

  // Heuristics:
  // English-ish: contains both "search" and ("term" or "query")
  const enHeuristic = normalized.find(
    (x) =>
      x.key.includes("search") && (x.key.includes("term") || x.key.includes("query"))
  );
  if (enHeuristic) return enHeuristic.original;

  // Russian-ish: contains "поиск" and something like "запрос"/"термин"/"фраз"
  const ruHeuristic = normalized.find((x) => {
    const k = x.key;
    return (
      (k.includes("поиск") || k.includes("поисков")) &&
      (k.includes("запрос") || k.includes("термин") || k.includes("фраз"))
    );
  });
  if (ruHeuristic) return ruHeuristic.original;

  // Fallback: if there is a column literally called "Keyword" in some exports,
  // we DO NOT choose it (it's not search term). Prefer first column as last resort.
  return cols[0];
}

function normalizeHeader(h) {
  return String(h || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
}



