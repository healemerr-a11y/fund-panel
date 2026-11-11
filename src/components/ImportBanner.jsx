import { useState } from 'react'
import { useStore } from '../lib/store.jsx'

export default function ImportBanner() {
  const { localCount, importLocal } = useStore()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!localCount) return null
  const run = async () => {
    setBusy(true); setErr('')
    try { await importLocal() } catch (e) { setErr(e.message); setBusy(false) }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/40 bg-brand/10 p-4 text-sm text-slate-200">
      <p>Bu tarayıcıda {localCount.accounts} hesap ve {localCount.trades} trade bulundu. Supabase'e taşınsın mı?{err && <span className="ml-2 text-down">{err}</span>}</p>
      <button onClick={run} disabled={busy} className="rounded-md bg-brand px-4 py-2 font-medium text-white disabled:opacity-60">
        {busy ? 'Taşınıyor…' : 'İçe aktar'}
      </button>
    </div>
  )
}
