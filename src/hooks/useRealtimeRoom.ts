import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Room } from '../types'

export function useRealtimeRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return

    let isMounted = true
    const fetchRoom = async () => {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle()

      if (!isMounted) return

      if (dbError) {
        setError(dbError.message)
      } else {
        setRoom(data as Room | null)
      }
      setLoading(false)
    }

    fetchRoom()

    const channel = supabase
      .channel(`rooms-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new as Room)
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { room, loading, error }
}

