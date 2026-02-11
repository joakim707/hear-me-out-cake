import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Player } from '../types'

export function useRealtimePlayers(roomId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return

    let isMounted = true

    const fetchPlayers = async () => {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!isMounted) return

      if (dbError) {
        setError(dbError.message)
      } else {
        setPlayers((data ?? []) as Player[])
      }
      setLoading(false)
    }

    fetchPlayers()

    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => {
          void fetchPlayers()
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { players, loading, error }
}

