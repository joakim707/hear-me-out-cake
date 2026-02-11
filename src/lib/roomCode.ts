const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeRoomCode(len = 5) {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPH[Math.floor(Math.random() * ALPH.length)];
  return out;
}

