"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'

function AdminInner() {
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])

  useEffect(() => {
    fetchSubmissions()
    fetchUsers()
    fetchProperties()
  }, [])

  async function fetchSubmissions() {
    const res = await fetch('/api/admin/submissions')
    const data = await res.json()
    setSubmissions(data || [])
  }

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data || [])
  }

  async function fetchProperties() {
    const res = await fetch('/api/admin/properties')
    const data = await res.json()
    setProperties(data || [])
  }

  const review = async (id, action) => {
    await fetch('/api/admin/submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: action === 'approve' ? 'approved' : 'rejected' }) })
    fetchSubmissions()
  }

  const updateUserRole = async (id, role) => {
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) })
    fetchUsers()
  }

  const updateProperty = async (id, status) => {
    await fetch('/api/admin/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    fetchProperties()
  }

  return (
    <div>
      <h1 className="text-2xl">Admin Panel</h1>
      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <section className="bg-white border rounded p-4">
          <h2 className="font-semibold">Pending Agent Submissions</h2>
          <div className="space-y-3 mt-2">
            {submissions.map(s => (
              <div key={s.id} className="p-3 bg-cloud rounded">
                <div>{s.property_type} — KES {s.rent}</div>
                <div className="mt-2 flex gap-2">
                  <button className="bg-teal text-white px-2 py-1 rounded" onClick={()=>review(s.id,'approve')}>Approve</button>
                  <button className="bg-estateRed text-white px-2 py-1 rounded" onClick={()=>review(s.id,'reject')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white border rounded p-4">
          <h2 className="font-semibold">User Management</h2>
          <div className="space-y-3 mt-2">
            {users.map(user => (
              <div key={user.id} className="p-3 bg-cloud rounded">
                <div className="font-semibold">{user.email}</div>
                <div className="text-sm text-anchorGray">Role: {user.user_metadata?.role || 'anon'}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['tenant','landlord','agent','admin'].map(role => (
                    <button key={role} className="border px-2 py-1 rounded text-sm" onClick={()=>updateUserRole(user.id, role)}>{role}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-4 bg-white border rounded p-4">
        <h2 className="font-semibold">Properties</h2>
        <div className="mt-3 space-y-3">
          {properties.map(p => (
            <div key={p.id} className="p-3 bg-cloud rounded">
              <div>{p.title} — {p.property_type}</div>
              <div className="text-sm text-anchorGray">Verification status: {p.verification_status}</div>
              <div className="mt-2 flex gap-2">
                <button className="bg-teal text-white px-2 py-1 rounded" onClick={()=>updateProperty(p.id,'verified')}>Verified</button>
                <button className="bg-estateRed text-white px-2 py-1 rounded" onClick={()=>updateProperty(p.id,'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminInner />
    </ProtectedRoute>
  )
}
