"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import useMapStore from '../lib/useMapStore'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function Map({ center = [34.7617, -0.0917], properties = [], radius = 0, onMarkerClick, onMapClick, onPinMove, draggable = false, pinLocation, bbox = null }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const pinRef = useRef(null)
  const bboxRef = useRef(null)
  const [geoPending, setGeoPending] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const setStoreLocation = useMapStore(state => state.setUserLocation)

  // Defensive: if token missing, show placeholder
  if (!mapboxgl.accessToken) {
    return <div className="w-full h-96 rounded bg-mintHint flex items-center justify-center text-sm">Map unavailable (missing token)</div>
  }

  useEffect(() => {
    if (mapRef.current) return
    // initial center: use provided center prop; we'll fly to user location when available
    const initialCenter = center || [36.82, -1.29]
    const initialZoom = 6

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl())

    // Add Mapbox Geolocate control (top-right)
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    })
    mapRef.current.addControl(geolocate, 'top-right')
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // If user location exists, prefer it
    const targetCenter = userLocation || center
    map.setCenter(targetCenter)

    // clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    properties.forEach(p => {
      const lat = p.lat ?? p.latitude ?? (p.location && p.location.coordinates ? p.location.coordinates[1] : null)
      const lng = p.lng ?? p.longitude ?? (p.location && p.location.coordinates ? p.location.coordinates[0] : null)
      if (lat == null || lng == null) return

      const el = document.createElement('div')
      el.className = 'marker'
      el.style.width = '22px'
      el.style.height = '22px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      const available = p.available ?? true
      const color = p.sponsored ? 'var(--muted-teal, #5F8A7B)' : (available === false ? '#B26A5C' : 'var(--teal, #2C6E5C)')
      el.style.background = color

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)

      const title = p.title || 'Property'
      const address = p.address || ''
      const price = p.price != null ? `KES ${p.price}` : ''
      const bedrooms = p.bedrooms != null ? `${p.bedrooms} bd` : ''
      const details = [address, price, bedrooms].filter(Boolean).join(' • ')
      const propertyLink = p.id ? `/properties/${p.id}` : '#'
      const popupHtml = `<div style="font-size:13px;line-height:1.4;max-width:240px;color:#1E293B;"><strong style="display:block;margin-bottom:4px;">${title}</strong>${details ? `<div style="margin-bottom:8px;">${details}</div>` : ''}<a href="${propertyLink}" style="color:#0f766e;text-decoration:none;font-weight:600;">View details</a></div>`
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml)
      marker.setPopup(popup)

      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(p))
      }

      markersRef.current.push(marker)
    })

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

    if (bbox) {
      const polygon = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [bbox.minLng, bbox.minLat],
                [bbox.maxLng, bbox.minLat],
                [bbox.maxLng, bbox.maxLat],
                [bbox.minLng, bbox.maxLat],
                [bbox.minLng, bbox.minLat]
              ]]
            }
          }
        ]
      }
      if (map.getSource('bbox-source')) {
        map.getSource('bbox-source').setData(polygon)
      } else {
        map.addSource('bbox-source', { type: 'geojson', data: polygon })
        map.addLayer({
          id: 'bbox-fill',
          type: 'fill',
          source: 'bbox-source',
          paint: {
            'fill-color': '#2c6e5c',
            'fill-opacity': 0.15
          }
        })
        map.addLayer({
          id: 'bbox-line',
          type: 'line',
          source: 'bbox-source',
          paint: {
            'line-color': '#2c6e5c',
            'line-width': 2
          }
        })
      }
    } else if (map.getSource('bbox-source')) {
      if (map.getLayer('bbox-fill')) map.removeLayer('bbox-fill')
      if (map.getLayer('bbox-line')) map.removeLayer('bbox-line')
      map.removeSource('bbox-source')
    }

    if (onMapClick) {
      const handleMapClick = (event) => {
        onMapClick([event.lngLat.lng, event.lngLat.lat])
      }
      map.on('click', handleMapClick)
      return () => {
        map.off('click', handleMapClick)
      }
    }

  }, [center, properties, pinLocation, draggable, onPinMove, onMarkerClick, onMapClick, bbox, userLocation])

  // Request browser geolocation on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoPending(false)
      return
    }

    setGeoPending(true)

    const success = (position) => {
      const coords = [position.coords.longitude, position.coords.latitude]
      setUserLocation(coords)
      try { setStoreLocation(coords) } catch (e) {}
      setGeoPending(false)
      // if map already initialized, fly to user
      if (mapRef.current) {
        mapRef.current.flyTo({ center: coords, zoom: 12, essential: true })
      }
    }

    const error = (err) => {
      console.warn('Geolocation error:', err && err.message)
      setGeoPending(false)
    }

    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 })
  }, [])

  // Locate-me button handler
  function handleLocateMe() {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: userLocation, zoom: 12, essential: true })
      return
    }

    if (!('geolocation' in navigator)) return
    setGeoPending(true)
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = [position.coords.longitude, position.coords.latitude]
      setUserLocation(coords)
      try { setStoreLocation(coords) } catch (e) {}
      setGeoPending(false)
      if (mapRef.current) mapRef.current.flyTo({ center: coords, zoom: 12, essential: true })
    }, (err) => {
      console.warn('Geolocation error:', err && err.message)
      setGeoPending(false)
    }, { enableHighAccuracy: true, timeout: 3000 })
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-96 rounded" />
      <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 1000 }}>
        <button onClick={handleLocateMe} className="bg-white px-3 py-2 rounded shadow">Locate me</button>
      </div>
      {geoPending && (
        <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 1000 }}>
          <div className="bg-white px-3 py-2 rounded shadow">Locating…</div>
        </div>
      )}
    </div>
  )
}
