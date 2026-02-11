import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Player, Room } from '../types'
import { normalizeRoomCode } from '../lib/roomCode'

interface UseRoomOptions {
  roomCode?: string
  deviceId?: string | null
}

interface UseRoomResult {
  room: Room | null
  player: Player | null
  loading: boolean
  error: string | null
}

export function useRoom({ roomCode, deviceId }: UseRoomOptions): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode || !deviceId) return

    const code = normalizeRoomCode(roomCode)
    let isMounted = true

    const joinRoom = async () => {
      setLoading(true)

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (!isMounted) return

      if (roomError || !roomData) {
        setError(roomError?.message ?? 'Room not found')
        setLoading(false)
        return
      }

      setRoom(roomData as Room)

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('device_id', deviceId)
        .maybeSingle()

      if (!isMounted) return

      if (playerError) {
        setError(playerError.message)
        setLoading(false)
        return
      }

      if (playerData) {
        setPlayer(playerData as Player)
        setLoading(false)
        return
      }

      const { data: inserted, error: insertError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: 'Anonymous',
          device_id: deviceId,
          is_host: false,
        })
        .select('*')
        .single()

      if (!isMounted) return

      if (insertError) {
        setError(insertError.message)
      } else {
        setPlayer(inserted as Player)
      }

      setLoading(false)
    }

    void joinRoom()

    return () => {
      isMounted = false
    }
  }, [roomCode, deviceId])

  return { room, player, loading, error }
}

