"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import Map from '../../../components/Map'
import ProtectedRoute from '../../../components/ProtectedRoute'

const propertyTypeOptions = ['1BR', '2BR', '3BR', 'Bedsitter', 'Studio', 'Maisonette', 'Townhouse', 'Bungalow', 'Hostel', 'BnB', 'Commercial']
const waterOptions = ['City', 'Borehole', 'Tank', 'None']
const electricityOptions = ['Prepaid', 'Postpaid', 'None']
const parkingOptions = ['None', 'Street', 'Dedicated', 'Garage']
const securityOptions = ['Gated', 'Guard', 'CCTV', 'Alarm']
const backupOptions = ['None', 'Generator', 'Solar', 'Inverter']
const internetOptions = ['None', 'Fiber', 'Wireless', 'Mobile']

function NewPropertyForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    address: '',
    property_type: '1BR',
    price: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    water_supply: 'City',
    electricity: 'Prepaid',
    parking: 'None',
    security: [],
    backup_power: 'None',
    internet: 'None'
  })
  const [location, setLocation] = useState([34.7617, -0.0917])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return alert('Please login first')
    setSaving(true)
    const payload = {
      title: form.title,
      address: form.address,
      property_type: form.property_type,
      price: Number(form.price) || null,
      deposit: Number(form.deposit) || null,
      bedrooms: Number(form.bedrooms) || null,
      bathrooms: Number(form.bathrooms) || null,
      furnished: form.furnished,
      water_supply: form.water_supply,
      electricity: form.electricity,
      parking: form.parking,
      security: form.security,
      backup_power: form.backup_power,
      internet: form.internet,
      location: `POINT(${location[0]} ${location[1]})`,
      owner_id: user.id,
      verification_status: 'pending',
      available: true,
      is_active: true,
      photos: []
    }

    const { data, error } = await supabase.from('properties').insert(payload).select('id').single()
    if (error || !data) {
      alert('Create failed: ' + (error?.message || 'unknown error'))
      setSaving(false)
      return
    }

    const propertyId = data.id
    if (files.length) {
      const photoUrls = []
      for (const file of files) {
        const path = `${propertyId}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('property-photos').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path)
          photoUrls.push(urlData.publicUrl)
        }
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
      <div className="bg-white border rounded-xl p-4">
        <Map center={location} pinLocation={location} draggable onPinMove={(loc) => setLocation(loc)} />
      </div>
      <form onSubmit={submit} className="grid gap-4 bg-white border rounded-xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full border rounded-lg px-4 py-3" />
          <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full border rounded-lg px-4 py-3 min-h-[100px]" />
        <div className="grid gap-4 md:grid-cols-3">
          <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Rent amount" className="w-full border rounded-lg px-4 py-3" />
          <input required type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="Deposit amount" className="w-full border rounded-lg px-4 py-3" />
          <input required type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="Bedrooms" className="w-full border rounded-lg px-4 py-3" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input required type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="Bathrooms" className="w-full border rounded-lg px-4 py-3" />
          <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <input type="checkbox" checked={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} /> Furnished
          </label>
          <select value={form.water_supply} onChange={(e) => setForm({ ...form, water_supply: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {waterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <select value={form.electricity} onChange={(e) => setForm({ ...form, electricity: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {electricityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {parkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={form.backup_power} onChange={(e) => setForm({ ...form, backup_power: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {backupOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.internet} onChange={(e) => setForm({ ...form, internet: e.target.value })} className="w-full border rounded-lg px-4 py-3">
            {internetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Security features</div>
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
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Photos</label>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input type="text" readOnly value={location[1]} className="w-full border rounded-lg px-4 py-3 bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input type="text" readOnly value={location[0]} className="w-full border rounded-lg px-4 py-3 bg-slate-50" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="submit" disabled={saving} className="rounded-full bg-teal px-5 py-3 text-sm text-white">{saving ? 'Saving…' : 'Create property'}</button>
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
