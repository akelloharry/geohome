"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import { supabase } from '../../lib/supabaseClient'

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={['landlord']}>
      <Dashboard />
    </ProtectedRoute>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', address: '', price: '', bedrooms: '', bathrooms: '', latitude: '', longitude: '' })

  useEffect(() => {
    if (!user) return
    const role = user.user_metadata?.role || 'tenant'
    if (role === 'tenant') return router.push('/')
    if (role === 'agent') return router.push('/agent')
    if (role === 'admin') return router.push('/admin')
    fetchProperties()
    fetchInquiries()
    fetchTransactions()
  }, [user])

  async function fetchProperties() {
    const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id)
    setProperties(data || [])
  }

  async function fetchInquiries() {
    const { data } = await supabase.from('inquiries').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setInquiries(data || [])
  }

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setTransactions(data || [])
  }

  const add = async (e) => {
    e.preventDefault()
    await supabase.from('properties').insert({ ...form, owner_id: user.id })
    setShowNew(false)
    fetchProperties()
  }

  return (
    <div>
      <h1 className="text-2xl">Landlord Dashboard</h1>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button className="bg-teal text-white px-3 py-1 rounded" onClick={()=>setShowNew(true)}>Add new property</button>
        <button className="bg-mutedTeal text-white px-3 py-1 rounded" onClick={()=>router.push('/properties/new')}>Add via form</button>
      </div>
      <section className="mt-6 grid gap-4">
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold">Your properties</h2>
          <div className="mt-3 space-y-3">
            {properties.map(p => (
              <div key={p.id} className="p-3 bg-cloud rounded">
                <div className="font-semibold">{p.title || 'Untitled'}</div>
                <div className="text-sm text-anchorGray">KES {p.price} • {p.bedrooms} bd</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border rounded p-4">
            <h2 className="font-semibold">Inquiries</h2>
            <div className="mt-3 space-y-2">
              {inquiries.map(i => (
                <div key={i.id} className="p-3 bg-cloud rounded">
                  <div className="text-sm">Property ID: {i.property_id}</div>
                  <div className="text-sm text-anchorGray">{i.message}</div>
                </div>
              ))}
              {!inquiries.length && <div className="text-sm text-anchorGray">No inquiries yet.</div>}
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h2 className="font-semibold">Transactions</h2>
            <div className="mt-3 space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="p-3 bg-cloud rounded">
                  <div className="text-sm">KES {tx.amount} • {tx.status}</div>
                  <div className="text-xs text-anchorGray">Release on {new Date(tx.release_date).toLocaleDateString()}</div>
                </div>
              ))}
              {!transactions.length && <div className="text-sm text-anchorGray">No transactions yet.</div>}
            </div>
          </div>
        </div>
      </section>

      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-full max-w-md">
            <h3 className="font-semibold mb-2">New property</h3>
            <form onSubmit={add} className="space-y-2">
              <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Bedrooms" value={form.bedrooms} onChange={e=>setForm({...form,bedrooms:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Bathrooms" value={form.bathrooms} onChange={e=>setForm({...form,bathrooms:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Latitude" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} className="w-full border px-2 py-1" />
              <input placeholder="Longitude" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} className="w-full border px-2 py-1" />
              <div className="flex gap-2">
                <button className="bg-teal text-white px-3 py-1 rounded">Create</button>
                <button type="button" className="border px-3 py-1 rounded" onClick={()=>setShowNew(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
