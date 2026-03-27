import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { workspace_id, name, description, icon } = await req.json()
    const supabase = createServerClient()

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'Workspace ID and name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tables')
      .insert({ workspace_id, name, description, icon })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('API Error (POST /api/tables):', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
