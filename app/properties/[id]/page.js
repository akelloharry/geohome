"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import PropertyCard from '../../../components/PropertyCard'
import Map from '../../../components/Map'
import { useAuth } from '../../../context/AuthContext'

export default function PropertyDetail({ params }) {
  const { id } = params
  const [property, setProperty] = useState(null)
  const { user } = useAuth()

  const [hasPass, setHasPass] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => { fetchProperty() }, [id])
  useEffect(() => { if (user) fetchSearchPass() }, [user])

  async function fetchProperty() {
    const { data } = await supabase.from('properties').select('*').eq('id', id).single()
    setProperty(data)
  }

  async function fetchSearchPass() {
    const { data } = await supabase.from('search_passes').select('*').eq('user_id', user.id).gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1)
    setHasPass((data || []).length > 0)
  }

  const buySearchPass = async () => {
    if (!user) return alert('Please login to buy a search pass')
    const res = await fetch('/api/mpesa/stkpush', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone: user.user_metadata?.phone || user.email, amount: 200, account: 'search_pass', description: 'GeoHome search pass' }) })
    const json = await res.json()
    if (json?.status) {
      const expires_at = new Date(Date.now() + 7*24*60*60*1000).toISOString()
      await supabase.from('search_passes').insert({ user_id: user.id, expires_at })
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
    await supabase.from('inquiries').insert({ property_id: property.id, owner_id: property.owner_id, user_id: user.id, message: 'Request viewing', created_at: new Date().toISOString() })
    setRequesting(false)
    alert('Viewing requested')
  }

  if (!property) return <p>Loading...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Map center={[property.longitude, property.latitude]} properties={[property]} />
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(property.photos || []).slice(0,4).map((p,i)=>(<img key={i} src={p} alt="photo" className="w-full h-40 object-cover rounded" />))}
          </div>
          <div className="bg-white border rounded p-4">
            <h2 className="text-2xl font-semibold">KES {property.price}</h2>
            <p className="text-sm text-anchorGray">{property.address}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              <div>Bedrooms: {property.bedrooms || '—'}</div>
              <div>Bathrooms: {property.bathrooms || '—'}</div>
              <div>Deposit: KES {property.deposit || '0'}</div>
              <div>Type: {property.property_type || 'N/A'}</div>
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold">Amenities</h3>
            <ul className="list-disc list-inside text-sm text-anchorGray mt-2">
              {property.amenities?.map((item, idx) => <li key={idx}>{item}</li>)}
              {!property.amenities?.length && <li>Water, electricity, parking, security</li>}
            </ul>
          </div>
          {property.property_type === 'hostel' && (
            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold">Hostel details</h3>
              <p className="text-sm text-anchorGray">Distance to campus: {property.distance_to_campus ? `${property.distance_to_campus} km` : 'TBA'}</p>
              <p className="text-sm text-anchorGray">Rules: {property.rules || 'Standard rules apply'}</p>
            </div>
          )}
        </div>
      </div>
      <aside>
        <PropertyCard property={property} />
        <div className="mt-4 flex flex-col gap-2">
          {user?.user_metadata?.role === 'landlord' && <button className="bg-teal text-white px-4 py-2 rounded">Edit Property</button>}
          {user?.user_metadata?.role === 'tenant' && <button className="bg-teal text-white px-4 py-2 rounded" onClick={buySearchPass}>Buy Search Pass (KES 200)</button>}
          <button className="border px-4 py-2 rounded" onClick={requestViewing} disabled={!hasPass || requesting}>
            {hasPass ? (requesting ? 'Requesting…' : 'Request viewing') : 'Need search pass to request'}
          </button>
        </div>
      </aside>
    </div>
  )
}
