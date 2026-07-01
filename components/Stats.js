export default function Stats({ counties, activeListings, verifiedCount, loading }) {
  const percentActive = verifiedCount > 0 ? Math.round((activeListings / verifiedCount) * 100) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Counties</div>
        <div className="mt-4 text-4xl font-bold text-white">{loading ? '...' : counties}</div>
        <div className="mt-2 text-sm text-white/60">Verified county coverage</div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Active listings</div>
        <div className="mt-4 text-4xl font-bold text-white">{loading ? '...' : activeListings}</div>
        <div className="mt-2 text-sm text-white/60">Verified and available now</div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Verified</div>
        <div className="mt-4 text-4xl font-bold text-white">{loading ? '...' : verifiedCount}</div>
        <div className="mt-2 text-sm text-white/60">{loading ? 'Loading…' : `${percentActive}% active listings`}</div>
      </div>
    </div>
  )
}
