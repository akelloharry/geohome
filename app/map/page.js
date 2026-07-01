import Map from '../../components/Map'

export default function FullMapPage() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white">
      <div className="absolute inset-0">
        <Map center={[34.7617, -0.12]} properties={[]} className="h-full w-full" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-slate-950/40 px-6 py-16 text-center backdrop-blur-sm sm:px-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-950/30">
          <h1 className="text-4xl font-black text-white sm:text-5xl">Full map view coming soon</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            This page will show all active GeoHome Kenya listings on a full-screen map.
          </p>
        </div>
      </div>
    </div>
  )
}
