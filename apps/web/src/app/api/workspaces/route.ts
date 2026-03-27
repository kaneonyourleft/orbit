import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { name, slug } = await req.json()
    const supabase = createServerClient()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, slug })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('API Error (POST /api/workspaces):', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
