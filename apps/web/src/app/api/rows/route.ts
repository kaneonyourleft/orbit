import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { table_id, data, order } = await req.json()
    const supabase = createServerClient()

    if (!table_id) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
    }

    const { data: rowData, error } = await supabase
      .from('rows')
      .insert({ table_id, data: data || {}, order: order || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(rowData)
  } catch (err: unknown) {
    console.error('API Error (POST /api/rows):', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
