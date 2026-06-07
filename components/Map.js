"use client"

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function Map({ center = [34.7617, -0.0917], properties = [], radius = 0, onPinMove, draggable = false, pinLocation }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const pinRef = useRef(null)

  // Defensive: if token missing, show placeholder
  if (!mapboxgl.accessToken) {
    return <div className="w-full h-96 rounded bg-mintHint flex items-center justify-center text-sm">Map unavailable (missing token)</div>
  }

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 13
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl())
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setCenter(center)

    // clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    properties.forEach(p => {
      // normalize coordinates from multiple possible shapes
      const lat = p.latitude ?? p.lat ?? (p.location && p.location.coordinates ? p.location.coordinates[1] : null)
      const lng = p.longitude ?? p.lng ?? (p.location && p.location.coordinates ? p.location.coordinates[0] : null)
      if (lat == null || lng == null) return
      const el = document.createElement('div')
      el.className = 'marker'
      el.style.width = '22px'
      el.style.height = '22px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      // color by status
      const available = p.available ?? p.is_active ?? true
      const color = p.sponsored ? 'var(--muted-teal, #5F8A7B)' : (available === false ? '#B26A5C' : 'var(--teal, #2C6E5C)')
      el.style.background = color

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)
      if (onMarkerClick) el.addEventListener('click', () => onMarkerClick(p))
      markersRef.current.push(marker)
    })

    // pin for draggable location picker
    if (pinLocation) {
      if (pinRef.current) {
        pinRef.current.setLngLat([pinLocation[0], pinLocation[1]])
      } else {
        const el = document.createElement('div')
        el.className = 'pin'
        el.style.width = '28px'
        el.style.height = '28px'
        el.style.background = 'var(--primary, #1E3A4D)'
        el.style.borderRadius = '50%'
        el.style.border = '3px solid white'
        pinRef.current = new mapboxgl.Marker({ element: el, draggable }).setLngLat([pinLocation[0], pinLocation[1]]).addTo(map)
        if (draggable) pinRef.current.on('dragend', () => {
          const lngLat = pinRef.current.getLngLat()
          onPinMove && onPinMove([lngLat.lng, lngLat.lat])
        })
      }
    }

  }, [center, properties, pinLocation, draggable, onPinMove])

  return <div ref={mapContainer} className="w-full h-96 rounded" />
}
