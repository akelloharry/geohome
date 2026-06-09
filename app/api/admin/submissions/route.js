import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseSchema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA || 'geohome'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: {
    schema: supabaseSchema
  }
})

export async function GET() {
  const { data, error } = await supabaseAdmin.from('agent_submissions').select('*').eq('status', 'pending_review')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req) {
  const { id, status } = await req.json()
  if (status === 'approved') {
    const { data: submission, error: fetchError } = await supabaseAdmin.from('agent_submissions').select('*').eq('id', id).single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const propertyPayload = {
      title: submission.property_type ? `${submission.property_type} listing` : 'Submitted property',
      address_text: submission.notes || null,
      address: submission.notes || null,
      property_type: submission.property_type,
      price: submission.rent,
      deposit: submission.deposit,
      bedrooms: submission.bedrooms,
      bathrooms: submission.bathrooms,
      furnished: submission.furnished,
      water_supply: submission.water_supply,
      electricity: submission.electricity,
      parking: submission.parking,
      security: submission.security,
      backup_power: submission.backup_power,
      internet: submission.internet,
      latitude: submission.latitude,
      longitude: submission.longitude,
      photos: submission.photos,
      verification_status: 'verified',
      available: true,
      is_active: true
    }

    const { data: propertyData, error: propertyError } = await supabaseAdmin.from('properties').insert(propertyPayload).select('id').single()
    if (propertyError) return NextResponse.json({ error: propertyError.message }, { status: 500 })

    const { data, error } = await supabaseAdmin.from('agent_submissions').update({ status: 'approved', property_id: propertyData.id }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabaseAdmin.from('agent_submissions').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
