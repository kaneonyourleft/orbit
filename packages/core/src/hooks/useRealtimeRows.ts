import { useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useRealtimeRows(
  supabase: SupabaseClient, 
  tableId: string, 
  onUpdate: (payload: any) => void
) {
  useEffect(() => {
    if (!tableId) return

    const channel = supabase
      .channel(`realtime:rows:${tableId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'rows', 
          filter: `table_id=eq.${tableId}` 
        },
        (payload) => {
          onUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, tableId, onUpdate])
}
