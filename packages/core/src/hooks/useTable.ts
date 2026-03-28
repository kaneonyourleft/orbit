import { useState, useEffect, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useTable(supabase: SupabaseClient, tableId: string) {
  const [fields, setFields] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!tableId) { setLoading(false); return; }
    try {
      setLoading(true)
      const [fieldsRes, rowsRes] = await Promise.all([
        supabase.from('fields').select('*').eq('table_id', tableId).order('order'),
        supabase.from('rows').select('*').eq('table_id', tableId).order('order')
      ])
      if (fieldsRes.error) throw fieldsRes.error
      if (rowsRes.error) throw rowsRes.error
      setFields(fieldsRes.data || [])
      setRows(rowsRes.data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableId])

  useEffect(() => { fetchData() }, [fetchData])

  return { fields, rows, loading, error, setRows, refetch: fetchData }
}
