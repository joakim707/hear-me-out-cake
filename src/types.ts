export type RoomStatus = 'lobby' | 'reveal' | 'voting' | 'done'

export interface Room {
  id: string
  code: string
  status: RoomStatus
  reveal_index: number | null
}

export interface Player {
  id: string
  room_id: string
  name: string
  device_id: string
  is_host: boolean
}

export interface Entry {
  id: string
  room_id: string
  player_id: string
  title: string
  caption: string
  image_path: string
}

export type VoteCategory = 'wildest'

export interface Vote {
  id: string
  room_id: string
  entry_id: string
  voter_player_id: string
  category: VoteCategory
  value: number
}

