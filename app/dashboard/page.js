"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import { supabase } from '../../lib/supabaseClient'
import Map from '../../components/Map'

const propertyTypeOptions = ['1BR', '2BR', '3BR', 'Bedsitter', 'Studio', 'Maisonette', 'Townhouse', 'Bungalow', 'Hostel', 'BnB', 'Commercial']
const waterOptions = ['City', 'Borehole', 'Tank', 'None']
const electricityOptions = ['Prepaid', 'Postpaid', 'None']
const parkingOptions = ['None', 'Street', 'Dedicated', 'Garage']
const securityOptions = ['Gated', 'Guard', 'CCTV', 'Alarm']
const backupOptions = ['None', 'Generator', 'Solar', 'Inverter']
const internetOptions = ['None', 'Fiber', 'Wireless', 'Mobile']

const blankForm = {
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
}

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={['landlord']}>
      <Dashboard />
    </ProtectedRoute>
  )
}

function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [transactions, setTransactions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [location, setLocation] = useState([34.7617, -0.0917])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) return
    const role = profile?.role || user.user_metadata?.role || 'tenant'
    if (role === 'tenant') return router.push('/')
    if (role === 'agent') return router.push('/agent')
    if (role === 'admin') return router.push('/admin')
    fetchProperties()
    fetchInquiries()
    fetchTransactions()
  }, [user, profile, loading])

  async function fetchProperties() {
    if (!user) return
    const { data } = await supabase.from('properties').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
    setProperties(data || [])
  }

  async function fetchInquiries() {
    if (!user) return
    try {
      const { data } = await supabase.from('inquiries').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
      setInquiries(data || [])
    } catch {
      setInquiries([])
    }
  }

  async function fetchTransactions() {
    if (!user) return
    try {
      const { data } = await supabase.from('transactions').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
      setTransactions(data || [])
    } catch {
      setTransactions([])
    }
  }

  const openForm = (property = null) => {
    if (property) {
      setEditing(property)
      setForm({
        title: property.title || '',
        address: property.address || property.address_text || '',
        property_type: property.property_type || '1BR',
        price: property.price || '',
        deposit: property.deposit || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        furnished: property.furnished || false,
        water_supply: property.water_supply || 'City',
        electricity: property.electricity || 'Prepaid',
        parking: property.parking || 'None',
        security: property.security || [],
        backup_power: property.backup_power || 'None',
        internet: property.internet || 'None'
      })
      // derive location from canonical fields
      const lng = property.lng ?? property.longitude ?? (property.location && property.location.coordinates ? property.location.coordinates[0] : 34.7617)
      const lat = property.lat ?? property.latitude ?? (property.location && property.location.coordinates ? property.location.coordinates[1] : -0.0917)
      setLocation([lng, lat])
    } else {
      setEditing(null)
      setForm(blankForm)
      setLocation([34.7617, -0.0917])
    }
    setFiles([])
    setModalOpen(true)
  }

  const saveProperty = async (e) => {
    e.preventDefault()
    if (!user) return
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
      landlord_id: user.id,
      verification_status: 'pending',
      available: true
    }

    let propertyId
    if (editing) {
      const { error } = await supabase.from('properties').update(payload).eq('id', editing.id)
      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
      propertyId = editing.id
    } else {
      const { data, error } = await supabase.from('properties').insert(payload).select('id').single()
      if (error || !data) {
        alert(error?.message || 'Could not save property')
        setSaving(false)
        return
      }
      propertyId = data.id
    }

    if (files.length > 0) {
      const uploaded = []
      for (const file of files) {
        const path = `${propertyId}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('property-photos').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path)
          uploaded.push(urlData.publicUrl)
        }
      }
      if (uploaded.length) {
        const existingPhotos = (editing?.photos || [])
        await supabase.from('properties').update({ photos: [...existingPhotos, ...uploaded] }).eq('id', propertyId)
      }
    }

    setSaving(false)
    setModalOpen(false)
    fetchProperties()
  }

  const toggleActive = async (property) => {
    await supabase.from('properties').update({ available: !property.available }).eq('id', property.id)
    fetchProperties()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Landlord Dashboard</h1>
          <p className="text-sm text-anchorGray mt-1">Manage your listings, inquiries, and escrow transactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-teal px-4 py-2 text-white" onClick={() => openForm(null)}>Add Property</button>
          <button className="rounded-full border border-teal px-4 py-2 text-teal" onClick={() => router.push('/properties/new')}>Add via full form</button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold text-lg">My Properties</h2>
            <div className="mt-4 space-y-4">
              {properties.length ? properties.map((property) => (
                <div key={property.id} className="rounded-3xl border p-4 bg-cloud">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <div className="font-semibold text-xl">{property.title || 'Untitled property'}</div>
                      <div className="text-sm text-anchorGray">{property.address || property.address_text}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-1 ${property.verification_status === 'verified' ? 'bg-mintHint text-teal' : property.verification_status === 'rejected' ? 'bg-estateRed/10 text-estateRed' : 'bg-slate-100 text-slate-700'}`}>{property.verification_status || 'pending'}</span>
                      <span className={`rounded-full px-2 py-1 ${property.available === false ? 'bg-estateRed/10 text-estateRed' : 'bg-mintHint text-teal'}`}>{property.available === false ? 'Inactive' : 'Active'}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-anchorGray">
                    <div>Rent: KES {property.price || '—'}</div>
                    <div>Deposit: KES {property.deposit || '—'}</div>
                    <div>{property.bedrooms || '—'} bd • {property.bathrooms || '—'} ba</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-full border border-teal px-3 py-1 text-sm text-teal" onClick={() => openForm(property)}>Edit</button>
                    <button className="rounded-full border border-estateRed px-3 py-1 text-sm text-estateRed" onClick={() => toggleActive(property)}>{property.available === false ? 'Reactivate' : 'Deactivate'}</button>
                    <button className="rounded-full bg-white border px-3 py-1 text-sm text-anchorGray" onClick={() => router.push(`/properties/${property.id}`)}>View</button>
                  </div>
                </div>
              )) : <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-anchorGray">No properties yet. Add a property to start managing your listings.</div>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold">Inquiries</h2>
              <div className="mt-4 space-y-3">
                {inquiries.length ? inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-3xl bg-cloud p-3">
                    <div className="text-sm font-medium">Property ID: {inquiry.property_id}</div>
                    <p className="text-sm text-anchorGray mt-1">{inquiry.message}</p>
                    <div className="text-xs text-slate-500 mt-2">{new Date(inquiry.created_at).toLocaleString()}</div>
                  </div>
                )) : <div className="text-sm text-anchorGray">No inquiries yet.</div>}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold">Transactions</h2>
              <div className="mt-4 space-y-3">
                {transactions.length ? transactions.map((tx) => (
                  <div key={tx.id} className="rounded-3xl bg-cloud p-3">
                    <div className="text-sm font-medium">KES {tx.amount}</div>
                    <div className="text-sm text-anchorGray">{tx.status} — release on {tx.release_date ? new Date(tx.release_date).toLocaleDateString() : 'TBA'}</div>
                  </div>
                )) : <div className="text-sm text-anchorGray">No transactions yet.</div>}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold">Quick tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-anchorGray list-disc list-inside">
              <li>New properties are submitted as pending until admin verification.</li>
              <li>Edit any field except property ownership after creation.</li>
              <li>Deactivate a property to remove it from tenant search.</li>
            </ul>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold">Live location</h2>
            <Map center={location} pinLocation={location} draggable onPinMove={(loc) => setLocation(loc)} />
          </div>
        </aside>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/30 px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{editing ? 'Edit property' : 'Add property'}</h2>
                <p className="text-sm text-anchorGray">Use the map pin and fields below to define the listing.</p>
              </div>
              <button className="text-sm text-anchorGray hover:text-teal" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <form onSubmit={saveProperty} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Property title" className="w-full border px-4 py-3 rounded-lg" />
                <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="w-full border rounded-lg px-4 py-3">
                  {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" className="w-full border px-4 py-3 rounded-lg min-h-[94px]" />
              <div className="grid gap-4 md:grid-cols-3">
                <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Rent amount" className="w-full border px-4 py-3 rounded-lg" />
                <input required type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="Deposit amount" className="w-full border px-4 py-3 rounded-lg" />
                <input required type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="Bedrooms" className="w-full border px-4 py-3 rounded-lg" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <input required type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="Bathrooms" className="w-full border px-4 py-3 rounded-lg" />
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
                  <div className="mb-2 text-sm font-medium">Security</div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Select location</div>
                  <Map center={location} pinLocation={location} draggable onPinMove={(loc) => setLocation(loc)} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Latitude</label>
                    <input readOnly value={location[1]} className="w-full border px-4 py-3 rounded-lg bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Longitude</label>
                    <input readOnly value={location[0]} className="w-full border px-4 py-3 rounded-lg bg-slate-50" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Photos</label>
                <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="w-full" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="rounded-full border px-4 py-2 text-sm text-anchorGray" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="rounded-full bg-teal px-5 py-2 text-sm text-white">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
