"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Map from '../../components/Map'
import ProtectedRoute from '../../components/ProtectedRoute'

function AgentPageInner() {
  const [form, setForm] = useState({ property_type: 'rental', rent: '', deposit: '', bedrooms: '', bathrooms: '', furnished: false, water: false, electricity: false, parking: false, security: [], backup_power: false, internet: false })
  const [location, setLocation] = useState([34.7617, -0.0917])
  const [files, setFiles] = useState([])

  const submit = async (e) => {
    e.preventDefault()
    // insert into agent_submissions
    const payload = { ...form, longitude: location[0], latitude: location[1], status: 'pending_review' }
    const { data, error } = await supabase.from('agent_submissions').insert(payload)
    if (error) return alert('Submit failed: ' + error.message)

    // upload files
    if (files.length > 0) {
      for (const file of files) {
        const path = `${Date.now()}_${file.name}`
        await supabase.storage.from('agent-uploads').upload(path, file)
      }
    }

    alert('Submitted for review')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Agent Property Submission</h2>
      <div className="mb-3">
        <Map center={location} pinLocation={location} draggable={true} onPinMove={(loc)=>setLocation(loc)} />
      </div>
      <form onSubmit={submit} className="space-y-3">
        <select value={form.property_type} onChange={e=>setForm({...form, property_type:e.target.value})} className="w-full border px-2 py-1">
          <option value="rental">Rental</option>
          <option value="hostel">Hostel</option>
          <option value="bnb">B&B</option>
        </select>
        <input placeholder="Rent" className="w-full border px-2 py-1" value={form.rent} onChange={e=>setForm({...form, rent:e.target.value})} />
        <input placeholder="Deposit" className="w-full border px-2 py-1" value={form.deposit} onChange={e=>setForm({...form, deposit:e.target.value})} />
        <input placeholder="Bedrooms" className="w-full border px-2 py-1" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms:e.target.value})} />
        <div>
          <label className="block">Photos</label>
          <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files))} />
        </div>
        <button className="bg-teal text-white px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  )
}

export default function AgentPage() {
  return (
    <ProtectedRoute roles={["agent","admin"]}>
      <AgentPageInner />
    </ProtectedRoute>
  )
}
