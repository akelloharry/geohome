"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Map from '../components/Map'
import Filters from '../components/Filters'
import PropertyCard from '../components/PropertyCard'

export default function HomePage() {
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  const [pin, setPin] = useState([34.7617, -0.0917])
  const [radius, setRadius] = useState(1000)

  useEffect(() => {
    fetchNearby()
  }, [pin, radius])

  async function fetchNearby() {
    // call Supabase RPC nearby_properties(lat, lng, radius)
    const lat = pin[1]
    const lng = pin[0]
    const { data, error } = await supabase.rpc('nearby_properties', { lat, lng, radius })
    if (!error && data) setProperties(data)
  }

  const filtered = (properties || []).filter(p => {
    const min = parseInt(filters.priceMin || 0)
    const max = parseInt(filters.priceMax || 1e12)
    const bedrooms = parseInt(filters.bedrooms || 0)
    const type = filters.propertyType || ''
    const priceMatches = (!filters.priceMin || p.price >= min) && (!filters.priceMax || p.price <= max)
    const bedroomsMatch = !filters.bedrooms || p.bedrooms === bedrooms
    const typeMatch = !type || p.property_type === type
    return priceMatches && bedroomsMatch && typeMatch
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Map center={pin} pinLocation={pin} draggable={true} onPinMove={(loc)=>setPin(loc)} properties={filtered} radius={radius} onMarkerClick={(property)=>window.location.assign(`/properties/${property.id}`)} />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="text-sm">Radius: {radius}m</div>
          <input type="range" min="100" max="5000" step="100" value={radius} onChange={e=>setRadius(parseInt(e.target.value))} className="w-full sm:w-auto" />
        </div>
      </div>
      <aside>
        <Filters onChange={(f) => setFilters(f)} />
        <div className="mt-4 space-y-3">
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </aside>
    </div>
  )
}
