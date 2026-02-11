import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getDeviceId } from "../lib/device";
import { searchTmdbPeople } from "../lib/tmdb";
import { searchWikidataCharacters } from "../lib/wikidata";

type Mode = "tmdb" | "wikidata";

type Pick = {
  name: string;
  img: string | null;
  subtitle?: string;
  source: Mode;
};

type RoomRow = { id: string; code: string };
type PlayerRow = { id: string; room_id: string; name: string; device_id: string; is_host: boolean };

export default function AddEntry() {
  const { code } = useParams();
  const roomCode = (code || "").toUpperCase();
  const nav = useNavigate();
  const deviceId = useMemo(() => getDeviceId(), []);

  const [mode, setMode] = useState<Mode>("tmdb");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Pick[]>([]);
  const [selected, setSelected] = useState<Pick | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (query.length < 2) {
        setResults([]);
        setSelected(null);
        return;
      }

      try {
        setSelected(null);

        if (mode === "tmdb") {
          const r = await searchTmdbPeople(query);
          setResults(
            r.map((p) => ({
              name: p.name,
              img: p.img,
              subtitle: p.knownFor,
              source: "tmdb" as const,
            }))
          );
        } else {
          const r = await searchWikidataCharacters(query);

          // dédup + tri simple
          let unique = Array.from(new Map(r.map((x) => [x.id, x])).values());
          unique = unique.filter(
            (x, idx, arr) => arr.findIndex((y) => y.img && x.img && y.img === x.img) === idx
          );
          const Q = query.toLowerCase();
          unique.sort(
            (a, b) =>
              (b.name.toLowerCase().includes(Q) ? 1 : 0) -
              (a.name.toLowerCase().includes(Q) ? 1 : 0)
          );

          setResults(
            unique.map((c) => ({
              name: c.name,
              img: c.img,
              subtitle: c.description,
              source: "wikidata" as const,
            }))
          );
        }
      } catch (e) {
        console.error(e);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [q, mode]);

  async function submit() {
    if (!roomCode) return alert("Room invalide");
    if (!selected?.img) return alert("Choisis un résultat avec une image");

    setLoading(true);
    try {
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single<RoomRow>();
      if (roomErr || !room) throw new Error("Room introuvable");

      const { data: me, error: meErr } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .eq("device_id", deviceId)
        .single<PlayerRow>();
      if (meErr || !me) throw new Error("Player introuvable. Rejoins la room depuis la home.");

      const { error: insErr } = await supabase.from("entries").insert({
        room_id: room.id,
        player_id: me.id,
        title: selected.name,
        caption: caption.trim() || null,
        image_url: selected.img,
        source: selected.source,
      });
      if (insErr) throw insErr;

      nav(`/room/${roomCode}`);
    } catch (e: any) {
      alert(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Ajouter au gâteau</h2>
      <p>
        Room : <b>{roomCode}</b>
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => setMode("tmdb")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            fontWeight: 800,
            opacity: mode === "tmdb" ? 1 : 0.6,
          }}
        >
          👤 Personne réelle
        </button>
        <button
          onClick={() => setMode("wikidata")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            fontWeight: 800,
            opacity: mode === "wikidata" ? 1 : 0.6,
          }}
        >
          🧙 Fiction
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={mode === "tmdb" ? "Ex: Ryan Gosling" : "Ex: Batman, Naruto..."}
        style={{ width: "100%", padding: 12, borderRadius: 999, marginBottom: 16 }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {results.map((c, idx) => (
          <button
            key={`${c.source}-${c.name}-${idx}`}
            onClick={() => setSelected(c)}
            style={{
              textAlign: "left",
              borderRadius: 16,
              overflow: "hidden",
              border:
                selected === c
                  ? "2px solid rgb(142, 202, 254)"
                  : "1px solid rgba(142, 202, 254, 0.28)",
              background: "linear-gradient(180deg, rgba(255,155,215,0.12), rgba(142,202,254,0.08))",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div style={{ width: "100%", aspectRatio: "2/3", background: "#111" }}>
              {c.img ? (
                <img
                  src={c.img}
                  alt={c.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              ) : null}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
              {c.subtitle ? (
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
                  {c.subtitle}
                </div>
              ) : null}
              <div style={{ opacity: 0.6, fontSize: 11, marginTop: 6 }}>
                {c.source}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Caption (optionnel)</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Hear me out… 😂"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            minHeight: 90,
            marginTop: 6,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={submit}
          disabled={loading || !selected}
          style={{ padding: 12, borderRadius: 12, fontWeight: 900 }}
        >
          {loading ? "Ajout..." : "Ajouter"}
        </button>
        <button
          onClick={() => nav(`/room/${roomCode}`)}
          disabled={loading}
          style={{ padding: 12, borderRadius: 12 }}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
