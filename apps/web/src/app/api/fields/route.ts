import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { table_id, name, type, options, order } = await req.json()
    const supabase = createServerClient()

    if (!table_id || !name || !type) {
      return NextResponse.json({ error: 'Table ID, name and type are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('fields')
      .insert({ table_id, name, type, options, order })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('API Error (POST /api/fields):', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
