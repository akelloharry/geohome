'use client'

import { useEffect, useState } from 'react'
import Map, { Source, Layer } from 'react-map-gl'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import NearbySearch from '../components/NearbySearch'

const defaultCenter = [34.7617, -0.0917]

const boundaryFillLayer = {
  id: 'boundary-fill',
  type: 'fill',
  paint: {
    'fill-color': '#2C6E5C',
    'fill-opacity': 0.18
  }
}

const boundaryLineLayer = {
  id: 'boundary-line',
  type: 'line',
  paint: {
    'line-color': '#2C6E5C',
    'line-width': 3
  }
}

export default function HomePage() {
  const { loading } = useAuth()
  const [boundary, setBoundary] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: defaultCenter[0],
    latitude: defaultCenter[1],
    zoom: 6
  })
  useEffect(() => {
    const fetchBoundary = async () => {
      const { data, error } = await supabase
        .from('boundaries')
        .select('name,geometry')
        .limit(1)

      if (error) {
        console.error('Failed to load boundary:', error)
        return
      }

      if (data?.length) {
        setBoundary({
          type: 'Feature',
          geometry: data[0].geometry,
          properties: { name: data[0].name }
        })
      }
    }

    fetchBoundary()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900">
      <Map
        initialViewState={viewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        onMove={(evt) => setViewState(evt.viewState)}
      >
        {boundary && (
          <Source id="boundary" type="geojson" data={boundary}>
            <Layer {...boundaryFillLayer} />
            <Layer {...boundaryLineLayer} />
          </Source>
        )}
      </Map>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_25%),linear-gradient(135deg,_rgba(14,116,144,0.45),_rgba(34,197,94,0.15),_rgba(14,116,144,0.8))]" />

      <div className="absolute inset-x-0 top-16 mx-auto w-full max-w-6xl px-4 text-center text-white">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm">
          GeoHome Kenya
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">
          The map mode of search for verified rentals in Kenya.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
          Discover boundary data from Supabase and search with precision — no tenant/landlord landing page clutter, just the map and a clean search flow.
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-auto mb-10 w-full max-w-6xl px-4">
        <NearbySearch />
      </div>
    </div>
  )
}
