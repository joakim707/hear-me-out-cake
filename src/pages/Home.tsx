import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { makeRoomCode } from "../lib/roomCode";
import { getDeviceId } from "../lib/device";

export default function Home() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function createRoom() {
    const playerName = name.trim() || "Anonyme";
    const roomCode = makeRoomCode(5);

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .insert({ code: roomCode, status: "lobby", reveal_index: 0 })
      .select()
      .single();

    if (roomErr) return alert(roomErr.message);

    const deviceId = getDeviceId();
    const { error: playerErr } = await supabase.from("players").insert({
      room_id: room.id,
      name: playerName,
      device_id: deviceId,
      is_host: true,
    });

    if (playerErr) return alert(playerErr.message);

    nav(`/room/${roomCode}`);
  }

  async function joinRoom() {
    const playerName = name.trim() || "Anonyme";
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) return;

    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single();

    if (error) return alert("Room introuvable.");

    const deviceId = getDeviceId();
    const { error: pErr } = await supabase
      .from("players")
      .upsert(
        { room_id: room.id, name: playerName, device_id: deviceId, is_host: false },
        { onConflict: "room_id,device_id" }
      );

    if (pErr) return alert(pErr.message);

    nav(`/room/${roomCode}`);
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Hear Me Out Cake 🍰</h1>

      <label>Ton pseudo</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Joakim"
        style={{ width: "100%", padding: 10, margin: "8px 0 16px" }}
      />

      <button onClick={createRoom} style={{ width: "100%", padding: 12 }}>
        Créer une room
      </button>

      <div style={{ height: 16 }} />

      <label>Code room</label>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="K9F2Q"
        style={{ width: "100%", padding: 10, margin: "8px 0 12px", textTransform: "uppercase" }}
      />

      <button onClick={joinRoom} style={{ width: "100%", padding: 12 }}>
        Rejoindre
      </button>
    </div>
  );
}

