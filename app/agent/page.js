"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Map from '../../components/Map'
import ProtectedRoute from '../../components/ProtectedRoute'

const propertyTypeOptions = ['1BR', '2BR', '3BR', 'Bedsitter', 'Studio', 'Maisonette', 'Townhouse', 'Bungalow', 'Hostel', 'BnB', 'Commercial']
const waterOptions = ['City', 'Borehole', 'Tank', 'None']
const electricityOptions = ['Prepaid', 'Postpaid', 'None']
const parkingOptions = ['None', 'Street', 'Dedicated', 'Garage']
const securityOptions = ['Gated', 'Guard', 'CCTV', 'Alarm']
const backupOptions = ['None', 'Generator', 'Solar', 'Inverter']
const internetOptions = ['None', 'Fiber', 'Wireless', 'Mobile']

function AgentPageInner() {
  const { user, profile, loading } = useAuth()
  const [form, setForm] = useState({
    property_type: '1BR',
    rent: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    water_supply: 'City',
    electricity: 'Prepaid',
    parking: 'None',
    security: [],
    backup_power: 'None',
    internet: 'None',
    landlord_name: '',
    landlord_phone: '',
    notes: ''
  })
  const [location, setLocation] = useState([34.7617, -0.0917])
  const [files, setFiles] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) fetchSubmissions()
  }, [user])

  async function fetchSubmissions() {
    if (!user) return
    const { data } = await supabase.from('agent_submissions').select('*').eq('agent_id', user.id).order('created_at', { ascending: false })
    setSubmissions(data || [])
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return alert('Please sign in as an agent first')
    setSaving(true)

    const payload = {
      ...form,
      agent_id: user.id,
      lat: location[1],
      lng: location[0],
      status: 'pending_review'
    }

    const { data: inserted, error } = await supabase.from('agent_submissions').insert(payload).select('id').single()
    if (error) {
      // Detect common Supabase PostgREST schema cache errors and provide actionable guidance
      const msg = error.message || String(error)
      if (msg.includes('schema cache') || /Could not find the '.+' column of '.+' in the schema cache/i.test(msg) || msg.includes('could not find')) {
        alert('Submit failed due to Supabase schema cache mismatch. Run this SQL in your Supabase SQL editor to refresh the PostgREST schema cache:\n\nNOTIFY pgrst, \'reload schema\';\n\nIf the missing column still appears, ensure the column exists (for example run: ALTER TABLE public.agent_submissions ADD COLUMN IF NOT EXISTS deposit INTEGER;), then run the NOTIFY command again. After reload, retry submission.')
      } else {
        alert('Submit failed: ' + msg)
      }
      setSaving(false)
      return
    }

    if (files.length > 0 && inserted?.id) {
      const uploaded = []
      for (const file of files) {
        const path = `${inserted.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('agent-uploads').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('agent-uploads').getPublicUrl(path)
          uploaded.push(urlData.publicUrl)
        }
      }
      if (uploaded.length) {
        await supabase.from('agent_submissions').update({ photos: uploaded }).eq('id', inserted.id)
      }
    }

    alert('Submitted for review')
    setForm({
      property_type: '1BR',
      rent: '',
      deposit: '',
      bedrooms: '',
      bathrooms: '',
      furnished: false,
      water_supply: 'City',
      electricity: 'Prepaid',
      parking: 'None',
      security: [],
      backup_power: 'None',
      internet: 'None',
      landlord_name: '',
      landlord_phone: '',
      notes: ''
    })
    setFiles([])
    fetchSubmissions()
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-60">Loading…</div>

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-white p-6">
        <h1 className="text-3xl font-semibold">Agent Submission</h1>
        <p className="mt-2 text-sm text-anchorGray">Submit a property for verification on behalf of a landlord.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1.1fr]">
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Submission form</h2>
          <div className="mb-6">
            <Map center={location} pinLocation={location} draggable onPinMove={(loc) => setLocation(loc)} />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <input type="checkbox" checked={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} />
                <span>Furnished</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input required type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} placeholder="Rent" className="w-full border rounded-lg px-4 py-3" />
              <input required type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="Deposit" className="w-full border rounded-lg px-4 py-3" />
              <input required type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="Bedrooms" className="w-full border rounded-lg px-4 py-3" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input required type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="Bathrooms" className="w-full border rounded-lg px-4 py-3" />
              <select value={form.water_supply} onChange={(e) => setForm({ ...form, water_supply: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {waterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={form.electricity} onChange={(e) => setForm({ ...form, electricity: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {electricityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {parkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={form.backup_power} onChange={(e) => setForm({ ...form, backup_power: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {backupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={form.internet} onChange={(e) => setForm({ ...form, internet: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                {internetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 text-sm font-medium">Security features</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {securityOptions.map((option) => (
                  <label key={option} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.security.includes(option)} onChange={(e) => {
                      const next = e.target.checked ? [...form.security, option] : form.security.filter((item) => item !== option)
                      setForm({ ...form, security: next })
                    }} />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.landlord_name} onChange={(e) => setForm({ ...form, landlord_name: e.target.value })} placeholder="Landlord name" className="w-full border rounded-lg px-4 py-3" />
              <input value={form.landlord_phone} onChange={(e) => setForm({ ...form, landlord_phone: e.target.value })} placeholder="Landlord phone" className="w-full border rounded-lg px-4 py-3" />
            </div>

            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full border rounded-lg px-4 py-3 min-h-[120px]" />

            <div>
              <label className="block text-sm font-medium mb-2">Photos</label>
              <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude</label>
                <input readOnly value={location[1]} className="w-full border rounded-lg px-4 py-3 bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude</label>
                <input readOnly value={location[0]} className="w-full border rounded-lg px-4 py-3 bg-slate-50" />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full rounded-full bg-teal px-5 py-3 text-sm text-white">
              {saving ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">My submissions</h2>
            <div className="mt-4 space-y-3">
              {submissions.length ? submissions.map((submission) => (
                <div key={submission.id} className="rounded-3xl bg-cloud p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{submission.property_type || 'Submission'}</div>
                      <div className="text-sm text-anchorGray">KES {submission.rent || '—'} • {submission.status}</div>
                    </div>
                    {submission.property_id && <div className="rounded-full bg-mintHint px-3 py-1 text-xs font-semibold text-teal">Property {submission.property_id}</div>}
                  </div>
                  <div className="mt-2 text-sm text-anchorGray">Landlord: {submission.landlord_name || 'Unknown'}</div>
                </div>
              )) : <div className="text-sm text-anchorGray">No submissions yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentPage() {
  return (
    <ProtectedRoute allowedRoles={["agent"]}>
      <AgentPageInner />
    </ProtectedRoute>
  )
}
