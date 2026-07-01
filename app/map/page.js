'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Map from '../../components/Map'
import { supabase } from '../../lib/supabaseClient'

const kisumuCenter = [34.7617, -0.0917]
const localFallbackProperties = [
  {
    id: 'fallback-1',
    title: 'Riverside Apartments',
    address: 'Along Kisumu River',
    price: 15000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Rental',
    lat: -0.0905,
    lng: 34.7610,
    available: true,
    verification_status: 'verified'
  },
  {
    id: 'fallback-2',
    title: 'Campus View Hostel',
    address: 'Near University',
    price: 8000,
    bedrooms: 6,
    bathrooms: 2,
    property_type: 'Hostel',
    lat: -0.0950,
    lng: 34.7625,
    available: true,
    verification_status: 'verified'
  },
  {
    id: 'fallback-3',
    title: 'Cozy BnB',
    address: 'Central Kisumu',
    price: 5000,
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'BnB',
    lat: -0.0919,
    lng: 34.7630,
    available: true,
    verification_status: 'verified'
  }
]

export default function FullMapPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      let loaded = []
      const { data, error } = await supabase.rpc('properties_in_boundary', { boundary_name: 'kisumu' })

      if (!error && Array.isArray(data) && data.length > 0) {
        loaded = data
      }

      if (loaded.length === 0) {
        const { data: nearbyData, error: nearbyError } = await supabase.rpc('nearby_properties', {
          lat_param: kisumuCenter[1],
          lng_param: kisumuCenter[0],
          radius: 5000
        })

        if (!nearbyError && Array.isArray(nearbyData) && nearbyData.length > 0) {
          loaded = nearbyData
        }
      }

      if (loaded.length === 0) {
        loaded = localFallbackProperties
      }

      setProperties(loaded)
      setLoading(false)
    }

    fetchProperties()
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-midnight-soil text-white">
      <div className="absolute inset-0">
        <Map center={kisumuCenter} properties={properties} className="h-full w-full" />
      </div>

      <div className="absolute inset-0 bg-midnight-soil/75" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-sunset-orange/80">GeoHome Kenya</div>
            <h1 className="mt-2 text-4xl font-heading font-black text-cloud-fluff sm:text-5xl">Kisumu rentals on a full-screen map</h1>
            <p className="mt-3 max-w-2xl text-sm text-cloud-fluff/75 sm:text-base">
              Explore every verified and available property pin in Kisumu with a tenant-first map and listing experience.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center rounded-full bg-cloud-fluff px-5 py-3 text-sm font-semibold text-midnight-soil shadow-lg shadow-black/20 transition hover:bg-cloud-fluff/90">
              Back to home
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-cloud-fluff/10 bg-cloud-fluff/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cloud-fluff/75">Active Kisumu listings</p>
                <p className="mt-4 text-3xl font-heading font-black text-cloud-fluff">{loading ? 'Loading listings…' : `${properties.length} active rentals`}</p>
              </div>
              <span className="rounded-full bg-trust-teal/10 px-4 py-2 text-sm font-semibold text-trust-teal">Tenant only</span>
            </div>

            <div className="mt-8 grid gap-4">
              {loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-cloud-fluff/80">Loading properties from Kisumu...</div>
              ) : (
                properties.map((property) => (
                  <div key={property.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-cloud-fluff">{property.title || 'Kisumu rental'}</h2>
                        <p className="mt-1 text-sm text-cloud-fluff/70">{property.address || 'Kisumu, Kenya'}</p>
                      </div>
                      <span className="rounded-full bg-lake-blue/10 px-3 py-1 text-xs font-semibold uppercase text-lake-blue">{property.property_type || 'Rental'}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-cloud-fluff/80">
                      <span>{property.bedrooms ?? '—'} bd</span>
                      <span>{property.bathrooms ?? '—'} ba</span>
                      <span>{property.price != null ? `KES ${property.price}` : 'Price N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[32px] border border-cloud-fluff/10 bg-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="text-sm uppercase tracking-[0.24em] text-cloud-fluff/75">Map controls</div>
            <p className="mt-4 text-sm leading-7 text-cloud-fluff/80">
              Use the map to locate properties, zoom into Kisumu neighborhoods, and review verified rental pins. Property popups link directly to details.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-cloud-fluff/10 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-cloud-fluff/75">Fast view</div>
                <p className="mt-2 text-sm text-cloud-fluff/80">Tap any marker to open the property detail page and see rental info instantly.</p>
              </div>
              <div className="rounded-3xl bg-cloud-fluff/10 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-cloud-fluff/75">Verified homes</div>
                <p className="mt-2 text-sm text-cloud-fluff/80">Only listings marked verified and available are shown on the map.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
