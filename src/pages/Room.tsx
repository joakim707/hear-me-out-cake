import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getDeviceId } from "../lib/device";

type RoomRow = { id: string; code: string; status: string; reveal_index: number };
type PlayerRow = { id: string; room_id: string; name: string; device_id: string; is_host: boolean };
type EntryRow = {
  id: string;
  room_id: string;
  player_id: string;
  title: string;
  caption: string | null;
  image_url: string | null;
  source: "tmdb" | "wikidata";
  created_at: string;
};
type PlacementRow = { room_id: string; entry_id: string; x: number; y: number };

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = useMemo(() => (code || "").toUpperCase(), [code]);
  const deviceId = useMemo(() => getDeviceId(), []);

  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [placements, setPlacements] = useState<Record<string, { x: number; y: number }>>({});
  const [me, setMe] = useState<PlayerRow | null>(null);

  const cakeRef = useRef<HTMLDivElement | null>(null);
  const askedNameRef = useRef(false);

  useEffect(() => {
    let unsubPlayers: (() => void) | null = null;
    let unsubEntries: (() => void) | null = null;
    let unsubPlacements: (() => void) | null = null;
    let unsubRoom: (() => void) | null = null;

    async function load() {
      const { data: r } = await supabase.from("rooms").select("*").eq("code", roomCode).single<RoomRow>();
      if (!r) return alert("Room introuvable.");
      setRoom(r);

      const [psRes, esRes, plRes] = await Promise.all([
        supabase.from("players").select("*").eq("room_id", r.id),
        supabase.from("entries").select("*").eq("room_id", r.id).order("created_at", { ascending: false }),
        supabase.from("placements").select("room_id,entry_id,x,y").eq("room_id", r.id),
      ]);

      const ps = (psRes.data || []) as PlayerRow[];
      setPlayers(ps);
      setEntries((esRes.data || []) as EntryRow[]);

      const pl = (plRes.data || []) as PlacementRow[];
      setPlacements(Object.fromEntries(pl.map((p) => [p.entry_id, { x: p.x, y: p.y }])));

      const mine = ps.find((p) => p.device_id === deviceId) || null;
      setMe(mine);

      const playersChannel = supabase
        .channel(`room-players-${r.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${r.id}` }, async () => {
          const { data } = await supabase.from("players").select("*").eq("room_id", r.id);
          const list = (data || []) as PlayerRow[];
          setPlayers(list);
          setMe(list.find((p) => p.device_id === deviceId) || null);
        })
        .subscribe();

      const entriesChannel = supabase
        .channel(`room-entries-${r.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "entries", filter: `room_id=eq.${r.id}` }, async () => {
          const { data } = await supabase.from("entries").select("*").eq("room_id", r.id).order("created_at", { ascending: false });
          setEntries((data || []) as EntryRow[]);
        })
        .subscribe();

      const placementsChannel = supabase
        .channel(`room-placements-${r.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "placements", filter: `room_id=eq.${r.id}` }, async () => {
          const { data } = await supabase.from("placements").select("room_id,entry_id,x,y").eq("room_id", r.id);
          const pl2 = (data || []) as PlacementRow[];
          setPlacements(Object.fromEntries(pl2.map((p) => [p.entry_id, { x: p.x, y: p.y }])));
        })
        .subscribe();

      const roomChannel = supabase
        .channel(`room-${r.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${r.id}` }, async () => {
          const { data } = await supabase.from("rooms").select("*").eq("id", r.id).single<RoomRow>();
          if (data) setRoom(data);
        })
        .subscribe();

      unsubPlayers = () => {
        void supabase.removeChannel(playersChannel);
      };
      unsubEntries = () => {
        void supabase.removeChannel(entriesChannel);
      };
      unsubPlacements = () => {
        void supabase.removeChannel(placementsChannel);
      };
      unsubRoom = () => {
        void supabase.removeChannel(roomChannel);
      };
    }

    if (roomCode) load();
    return () => {
      unsubPlayers?.();
      unsubEntries?.();
      unsubPlacements?.();
      unsubRoom?.();
    };
  }, [roomCode, deviceId]);

  useEffect(() => {
    async function ensurePlayer() {
      if (!room || askedNameRef.current) return;
      if (me) return;

      const { data: existing } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .eq("device_id", deviceId)
        .maybeSingle<PlayerRow>();

      if (existing) {
        setMe(existing);
        return;
      }

      askedNameRef.current = true;
      const name = window.prompt("Ton pseudo ?");
      if (!name?.trim()) return;

      const { error } = await supabase.from("players").insert({
        room_id: room.id,
        device_id: deviceId,
        name: name.trim(),
        is_host: false,
      });

      if (error) console.error(error);
    }

    void ensurePlayer();
  }, [room, deviceId, me]);

  async function copyInviteLink() {
    const url = `${window.location.origin}/room/${room?.code ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copie");
    } catch (error) {
      console.error(error);
      alert(url);
    }
  }

  function getAutoPosition(index: number, total: number) {
    const safeTotal = Math.max(total, 1);
    const angle = (index / safeTotal) * Math.PI * 2 - Math.PI / 2;
    const ring = safeTotal <= 6 ? 0.22 : safeTotal <= 12 ? 0.28 : 0.34;
    const x = 0.5 + Math.cos(angle) * ring;
    const y = 0.5 + Math.sin(angle) * ring;
    return { x, y };
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!room) return;

    const entryId = e.dataTransfer.getData("entryId");
    if (!entryId) return;

    const rect = cakeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    setPlacements((prev) => ({ ...prev, [entryId]: { x, y } }));

    const { error } = await supabase.from("placements").upsert(
      {
        room_id: room.id,
        entry_id: entryId,
        x,
        y,
        placed_by: me?.id ?? null,
      },
      { onConflict: "room_id,entry_id" }
    );

    if (error) console.error(error);
  }

  if (!room) return <div style={{ padding: 16 }}>Chargement...</div>;

  return (
    <div className="cake-page">
      <div className="cake-topbar">
        <div>
          <h2>Room {room.code}</h2>
          <p className="hint">
            Status : <b>{room.status}</b>
          </p>
        </div>

        <div className="cake-topbar-actions">
          <button className="button-secondary" onClick={copyInviteLink}>
            Copier le lien
          </button>
          <button onClick={() => navigate(`/room/${room.code}/add`)}>+ Ajouter</button>
        </div>
      </div>

      <div className="cake-layout-main">
        <div className="cake-board">
          <div
            ref={cakeRef}
            className="cake-drop"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="cake">
              <div className="plate" />
              <div className="layer layer-bottom" />
              <div className="layer layer-middle" />
              <div className="layer layer-top" />
              <div className="icing" />
              <div className="drip drip1" />
              <div className="drip drip2" />
              <div className="drip drip3" />
            </div>

            {entries.map((en, index) => {
              if (!en.image_url) return null;
              const pos = placements[en.id] ?? getAutoPosition(index, entries.length);

              return (
                <div
                  key={en.id}
                  className="cake-candle"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    ["--cake-img" as any]: `url(${en.image_url})`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="cake-panel">
          <h3 className="cake-gallery-title">Hear Me Out ajoutes</h3>

          <div className="cake-gallery-grid">
            {entries.map((en) => {
              const author = players.find((p) => p.id === en.player_id);
              return (
                <button
                  key={en.id}
                  className="cake-gallery-card"
                  draggable
                  onDragStart={(ev) => ev.dataTransfer.setData("entryId", en.id)}
                >
                  <div className="cake-gallery-card-img">{en.image_url ? <img src={en.image_url} alt={en.title} /> : null}</div>
                  <div className="cake-gallery-card-body">
                    <div className="cake-gallery-card-title">{en.title}</div>
                    {author ? <div className="cake-gallery-card-meta">par {author.name}</div> : null}
                    {en.caption ? <div className="cake-gallery-card-meta">{en.caption}</div> : null}
                    <div className="cake-gallery-card-meta">{en.source}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
