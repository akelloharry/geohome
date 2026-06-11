"use client"

import { useMemo, useState } from 'react'
import Modal from './Modal'

const propertyTypeOptions = ['Bedsitter', 'Single room', '1BR', '2BR', '3BR', 'Studio', 'Maisonette', 'Townhouse', 'Bungalow', 'Hostel room', 'BnB unit']
const defaultBedrooms = {
  'Bedsitter': 0,
  'Single room': 1,
  '1BR': 1,
  '2BR': 2,
  '3BR': 3,
  'Studio': 0,
  'Maisonette': 3,
  'Townhouse': 3,
  'Bungalow': 3,
  'Hostel room': 1,
  'BnB unit': 1
}
const defaultBathrooms = {
  'Bedsitter': 1,
  'Single room': 1,
  '1BR': 1,
  '2BR': 1,
  '3BR': 2,
  'Studio': 1,
  'Maisonette': 2,
  'Townhouse': 2,
  'Bungalow': 2,
  'Hostel room': 1,
  'BnB unit': 1
}

const blankUnit = {
  id: null,
  name: '',
  property_type: 'Bedsitter',
  bedrooms: 0,
  bathrooms: 1,
  rent_price: '',
  deposit: '',
  is_vacant: true,
  available_from: '',
  photos: [],
  video_url: '',
  photoFiles: [],
  videoFile: null
}

export default function UnitManager({ units, setUnits, onDeleteUnit }) {
  const [editingUnit, setEditingUnit] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkInfo, setBulkInfo] = useState({ count: 3, prefix: 'Room', start: 1 })

  const openNewUnit = () => setEditingUnit({ ...blankUnit })
  const closeUnitModal = () => setEditingUnit(null)
  const openBulkModal = () => setBulkOpen(true)
  const closeBulkModal = () => setBulkOpen(false)

  const saveUnit = () => {
    if (!editingUnit.name || !editingUnit.rent_price) return
    setUnits((current) => {
      const next = current.filter((item) => item.id !== editingUnit.id)
      return [...next, { ...editingUnit, id: editingUnit.id || `temp-${Date.now()}` }]
    })
    closeUnitModal()
  }

  const deleteUnit = (unitId) => {
    setUnits((current) => current.filter((unit) => unit.id !== unitId))
    onDeleteUnit && onDeleteUnit(unitId)
  }

  const handleTypeChange = (value) => {
    setEditingUnit((u) => ({
      ...u,
      property_type: value,
      bedrooms: defaultBedrooms[value],
      bathrooms: defaultBathrooms[value]
    }))
  }

  const addBulkUnits = () => {
    const count = Number(bulkInfo.count) || 1
    const start = Number(bulkInfo.start) || 1
    const prefix = bulkInfo.prefix || 'Room'
    const newUnits = Array.from({ length: count }, (_, idx) => {
      const name = `${prefix} ${start + idx}`
      const property_type = 'Bedsitter'
      return {
        ...blankUnit,
        id: `bulk-${Date.now()}-${idx}`,
        name,
        property_type,
        bedrooms: defaultBedrooms[property_type],
        bathrooms: defaultBathrooms[property_type]
      }
    })
    setUnits((current) => [...current, ...newUnits])
    closeBulkModal()
  }

  const sortedUnits = useMemo(() => [...units].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [units])

  return (
    <section className="space-y-4 rounded-3xl border bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Units management</h2>
          <p className="text-sm text-anchorGray">Add, edit, and track individual units for this property.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-full bg-teal px-4 py-2 text-sm text-white" onClick={openNewUnit}>Add unit</button>
          <button type="button" className="rounded-full border border-teal px-4 py-2 text-sm text-teal" onClick={openBulkModal}>Bulk add</button>
        </div>
      </div>

      {sortedUnits.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-anchorGray">No units added yet.</div>
      ) : (
        <div className="space-y-4">
          {sortedUnits.map((unit) => (
            <div key={unit.id} className="rounded-3xl border p-4 bg-cloud">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{unit.name || 'Unnamed unit'}</div>
                  <div className="text-sm text-anchorGray">{unit.property_type} • {unit.bedrooms} bd • {unit.bathrooms} ba</div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className={`rounded-full px-2 py-1 ${unit.is_vacant ? 'bg-mintHint text-teal' : 'bg-estateRed/10 text-estateRed'}`}>{unit.is_vacant ? 'Vacant' : 'Booked'}</span>
                  {unit.available_from && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">From {new Date(unit.available_from).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="text-sm text-anchorGray">Rent: KES {unit.rent_price || '—'}</div>
                <div className="text-sm text-anchorGray">Deposit: KES {unit.deposit || '—'}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="rounded-full border border-teal px-3 py-2 text-sm text-teal" onClick={() => setEditingUnit(unit)}>Edit</button>
                <button type="button" className="rounded-full border border-estateRed px-3 py-2 text-sm text-estateRed" onClick={() => deleteUnit(unit.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editingUnit} onClose={closeUnitModal}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{editingUnit?.id ? 'Edit unit' : 'Add unit'}</h3>
              <p className="text-sm text-anchorGray">Unit details and pricing.</p>
            </div>
            <button className="text-sm text-anchorGray hover:text-teal" onClick={closeUnitModal}>Close</button>
          </div>

          <div className="grid gap-4">
            <input type="text" required value={editingUnit?.name || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, name: e.target.value }))} placeholder="Unit number / name" className="w-full border rounded-lg px-4 py-3" />
            <select value={editingUnit?.property_type || 'Bedsitter'} onChange={(e) => handleTypeChange(e.target.value)} className="w-full border rounded-lg px-4 py-3">
              {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" min="0" value={editingUnit?.bedrooms ?? 0} onChange={(e) => setEditingUnit((u) => ({ ...u, bedrooms: Number(e.target.value) }))} placeholder="Bedrooms" className="w-full border rounded-lg px-4 py-3" />
              <input type="number" min="0" value={editingUnit?.bathrooms ?? 1} onChange={(e) => setEditingUnit((u) => ({ ...u, bathrooms: Number(e.target.value) }))} placeholder="Bathrooms" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" required min="0" value={editingUnit?.rent_price || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, rent_price: e.target.value }))} placeholder="Rent price" className="w-full border rounded-lg px-4 py-3" />
              <input type="number" min="0" value={editingUnit?.deposit || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, deposit: e.target.value }))} placeholder="Deposit amount" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <input type="checkbox" checked={editingUnit?.is_vacant ?? true} onChange={(e) => setEditingUnit((u) => ({ ...u, is_vacant: e.target.checked }))} /> Vacancy open
              </label>
              <input type="date" value={editingUnit?.available_from || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, available_from: e.target.value }))} className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Unit photos (max 5)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setEditingUnit((u) => ({ ...u, photoFiles: Array.from(e.target.files || []) }))} className="w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Unit video (max 1)</label>
              <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => setEditingUnit((u) => ({ ...u, videoFile: e.target.files?.[0] || null }))} className="w-full" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="rounded-full border px-4 py-2 text-sm text-anchorGray" onClick={closeUnitModal}>Cancel</button>
              <button type="button" onClick={saveUnit} className="rounded-full bg-teal px-4 py-2 text-sm text-white">Save unit</button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen} onClose={closeBulkModal}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Bulk add units</h3>
              <p className="text-sm text-anchorGray">Create placeholder units that can be edited later.</p>
            </div>
            <button className="text-sm text-anchorGray hover:text-teal" onClick={closeBulkModal}>Close</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input type="number" min="1" value={bulkInfo.count} onChange={(e) => setBulkInfo((prev) => ({ ...prev, count: Number(e.target.value) }))} className="w-full border rounded-lg px-4 py-3" placeholder="Count" />
            <input type="text" value={bulkInfo.prefix} onChange={(e) => setBulkInfo((prev) => ({ ...prev, prefix: e.target.value }))} className="w-full border rounded-lg px-4 py-3" placeholder="Prefix" />
            <input type="number" min="1" value={bulkInfo.start} onChange={(e) => setBulkInfo((prev) => ({ ...prev, start: Number(e.target.value) }))} className="w-full border rounded-lg px-4 py-3" placeholder="Start" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="rounded-full border px-4 py-2 text-sm text-anchorGray" onClick={closeBulkModal}>Cancel</button>
            <button type="button" onClick={addBulkUnits} className="rounded-full bg-teal px-4 py-2 text-sm text-white">Create placeholders</button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
