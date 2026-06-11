"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import PropertyCard from '../../../components/PropertyCard'
import Map from '../../../components/Map'
import { useAuth } from '../../../context/AuthContext'

export default function PropertyDetail({ params }) {
  const { id } = params
  const [property, setProperty] = useState(null)
  const [landlord, setLandlord] = useState(null)
  const { user, profile } = useAuth()
  const [hasPass, setHasPass] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)

  useEffect(() => { fetchProperty() }, [id])
  useEffect(() => { if (user) fetchSearchPass() }, [user])

  async function fetchProperty() {
    const { data } = await supabase.from('properties').select('*').eq('id', id).single()
    setProperty(data)
    if (data?.landlord_id) {
      const { data: owner } = await supabase.from('profiles').select('*').eq('id', data.landlord_id).single()
      setLandlord(owner)
    }
  }

  async function fetchSearchPass() {
    if (!user) return
    setLoadingPass(true)
    const { data } = await supabase.from('search_passes').select('*').eq('user_id', user.id).gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1)
    setHasPass((data || []).length > 0)
    setLoadingPass(false)
  }

  const buySearchPass = async () => {
    if (!user) return alert('Please login to buy a search pass')
    const res = await fetch('/api/mpesa/stkpush', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: user.user_metadata?.phone || user.email, amount: 200, account: 'search_pass', description: 'GeoHome search pass' }) })
    const json = await res.json()
    if (json?.status) {
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('search_passes').insert({ user_id: user.id, expires_at, paid_amount: 200 })
      alert('Search pass purchased — valid 7 days')
      setHasPass(true)
    } else {
      alert('Payment failed')
    }
  }

  const requestViewing = async () => {
    if (!user) return alert('Please login to request viewing')
    if (!hasPass) return alert('You need an active search pass to request viewing.')
    setRequesting(true)
    const res = await fetch('/api/viewing-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: property.id, tenant_id: user.id })
    })
    const json = await res.json()
    setRequesting(false)
    if (json?.error) {
      alert('Request failed: ' + json.error)
    } else {
      alert('Viewing requested successfully')
    }
  }

  if (!property) return <p>Loading...</p>

  const role = profile?.role || user?.user_metadata?.role || 'tenant'
  const activePass = hasPass && !loadingPass

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.9fr]">
      <div className="space-y-4">
        <div className="rounded-3xl overflow-hidden border bg-white">
          {
            (() => {
              const lng = property.lng ?? property.longitude ?? (property.location && property.location.coordinates ? property.location.coordinates[0] : 34.7617)
              const lat = property.lat ?? property.latitude ?? (property.location && property.location.coordinates ? property.location.coordinates[1] : -0.0917)
              return <Map center={[lng, lat]} properties={[property]} />
            })()
          }
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(property.photos || []).slice(0, 4).map((photo, index) => (
            <img key={index} src={photo} alt={`Photo ${index + 1}`} className="h-48 w-full rounded-3xl object-cover" />
          ))}
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{property.title || 'Property details'}</h1>
               <p className="text-sm text-anchorGray mt-2">{property.address || 'No address available'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">KES {property.price || '—'}</div>
              <div className="text-sm text-anchorGray">Deposit: KES {property.deposit || '0'}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm text-anchorGray">
            <div>Type: {property.property_type || '—'}</div>
            <div>Bedrooms: {property.bedrooms ?? '—'}</div>
            <div>Bathrooms: {property.bathrooms ?? '—'}</div>
            <div>Status: {property.verification_status || 'pending'} / {property.available === false ? 'Inactive' : 'Active'}</div>
            <div>Furnished: {property.furnished ? 'Yes' : 'No'}</div>
            <div>Water: {property.water_supply || 'N/A'}</div>
            <div>Electricity: {property.electricity || 'N/A'}</div>
            <div>Parking: {property.parking || 'N/A'}</div>
            <div>Backup power: {property.backup_power || 'N/A'}</div>
            <div>Internet: {property.internet || 'N/A'}</div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Landlord information</h2>
          {landlord ? (
            <div className="mt-4 space-y-2 text-sm text-anchorGray">
              <div>Name: {landlord.full_name || 'Unknown'}</div>
              <div>Phone: {landlord.phone || 'Not available'}</div>
              <div>Role: {landlord.role || 'landlord'}</div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-anchorGray">Landlord details Not available.</div>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border bg-white p-6">
          <PropertyCard property={property} />
        </div>

        {role === 'tenant' && (
          <div className="rounded-3xl border bg-white p-6 space-y-3">
            <h2 className="text-xl font-semibold">Tenant actions</h2>
            {!activePass ? (
              <button className="w-full rounded-full bg-teal px-4 py-3 text-white" onClick={buySearchPass}>Buy Search Pass (KES 200)</button>
            ) : (
              <div className="rounded-3xl bg-mintHint p-4 text-sm text-teal">You have an active search pass.</div>
            )}
            <button className="w-full rounded-full border border-teal px-4 py-3 text-teal" onClick={requestViewing} disabled={!activePass || requesting}>
              {requesting ? 'Requesting…' : 'Request viewing'}
            </button>
            {!activePass && <p className="text-sm text-anchorGray">A valid pass is required before requesting a viewing.</p>}
          </div>
        )}
      </aside>
    </div>
  )
}
