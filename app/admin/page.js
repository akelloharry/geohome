"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'

function AdminInner() {
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [pendingProperties, setPendingProperties] = useState([])
  const [allProperties, setAllProperties] = useState([])

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
    setAllProperties(data || [])
    setPendingProperties((data || []).filter((property) => property.verification_status === 'pending' || property.verification_status === 'pending_review'))
  }

  const reviewSubmission = async (id, action) => {
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: action === 'approve' ? 'approved' : 'rejected' })
    })
    fetchSubmissions()
    fetchProperties()
  }

  const updateUserRole = async (id, role) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role })
    })
    fetchUsers()
  }

  const updatePropertyStatus = async (id, status) => {
    await fetch('/api/admin/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    fetchProperties()
  }

  const updateUserVerified = async (id, verified) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verified })
    })
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6">
        <h1 className="text-3xl font-semibold">Admin Panel</h1>
        <p className="mt-2 text-sm text-anchorGray">Manage verifications, agent submissions, and user roles.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Pending property verifications</h2>
          <div className="mt-4 space-y-4">
            {pendingProperties.length ? pendingProperties.map((property) => (
              <div key={property.id} className="rounded-3xl bg-cloud p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{property.title || 'Untitled'}</div>
                    <div className="text-sm text-anchorGray">{property.address || 'No address'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full bg-teal px-3 py-1 text-sm text-white" onClick={() => updatePropertyStatus(property.id, 'verified')}>Approve</button>
                    <button className="rounded-full bg-estateRed px-3 py-1 text-sm text-white" onClick={() => updatePropertyStatus(property.id, 'rejected')}>Reject</button>
                  </div>
                </div>
              </div>
            )) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-anchorGray">No pending properties.</div>}
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Agent submissions</h2>
          <div className="mt-4 space-y-4">
            {submissions.length ? submissions.map((submission) => (
              <div key={submission.id} className="rounded-3xl bg-cloud p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{submission.property_type || 'Submission'} — KES {submission.rent || '—'}</div>
                    <div className="text-sm text-anchorGray">Status: {submission.status}</div>
                  </div>
                  {submission.property_id && <div className="rounded-full bg-mintHint px-3 py-1 text-xs font-semibold text-teal">Property {submission.property_id}</div>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-full bg-teal px-3 py-1 text-sm text-white" onClick={() => reviewSubmission(submission.id, 'approve')}>Approve</button>
                  <button className="rounded-full bg-estateRed px-3 py-1 text-sm text-white" onClick={() => reviewSubmission(submission.id, 'reject')}>Reject</button>
                </div>
              </div>
            )) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-anchorGray">No pending agent submissions.</div>}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border bg-white p-6">
        <h2 className="text-xl font-semibold">User management</h2>
        <div className="mt-4 space-y-4">
          {users.length ? users.map((user) => (
            <div key={user.id} className="rounded-3xl bg-cloud p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{user.full_name || user.email || user.id}</div>
                  <div className="text-sm text-anchorGray">Role: {user.role || 'tenant'} • Verified: {String(user.verified)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['tenant', 'landlord', 'agent', 'admin'].map((role) => (
                    <button key={role} className="rounded-full border px-3 py-1 text-sm" onClick={() => updateUserRole(user.id, role)}>{role}</button>
                  ))}
                  <button className="rounded-full border px-3 py-1 text-sm" onClick={() => updateUserVerified(user.id, !user.verified)}>{user.verified ? 'Unverify' : 'Verify'}</button>
                </div>
              </div>
            </div>
          )) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-anchorGray">No users found.</div>}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6">
        <h2 className="text-xl font-semibold">All properties</h2>
        <div className="mt-4 space-y-3">
          {allProperties.length ? allProperties.map((property) => (
            <div key={property.id} className="rounded-3xl bg-cloud p-4">
              <div className="font-semibold">{property.title || 'Untitled property'}</div>
              <div className="text-sm text-anchorGray">Verification: {property.verification_status || 'pending'} • Active: {property.available === false ? 'No' : 'Yes'}</div>
            </div>
          )) : <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-anchorGray">No properties available.</div>}
        </div>
      </section>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminInner />
    </ProtectedRoute>
  )
}
