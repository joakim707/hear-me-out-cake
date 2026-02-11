import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Entry } from '../types'

export function useRealtimeEntries(roomId: string | undefined) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return

    let isMounted = true

    const fetchEntries = async () => {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('entries')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!isMounted) return

      if (dbError) {
        setError(dbError.message)
      } else {
        setEntries((data ?? []) as Entry[])
      }
      setLoading(false)
    }

    fetchEntries()

    const channel = supabase
      .channel(`entries-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `room_id=eq.${roomId}` },
        () => {
          void fetchEntries()
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { entries, loading, error }
}

