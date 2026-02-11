import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Vote } from '../types'

export function useVotes(roomId: string | undefined) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return

    let isMounted = true

    const fetchVotes = async () => {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomId)

      if (!isMounted) return

      if (dbError) {
        setError(dbError.message)
      } else {
        setVotes((data ?? []) as Vote[])
      }
      setLoading(false)
    }

    fetchVotes()

    const channel = supabase
      .channel(`votes-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        () => {
          void fetchVotes()
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { votes, loading, error }
}

