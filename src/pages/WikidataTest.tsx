import { useState } from "react";
import { searchWikidataCharacters, type WikiCharacter } from "../lib/wikidata";

export default function WikidataTest() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<WikiCharacter[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    const query = q.trim();
    if (query.length < 2) return;

    setLoading(true);
    try {
      const r = await searchWikidataCharacters(query);

      // 1) dédup par id
      let unique = Array.from(new Map(r.map((x) => [x.id, x])).values());

      // 2) dédup par image (évite 4 fois la même photo)
      unique = unique.filter(
        (x, idx, arr) => arr.findIndex((y) => y.img && x.img && y.img === x.img) === idx
      );

      // 3) tri: match dans le nom d'abord
      const Q = query.toLowerCase();
      unique.sort((a, b) => {
        const aHit = a.name.toLowerCase().includes(Q) ? 1 : 0;
        const bHit = b.name.toLowerCase().includes(Q) ? 1 : 0;
        return bHit - aHit;
      });

      setItems(unique);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Wikidata test</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tape un personnage (ex: batman, naruto...)"
          style={{
            padding: 12,
            flex: 1,
            borderRadius: 999,
            border: "1px solid rgba(142,202,254,0.34)",
            background: "rgba(10, 13, 34, 0.86)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: "12px 18px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((c) => (
          <div
            key={c.id}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(255,155,215,0.1), rgba(142,202,254,0.08))",
              border: "1px solid rgba(142,202,254,0.28)",
            }}
          >
            <div style={{ width: "100%", aspectRatio: "2/3", background: "#111" }}>
              {c.img ? (
                <img
                  src={c.img}
                  alt={c.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : null}
            </div>

            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
              {c.description ? (
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
                  {c.description}
                </div>
              ) : null}
              <div style={{ opacity: 0.5, fontSize: 11, marginTop: 6 }}>{c.id}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
