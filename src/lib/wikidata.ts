export type WikiCharacter = {
  id: string;         // Qxxxx
  name: string;
  description: string;
  img: string | null;
};

function qidFromEntityUrl(url: string) {
  const m = url.match(/\/entity\/(Q\d+)$/);
  return m ? m[1] : url;
}

export async function searchWikidataCharacters(query: string): Promise<WikiCharacter[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const sparql = `
SELECT ?item ?itemLabel ?itemDescription ?image WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam mwapi:search "${q}" .
    bd:serviceParam mwapi:language "fr" .
    ?item wikibase:apiOutputItem mwapi:item .
  }

  ?item wdt:P31/wdt:P279* wd:Q95074 .  # instance of / subclass of fictional character

  OPTIONAL { ?item wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
LIMIT 12
`;

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql+json",
      "User-Agent": "hear-me-out-cake-app/1.0 (https://localhost)",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}: ${text.slice(0, 200)}`);

  const json = JSON.parse(text);

  return (json.results.bindings ?? []).map((b: any) => ({
    id: qidFromEntityUrl(b.item.value),
    name: b.itemLabel?.value || "Unknown",
    description: b.itemDescription?.value || "",
    img: b.image?.value || null,
  }));
}
