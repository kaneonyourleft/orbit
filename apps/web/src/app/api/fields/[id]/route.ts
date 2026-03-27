import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { name, type, options, order } = await req.json()
    const supabase = createServerClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('fields')
      .update({ name, type, options, order })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const { id } = await params
    console.error(`API Error (PATCH /api/fields/${id}):`, err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    if (!id) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const { id } = await params
    console.error(`API Error (DELETE /api/fields/${id}):`, err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
