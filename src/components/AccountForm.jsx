import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Field, inputCls, btnPrimary } from './ui.jsx'

export default function AccountForm({ onDone }) {
  const { addAccount } = useStore()
  const [f, setF] = useState({ name: '', firm: '', startBalance: 50000, maxDDPct: 10, dailyDDPct: 5, profitTargetPct: 8 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await addAccount({
      name: f.name.trim(), firm: f.firm.trim(),
      startBalance: +f.startBalance, maxDDPct: +f.maxDDPct, dailyDDPct: +f.dailyDDPct,
      profitTargetPct: f.profitTargetPct === '' ? null : +f.profitTargetPct,
      })
      onDone()
    } catch (e2) { setErr(e2.message || 'Kaydedilemedi'); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Hesap adı"><input required className={inputCls} value={f.name} onChange={set('name')} placeholder="FundedNext 50K" /></Field>
      <Field label="Firma"><input className={inputCls} value={f.firm} onChange={set('firm')} placeholder="FundedNext" /></Field>
      <Field label="Başlangıç bakiyesi ($)"><input type="number" min="1" step="any" required className={inputCls} value={f.startBalance} onChange={set('startBalance')} /></Field>
      <Field label="Kâr hedefi (%), boş bırakılabilir"><input type="number" step="any" className={inputCls} value={f.profitTargetPct} onChange={set('profitTargetPct')} /></Field>
      <Field label="Max DD limiti (%)"><input type="number" min="0.1" step="any" required className={inputCls} value={f.maxDDPct} onChange={set('maxDDPct')} /></Field>
      <Field label="Daily DD limiti (%)"><input type="number" min="0.1" step="any" required className={inputCls} value={f.dailyDDPct} onChange={set('dailyDDPct')} /></Field>
      {err && <p className="text-sm text-down sm:col-span-2">{err}</p>}
      <div className="flex justify-end sm:col-span-2"><button disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>{busy ? 'Kaydediliyor…' : 'Hesap ekle'}</button></div>
    </form>
  )
}
