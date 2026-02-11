import type { Player } from '../types'

interface PlayerListProps {
  players: Player[]
}

export function PlayerList({ players }: PlayerListProps) {
  if (!players.length) {
    return <p className="hint">Waiting for players to join…</p>
  }

  return (
    <ul className="player-list">
      {players.map((player) => (
        <li key={player.id} className="player-pill">
          <span className="player-avatar">{player.name.slice(0, 2).toUpperCase()}</span>
          <span className="player-name">
            {player.name}
            {player.is_host && <span className="pill pill-host">Host</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

