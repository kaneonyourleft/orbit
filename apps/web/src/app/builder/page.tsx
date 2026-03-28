'use client'

import dynamic from 'next/dynamic'

const OrbitBuilder = dynamic(() => import('@/components/OrbitBuilder'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-zinc-50 font-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto border-4 border-[#0058BE] border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm text-zinc-800 font-black uppercase tracking-widest">Orbit Engine</p>
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Loading Page Builder...</p>
        </div>
      </div>
    </div>
  ),
})

export default function BuilderPage() {
  return <OrbitBuilder />
}
