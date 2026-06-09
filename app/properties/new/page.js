"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import Map from '../../../components/Map'
import ProtectedRoute from '../../../components/ProtectedRoute'

function NewPropertyForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ title: '', address: '', price: '', deposit: '', bedrooms: '', bathrooms: '', property_type: 'rental' })
  const [location, setLocation] = useState([34.7617, -0.0917])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      latitude: location[1],
      longitude: location[0],
      owner_id: user?.id,
      available: true,
      verification_status: 'pending_review',
      photos: []
    }
    const { data, error } = await supabase.from('properties').insert(payload).select('id').single()
    if (error) {
      setSaving(false)
      alert('Create failed: ' + error.message)
      return
    }
    const propertyId = data.id
    if (files.length) {
      const photoUrls = []
      for (const file of files) {
        const path = `${propertyId}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from('property-photos').upload(path, file)
        if (!uploadError) photoUrls.push(`/storage/v1/object/public/property-photos/${path}`)
      }
      if (photoUrls.length) {
        await supabase.from('properties').update({ photos: photoUrls }).eq('id', propertyId)
      }
    }
    setSaving(false)
    router.push(`/properties/${propertyId}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Add new property</h1>
      <div className="bg-white border rounded p-4">
        <Map center={location} pinLocation={location} draggable onPinMove={(loc)=>setLocation(loc)} />
      </div>
      <form onSubmit={submit} className="grid gap-4 bg-white border rounded p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full border px-3 py-2 rounded" />
          <select value={form.property_type} onChange={e=>setForm({...form,property_type:e.target.value})} className="border px-3 py-2 rounded">
            <option value="rental">Rental</option>
            <option value="hostel">Hostel</option>
            <option value="bnb">B&B</option>
          </select>
        </div>
        <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full border px-3 py-2 rounded" />
        <div className="grid gap-3 md:grid-cols-3">
          <input placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full border px-3 py-2 rounded" />
          <input placeholder="Deposit" value={form.deposit} onChange={e=>setForm({...form,deposit:e.target.value})} className="w-full border px-3 py-2 rounded" />
          <input placeholder="Bedrooms" value={form.bedrooms} onChange={e=>setForm({...form,bedrooms:e.target.value})} className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="Bathrooms" value={form.bathrooms} onChange={e=>setForm({...form,bathrooms:e.target.value})} className="w-full border px-3 py-2 rounded" />
          <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files))} className="w-full" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="submit" disabled={saving} className="bg-teal text-white px-4 py-2 rounded">{saving ? 'Saving…' : 'Create property'}</button>
        </div>
      </form>
    </div>
  )
}

export default function NewPropertyPage() {
  return (
    <ProtectedRoute roles={["landlord"]}>
      <NewPropertyForm />
    </ProtectedRoute>
  )
}
