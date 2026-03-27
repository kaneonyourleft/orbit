import { useState, useEffect } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useWorkspaces(supabase: SupabaseClient) {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .order('name')

        if (error) throw error
        setWorkspaces(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [supabase])

  return { workspaces, loading, error }
}
