import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.users)
}

export async function PUT(req) {
  const { id, role } = await req.json()
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { role } })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
